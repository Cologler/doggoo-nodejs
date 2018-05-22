'use strict';

const URL = require('url');

const { ioc } = require('@adonisjs/fold');
const jsdom = require('jsdom');
const bhttp = require("bhttp");

const { HandlerBase } = require('../handlers/handler');
const { Chapter } = require('../models/sections');
const { ChapterContext, NodeVisitor } = require('../core/node-visitor');
const { MessageError } = require('../err');

function match() {
    const options = ioc.use('options');
    let url = URL.parse(options.source);
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
    const options = ioc.use('options');
    let url = URL.parse(options.source);
    if (url && url.hostname === 'www.lightnovel.cn') {
        // example: `/forum.php?mod=viewthread&tid=910583&extra=page%3D1%26filter%3Dtypeid%26typeid%3D367%26orderby%3Dviews`
        if ('/forum.php' === url.pathname) {
            const query = new URL.URLSearchParams(url.query);
            return `https://www.lightnovel.cn/thread-${query.get('tid')}-1-1.html`;
        }
    }
    return options.source;
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

class LightNovelUrl {
    constructor(url) {
        this._url = url;
    }

    get value() {
        return this._url.href;
    }

    get ThreadId() { throw new Error(); }

    get PageIndex() { throw new Error(); }

    changePageIndex(newPageIndex) { throw new Error(); }

    /**
     *
     *
     * @static
     * @param {string} urlString
     * @memberof LightNovelUrl
     */
    static parse(urlString) {
        let url = URL.parse(urlString);
        if (url.pathname === '/forum.php') {
            return new PhpLightNovelUrl(url);
        } else {
            return new UniLightNovelUrl(url);
        }
    }
}

/**
 * url format like `https://www.lightnovel.cn/thread-924341-1-1.html`.
 *
 * @class UniLightNovelUrl
 * @extends {IUrlBuilder}
 */
class UniLightNovelUrl extends LightNovelUrl {
    constructor(url) {
        super(url);

        const match = url.pathname.match(/^\/thread-(\d+)-(\d+)-1.html$/);
        if (match === null) {
            throw Error(`unknown url path <${url.pathname}>`);
        }

        this._threadId = match[1];
        this._pageIndex = match[2];
    }

    get ThreadId() { return this._threadId; }

    get PageIndex() { return this._pageIndex; }

    changePageIndex(newPageIndex) {
        return `https://www.lightnovel.cn/thread-${this._threadId}-${newPageIndex}-1.html`;
    }
}

/**
 * url format like `https://www.lightnovel.cn/forum.php?mod=viewthread&tid=924341&extra=&authorid=989041&page=4`.
 *
 * @class PhpLightNovelUrl
 * @extends {IUrlBuilder}
 */
class PhpLightNovelUrl extends LightNovelUrl {
    constructor(url) {
        super(url);

        this._query = new URL.URLSearchParams(url.query);

        this._threadId = this._query.get('tid');
        this._pageIndex = this._query.get('page');
    }

    get ThreadId() { return this._threadId; }

    get PageIndex() { return this._pageIndex; }

    changePageIndex(newPageIndex) {
        const newUrl = new URL.URL(this.value);
        const param = newUrl.searchParams;
        param.set('page', newPageIndex.toString());
        newUrl.search = param.toString();
        return newUrl.toString();
    }
}

function parseFloor(text) {
    text = text.trim();
    const match = text.match(/^(\d+)楼$/);
    if (!match) throw Error(text);
    return Number(match[1]);
}

function detectTotalPageCount(window) {
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
        const url = LightNovelUrl.parse(href);
        return Number(url.PageIndex);
    } else {
        return 1;
    }
}

class LightNovelParser extends HandlerBase {
    constructor() {
        super();
        this._parseChapterIndex = 0;
        this._range = null;
        this._url = null;
        this._options = ioc.use('options');
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

        if (chapter.textLength > this._options.limitChars) {
            novel.add(chapter);
        }
    }

    initSession(session) {
        const options = ioc.use('options');
        this._url = LightNovelUrl.parse(options.source);

        this._range = session.appopt.range;

        const headers = {};
        const cookie = session.appopt.cookie;
        if (cookie) {
            headers.cookie = cookie;
            console.log('[INFO] init session with cookie.');
        } else {
            console.log('[INFO] init session without cookie.');
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

    async run(session) {
        this.initSession(session);
        const wnurl = getWellknownUrl(session);
        let url = URL.parse(wnurl);
        const response = await session.http.get(this._url.value);
        const dom = this.asDom(url, response.body.toString());
        this.checkDom(dom);
        let last = this.parse(session, dom);
        const maxPageIndex = detectTotalPageCount(dom.window);
        if (maxPageIndex > 1) {
            const pgs = [...Array(maxPageIndex - 1).keys()].map(z => z + 2);
            for (const pg of pgs) {
                const url = this._url.changePageIndex(pg);
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

            ['style', 'script', '.pstatus', '.tip', '.quote'].forEach(x => {
                // quote 是引用，但有时引用也有正文内容
                content.querySelectorAll(x).forEach(c => c.remove());
            });

            this.parseChapter(session, window, content);
        });
    }
}

module.exports = {
    match,
    Parser: LightNovelParser
};
