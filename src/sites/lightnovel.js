'use strict';

const URL = require('url');

const jsdom = require('jsdom');
const bhttp = require("bhttp");

const { appopt } = require('../options');
const { Range } = require('../utils/range');
const { HandlerBase } = require('../handlers/handler');
const { Chapter } = require('../models/sections');
const { ChapterContext, NodeVisitor } = require('../core/node-visitor');
const { MessageError } = require('../err');

function match() {
    let url = URL.parse(appopt().source);
    if (url && url.hostname === 'www.lightnovel.cn') {
        // example: `/forum.php?mod=viewthread&tid=910583&extra=page%3D1%26filter%3Dtypeid%26typeid%3D367%26orderby%3Dviews`
        if ('/forum.php' === url.pathname) {
            const query = new URL.URLSearchParams(url.query);
            return query.has('tid');
        }

        // example: `/thread-901251-1-1.html`
        if (/^\/thread-\d+-1-1.html$/.test(url.pathname)) {
            return true;
        }
    }
    return false;
}

function getWellknownUrl() {
    let url = URL.parse(appopt().source);
    if (url && url.hostname === 'www.lightnovel.cn') {
        // example: `/forum.php?mod=viewthread&tid=910583&extra=page%3D1%26filter%3Dtypeid%26typeid%3D367%26orderby%3Dviews`
        if ('/forum.php' === url.pathname) {
            const query = new URL.URLSearchParams(url.query);
            return `https://www.lightnovel.cn/thread-${query.get('tid')}-1-1.html`;
        }
    }
    return appopt().source;
}

class LightNovelNodeVisitor extends NodeVisitor {
    visitElementNode(context) {
        switch (context.node.tagName) {
            case 'IMG':
                let url = context.node.getAttribute('file');
                if (url === null) {
                    url = context.node.src;
                }
                url = this.absUrl(context.window, url);
                context.chapter.addImage(url);
                break;

            case 'IGNORE_JS_OP':
                this.visitInner(context);
                break;

            default:
                super.visitElementNode(context);
                break;
        }
    }
}


function parseFloor(text) {
    text = text.trim();
    const match = text.match(/^(\d+)楼$/);
    if (!match) throw Error(text);
    return Number(match[1]);
}

function getMaxPageIndex() {
    const window = this.window;
    const last = window.document.querySelector('a.last');
    let href = null;
    if (last) {
        href = last.href;
    } else {
        const pgs = Array.from(window.document.querySelectorAll('.pgt .pg a'));
        if (pgs.length > 0) {
            if (!pgs[pgs.length - 1].classList.contains('nxt')) {
                throw Error();
            }
            href = pgs[pgs.length - 2].href;
        }
    }
    if (href) {
        let url = URL.parse(href);
        const match = url.pathname.match(/^\/thread-\d+-(\d+)-1.html$/);
        if (match === null) {
            throw Error(`cannot parse max page index from ${url.pathname}`);
        }
        return match[1];
    } else {
        return 1;
    }
}

class LightNovelParser extends HandlerBase {
    constructor() {
        super();
        this._parseChapterIndex = 0;
        this._range = null;
    }

    get name() {
        return 'LightNovel';
    }

    parseNovelInfo(novel, lines) {
        { // title
            if (lines.length > 0) {
                novel.title = lines[0];
            }
            lines = lines.slice(1);
        }

        {
            for (const line of lines) {
                if (/作者/.test(line)) {
                    const match = line.match(/作者[：:]\s*(\W+)\s*$/);
                    if (match) {
                        novel.author = match[1];
                    }
                }
            }
        }
    }

    parseChapter(session, window, node) {
        this._parseChapterIndex++;

        const visitor = new LightNovelNodeVisitor(session);
        const chapter = new Chapter();
        const chapterContext = new ChapterContext(window, chapter);
        const novel = session.novel;
        try {
            node.childNodes.forEach(z => {
                visitor.visit(chapterContext.createChildNode(z));
            });
        } catch (error) {
            const href = window['raw-href'];
            console.log(`error on ${href}`);
            throw error;
        }

        if (this._parseChapterIndex === 1) {
            this.parseNovelInfo(novel, chapter.textContents);
        }

        if (chapter.textLength > 100) {
            novel.add(chapter);
        }
    }

    initSession(session) {
        const range = session.appopt.range;
        if (range) {
            this._range = new Range(range);
        }

        const headers = {};
        const cookie = session.appopt.cookie;
        if (cookie) {
            headers.cookie = cookie;
            console.log('[INFO] init session with cookie.')
        } else {
            console.log('[INFO] init session without cookie.')
        }
        session.http = bhttp.session({
            headers,
            cookieJar: false
        });
    }

    checkDom(dom) {
        const messagetext = dom.window.document.querySelector('#messagetext');
        if (messagetext) {
            throw new MessageError(messagetext.textContent);
        }
    }

    async handle(session) {
        this.initSession(session);
        const wnurl = getWellknownUrl(session);
        let url = URL.parse(wnurl);
        const match = url.pathname.match(/^\/thread-(\d+)-1-1.html$/);
        const threadId = match[1];
        const response = await session.http.get(wnurl);
        const dom = this.asDom(url, response.body.toString());
        this.checkDom(dom);
        dom.getMaxPageIndex = getMaxPageIndex;
        let last = this.parse(session, dom);
        const maxPageIndex = dom.getMaxPageIndex();
        if (maxPageIndex > 1) {
            const pgs = [...Array(maxPageIndex - 1).keys()].map(z => z + 2);
            for (const pg of pgs) {
                const url = `https://www.lightnovel.cn/thread-${threadId}-${pg}-1.html`;
                last = this.downloadAndParse(session, url, last);
            }
        }
        if (last) {
            await last;
        }
    }

    asDom(url, body) {
        const dom = new jsdom.JSDOM(body);
        const u = URL.parse(url);
        dom.window['raw-protocol'] = u.protocol;
        dom.window['raw-host'] = u.host;
        dom.window['raw-href'] = url;
        return dom;
    }

    async downloadAndParse(session, url, lastPromise) {
        const response = await session.http.get(url);
        const dom = this.asDom(url, response.body.toString());
        if (lastPromise) {
            await lastPromise;
        }
        this.parse(session, dom);
    }

    parse(session, dom) {
        const window = dom.window;
        const posters = Array.from(window.document.querySelectorAll('#postlist .plhin'));
        posters.forEach(z => {
            const posterId = z.id;
            if (this._range) {
                const posterId = z.id.substr(3);
                const rangeText = z.querySelector(`#postnum${posterId}`).textContent;
                const floor = parseFloor(rangeText);
                if (!this._range.in(floor)) {
                    return;
                }
            }
            const content = z.querySelector('.pct .t_f');
            if (content === null) {
                // maybe: 作者被禁止或删除 内容自动屏蔽
                console.info(`[INFO] poster ${posterId} (page) has not content.`);
                return;
            }
            ['style', 'script', '.pstatus', '.quote', '.tip'].forEach(x => {
                content.querySelectorAll(x).forEach(c => c.remove());
            });
            this.parseChapter(session, window, content);
        });
    }
}

module.exports = {
    match,
    Parser: LightNovelParser
}
