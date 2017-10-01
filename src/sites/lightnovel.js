'use strict';

const { HandlerBase } = require('../handlers/handler');
const URL = require('url');
const { Chapter } = require('../models/sections');
const jsdom = require('jsdom');
const NodeVisitor = require('../core/node-visitor');
const bhttp = require("bhttp");

class LightNovelParser extends HandlerBase {
    constructor() {
        super();
        this._parseChapterIndex = 0;
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

        const visitor = new NodeVisitor(context);
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

    async handle(context) {
        let url = URL.parse(context.source);
        const match = url.pathname.match(/^\/thread-(\d+)-1-1.html$/);
        const threadId = match[1];
        const response = await bhttp.get(context.source);
        const dom = new jsdom.JSDOM(response.body.toString());
        const maxPageIndex = this.parseMaxPageIndex(dom);
        let last = this.parse(context, dom);
        const pgs = [...Array(maxPageIndex - 1).keys()].map(z => z + 2);
        for (const pg of pgs) {
            const url = `https://www.lightnovel.cn/thread-${threadId}-${pg}-1.html`;
            last = this.downloadAndParse(context, url, last);
        }
        await last;
    }

    parseMaxPageIndex(dom) {
        const window = dom.window;
        const last = window.document.querySelector('a.last');
        let href;
        if (last) {
            href = last.href;
        } else {
            const pgs = Array.from(window.document.querySelectorAll('.pgt .pg a'));
            if (!pgs[pgs.length - 1].classList.contains('nxt')) {
                throw Error();
            }
            href = pgs[pgs.length - 2].href;
        }
        let url = URL.parse(href);
        const match = url.pathname.match(/^\/thread-\d+-(\d+)-1.html$/);
        return match[1];
    }

    async downloadAndParse(context, url, lastPromise) {
        const response = await bhttp.get(url);
        const dom = new jsdom.JSDOM(response.body.toString());
        await lastPromise;
        this.parse(context, dom);
    }

    parse(context, dom) {
        const window = dom.window;
        const posters = Array.from(window.document.querySelectorAll('#postlist .pct .t_f'));
        posters.forEach(z => {
            ['style', 'script', '.pstatus', '.quote'].forEach(x => {
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
