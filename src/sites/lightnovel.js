'use strict';

const assert = require('assert');
const URL = require('url');

const jsdom = require('jsdom');
const bhttp = require("bhttp");

const { HandlerBase } = require('../handlers/handler');
const { Chapter } = require('../models/sections');
const NodeVisitor = require('../core/node-visitor');

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


function parseFloor(text) {
    text = text.trim();
    const match = text.match(/^(\d+)楼$/);
    if (!match) throw Error(text);
    return Number(match[1]);
}


class Range {
    constructor() {
        let min = null;
        let max = null;
        if (arguments.length === 1) {
            const source = arguments[0];
            assert.strictEqual(typeof source, 'string');
            const match = source.match(/^(\d+)-(\d+)?$/);
            if (!match || (match[1] || match[2]) === undefined) {
                throw Error(`${source} is invalid range args. try input like '1-15'`);
            }
            assert.strictEqual(match.length, 3);
            min = match[1] ? Number(match[1]) : null;
            max = match[2] ? Number(match[2]) : null;
        } else if (arguments.length === 2) {
            min = arguments[0];
            max = arguments[1];
            assert.strictEqual(typeof min, 'number');
            assert.strictEqual(typeof min, 'number');
        }
        this._min = min;
        this._max = max;
        console.log(`[INFO] configured range [${min}, ${max}].`);
    }

    in(value) {
        if (typeof this._min === 'number') {
            if (value < this._min) {
                return false;
            }
        }
        if (typeof this._max === 'number') {
            if (value > this._max) {
                return false;
            }
        }
        return true;
    }
}


class LightNovelParser extends HandlerBase {
    constructor() {
        super();
        this._parseChapterIndex = 0;
        this._floor = null;
        this._options.push('cookie', 'floor');
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

        const visitor = new LightNovelNodeVisitor(context);
        const novel = context.novel;
        const chapter = new Chapter();
        try {
            node.childNodes.forEach(z => {
                visitor.visit(window, chapter, z);
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

    initSession(context) {
        const floor = context.args.floor;
        if (floor) {
            this._floor = new Range(floor);
        }

        const headers = {};
        const cookie = context.args.cookie;
        if (cookie) {
            headers.cookie = cookie;
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
        let last = this.parse(context, dom);
        const maxPageIndex = this.parseMaxPageIndex(dom);
        if (maxPageIndex > 1) {
            const pgs = [...Array(maxPageIndex - 1).keys()].map(z => z + 2);
            for (const pg of pgs) {
                const url = `https://www.lightnovel.cn/thread-${threadId}-${pg}-1.html`;
                last = this.downloadAndParse(context, url, last);
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
        const posters = Array.from(window.document.querySelectorAll('#postlist .plhin'));
        posters.forEach(z => {
            if (this._floor) {
                const posterId = z.id.substr(3);
                const floorText = z.querySelector(`#postnum${posterId}`).textContent;
                const floor = parseFloor(floorText);
                if (!this._floor.in(floor)) {
                    return;
                }
            }
            const content = z.querySelector('.pct .t_f');
            ['style', 'script', '.pstatus', '.quote', '.tip'].forEach(x => {
                content.querySelectorAll(x).forEach(c => c.remove());
            });
            this.parseChapter(context, window, content);
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
