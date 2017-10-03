'use strict';

const { HandlerBase } = require('../handlers/handler');
const URL = require('url');
const { Chapter } = require('../models/sections');
const jsdom = require('jsdom');
const NodeVisitor = require('../core/node-visitor');
const bhttp = require("bhttp");

class LightNovelNodeVisitor extends NodeVisitor {
    visitElementNode(window, chapter, node) {
        switch (node.tagName) {
            case 'IMG':
                let url = node.getAttribute('file');
                if (url === null) {
                    url = node.src;
                }
                url = this.absUrl(window, url);
                chapter.addImage(url);
                break;

            case 'IGNORE_JS_OP':
                this.visitInner(window, chapter, node);
                break;

            default:
                super.visitElementNode(window, chapter, node);
                break;
        }
    }
}

class LightNovelParser extends HandlerBase {
    constructor() {
        super();
        this._parseChapterIndex = 0;
    }

    get name() {
        return 'LightNovel';
    }

    registerArgs(args) {
        args.register('--cookie');
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
                    const match = line.match(/作者[：:]?\s*(\W+)\s*$/);
                    if (match) {
                        novel.author = match[1];
                    }
                }
            }
        }
    }

    parseChapter(context, window, node) {
        this._parseChapterIndex++;

        const visitor = new LightNovelNodeVisitor(context);
        const novel = context.novel;
        const chapter = new Chapter();
        node.childNodes.forEach(z => {
            visitor.visit(window, chapter, z);
        });

        if (this._parseChapterIndex === 1) {
            this.parseNovelInfo(novel, chapter.textContents);
        }

        if (chapter.textLength > 100) {
            novel.add(chapter);
        }
    }

    initSession(context) {
        const headers = {};
        if (context.args['--cookie']) {
            headers.cookie = context.args['--cookie'];
            console.log('[INFO] init session with cookie.')
        } else {
            console.log('[INFO] init session without cookie.')
        }
        context.http = bhttp.session({
            headers,
            cookieJar: false
        });
    }

    async handle(context) {
        this.initSession(context);
        let url = URL.parse(context.source);
        const match = url.pathname.match(/^\/thread-(\d+)-1-1.html$/);
        const threadId = match[1];
        const response = await context.http.get(context.source);
        const dom = this.asDom(url, response.body.toString());
        const maxPageIndex = this.parseMaxPageIndex(dom);
        let last = this.parse(context, dom);
        const pgs = [...Array(maxPageIndex - 1).keys()].map(z => z + 2);
        for (const pg of pgs) {
            const url = `https://www.lightnovel.cn/thread-${threadId}-${pg}-1.html`;
            last = this.downloadAndParse(context, url, last);
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

    parseMaxPageIndex(dom) {
        const window = dom.window;
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
            return match[1];
        } else {
            return 1;
        }
    }

    async downloadAndParse(context, url, lastPromise) {
        const response = await context.http.get(url);
        const dom = this.asDom(url, response.body.toString());
        if (lastPromise) {
            await lastPromise;
        }
        this.parse(context, dom);
    }

    parse(context, dom) {
        const window = dom.window;
        const posters = Array.from(window.document.querySelectorAll('#postlist .pct .t_f'));
        posters.forEach(z => {
            ['style', 'script', '.pstatus', '.quote', '.tip'].forEach(x => {
                z.querySelectorAll(x).forEach(c => c.remove());
            });
        });
        posters.forEach(z => {
            this.parseChapter(context, window, z);
        });
    }
}

function match(context) {
    let url = URL.parse(context.source);
    if (url && url.hostname === 'www.lightnovel.cn') {
        // example: `/thread-901251-1-1.html`
        return /^\/thread-\d+-1-1.html$/.test(url.pathname);
    }
    return false;
}

module.exports = {
    match,
    Parser: LightNovelParser
}
