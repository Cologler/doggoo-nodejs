'use strict';

const URL = require('url');

const { ioc } = require('@adonisjs/fold');
const jsdom = require('jsdom');
const bhttp = require("bhttp");

const { HandlerBase } = require('../handlers/handler');
const { Chapter } = require('../models/sections');
const { ChapterContext, NodeVisitor } = require('../core/node-visitor');
const { MessageError } = require('../err');
const { getAbsoluteUrl } = require('../utils/url-utils');

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
    /**
     * Creates an instance of UniLightNovelUrl.
     * @param {URL.Url} url
     * @memberof UniLightNovelUrl
     */
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
    /**
     * Creates an instance of PhpLightNovelUrl.
     * @param {URL.Url} url
     * @memberof PhpLightNovelUrl
     */
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

function createWebClient(options) {
    const headers = {};
    const cookie = options.cookie;
    if (cookie) {
        headers.cookie = cookie;
        console.log('[INFO] init http with cookie.');
    } else {
        console.log('[INFO] init http without cookie.');
    }

    // web client
    const http = bhttp.session({
        headers,
        cookieJar: false
    });
    return http;
}

class LightNovelParser extends HandlerBase {
    constructor() {
        super();
        this._options = ioc.use('options');
        this._range = this._options.range;
        this._url = LightNovelUrl.parse(this._options.source);

        /** @type {Chapter[]} */
        this._chapters = [];
        this._http = createWebClient(this._options);
        this._threadSubject = null;
    }

    get name() {
        return 'LightNovel';
    }

    /**
     *
     *
     * @param {any} novel
     * @param {string[]} lines
     * @memberof LightNovelParser
     */
    parseNovelInfo(novel, lines) {
        // title
        const firstLine = lines[0] || null;
        if (firstLine) {
            if (!/^[\-=]+$/.test(firstLine)) {
                novel.title = firstLine || null;
                lines = lines.slice(1);
            }
        }

        if (novel.title === null) {
            novel.title = this._threadSubject;
        }

        // author
        for (const line of lines) {
            if (/作者/.test(line)) {
                const match = line.match(/作者[：:]\s*(\W+)\s*$/);
                if (match) {
                    novel.author = match[1];
                    break;
                }
            }
        }
    }

    parseChapter(session, window, node) {
        const visitor = new NodeVisitor(session);
        visitor.addVisitInnerTagName('IGNORE_JS_OP');

        const chapter = new Chapter();
        const chapterContext = new ChapterContext(window, chapter);
        node.childNodes.forEach(z => {
            visitor.visit(chapterContext.createChildNode(z));
        });

        this._chapters.push(chapter);
    }

    async run(session) {

        /** @type {Promise<jsdom.JSDOM>[]} */
        const asyncDoms = [];
        const urls = [];
        const firstUrl = this._url.changePageIndex(1);
        urls.push(firstUrl);
        asyncDoms.push(this._getDomAsync(firstUrl));
        const firstDom = await asyncDoms[0];
        this._checkDom(firstDom);
        const maxPageIndex = detectTotalPageCount(firstDom.window);
        if (maxPageIndex > 1) {
            const pgs = [...Array(maxPageIndex - 1).keys()].map(z => z + 2); // 2 ~ max
            for (const pg of pgs) {
                const url = this._url.changePageIndex(pg);
                urls.push(url);
                asyncDoms.push(this._getDomAsync(url));
            }
        }

        for (let i = 0; i < asyncDoms.length; i++) {
            const url = urls[i];
            const asyncDom = asyncDoms[i];
            const dom = await asyncDom;
            this._parse(session, dom, url);
        }

        const novel = session.novel;

        // resolve novel info
        if (this._chapters.length > 0) {
            this.parseNovelInfo(novel, this._chapters[0].textContents);
        }

        // add resolved chapters to novel.
        this._chapters.forEach(chapter => {
            if (chapter.textLength > this._options.limitChars) {
                novel.add(chapter);
            }
        });
    }

    async _getDomAsync(url) {
        const response = await this._http.get(url);
        const dom = new jsdom.JSDOM(response.body.toString());
        return dom;
    }

    _checkDom(dom) {
        const messagetext = dom.window.document.querySelector('#messagetext');
        if (messagetext) {
            throw new MessageError(messagetext.textContent);
        }
    }

    _parse(session, dom, baseUrlString) {
        try {
            this._parseCore(session, dom, baseUrlString);
        } catch (error) {
            console.log(`error on ${baseUrlString}`);
            throw error;
        }
    }

    /**
     *
     *
     * @param {any} session
     * @param {any} dom
     * @param {string} baseUrlString
     * @memberof LightNovelParser
     */
    _parseCore(session, dom, baseUrlString) {
        const window = dom.window;

        const threadSubject = document.querySelector('#thread_subject');
        if (threadSubject) {
            this._threadSubject = threadSubject.textContent;
        }

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

            // handle images
            content.querySelectorAll('img').forEach(z => {
                let imgUrl = z.getAttribute('file');
                if (imgUrl === null) {
                    imgUrl = z.src;
                }
                z.setAttribute('src', getAbsoluteUrl(baseUrlString, imgUrl));
            });

            this.parseChapter(session, window, content);
        });
    }
}

module.exports = {
    match,
    Parser: LightNovelParser
};
