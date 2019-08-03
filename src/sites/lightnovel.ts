'use strict';

import URL from 'url';

import request from 'request-promise-native';
import jsdom, { toughCookie } from 'jsdom';
import { DOMWindow, JSDOM } from 'jsdom';
import { ioc } from 'anyioc';

import { AppOptions } from '../options';
import { Logger } from '../utils/logger';
import { Range } from "../utils/range";
import { Chapter } from '../models/sections';
import { Novel } from '../models/novel';
import { ChapterContext, NodeVisitor } from '../core/node-visitor';
import { getAbsoluteUrl } from '../utils/url-utils';
import { IParser, DoggooFlowContext } from '../doggoo';
import { NotNull } from '../utils/contract';
import { Elements } from '../models/elements';

function match(): boolean {
    const options = ioc.getRequired<AppOptions>(AppOptions);
    return !!options.source && matchUrl(options.source);
}

export function matchUrl(urlString: string): boolean {
    let url = URL.parse(urlString);
    if (url && url.hostname!.match(/^(www\.)?lightnovel\.(cn|us)$/)) {
        // example: `/forum.php?mod=viewthread&tid=910583&extra=page%3D1%26filter%3Dtypeid%26typeid%3D367%26orderby%3Dviews`
        if ('/forum.php' === url.pathname) {
            const query = new URL.URLSearchParams(<string>url.query);
            return query.has('tid');
        }

        // example: `/thread-901251-1-1.html`
        if (/^\/thread-\d+-1-\d+.html$/.test(<string>url.pathname)) {
            return true;
        }
    }
    return false;
}

export abstract class LightNovelUrl {
    constructor(protected _url: URL.Url) {
    }

    get value() {
        return this._url.href;
    }

    /**
     * get thread Id
     *
     * @readonly
     * @type {string}
     * @memberof LightNovelUrl
     */
    get ThreadId(): string { throw new Error(); }

    /**
     * get page index for this thread
     *
     * @readonly
     * @type {string}
     * @memberof LightNovelUrl
     */
    get PageIndex(): string { throw new Error(); }

    changePageIndex(newPageIndex: number): string { throw new Error(); }

    /**
     * parse a lightnovel url from a string
     *
     * @static
     * @param {string} urlString
     * @memberof LightNovelUrl
     */
    static parse(urlString: string): LightNovelUrl {
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
    private _threadId: string;
    private _pageIndex: string;

    constructor(url: URL.Url) {
        super(url);

        const match = (<string>url.pathname).match(/^\/thread-(\d+)-(\d+)-\d+.html$/);
        if (match === null) {
            throw Error(`unknown url path <${url.pathname}>`);
        }

        this._threadId = match[1];
        this._pageIndex = match[2];
    }

    get ThreadId() { return this._threadId; }

    get PageIndex() { return this._pageIndex; }

    changePageIndex(newPageIndex: number) {
        return `https://${this._url.hostname}/thread-${this._threadId}-${newPageIndex}-1.html`;
    }
}

/**
 * url format like `https://www.lightnovel.cn/forum.php?mod=viewthread&tid=924341&extra=&authorid=989041&page=4`.
 *
 * @class PhpLightNovelUrl
 * @extends {IUrlBuilder}
 */
class PhpLightNovelUrl extends LightNovelUrl {
    private _query: URL.URLSearchParams;
    private _threadId: string;
    private _pageIndex: string;

    constructor(url: URL.Url) {
        super(url);

        this._query = new URL.URLSearchParams(url.query!);

        this._threadId = NotNull(this._query.get('tid'), 'Missing param: tid');
        this._pageIndex = NotNull(this._query.get('page'), 'Missing param: page');
    }

    get ThreadId() { return this._threadId; }

    get PageIndex() { return this._pageIndex; }

    changePageIndex(newPageIndex: number) {
        const newUrl = new URL.URL(<string> this.value);
        const param = newUrl.searchParams;
        param.set('page', newPageIndex.toString());
        newUrl.search = param.toString();
        return newUrl.toString();
    }
}

function detectTotalPageCount(window: DOMWindow) {
    const last = window.document.querySelector('a.last');

    let href = null;
    if (last) {
        href = (<HTMLAnchorElement> last).href;
    } else {
        const pgs = Array.from(window.document.querySelectorAll('.pgt .pg a'));
        if (pgs.length > 0) {
            if (!pgs[pgs.length - 1].classList.contains('nxt')) {
                throw Error();
            }
            href = (<HTMLAnchorElement> pgs[pgs.length - 2]).href;
        }
    }

    if (href) {
        const url = LightNovelUrl.parse(href);
        return Number(url.PageIndex);
    } else {
        return 1;
    }
}

function createWebClient(options: AppOptions) {
    const logger = ioc.getRequired<Logger>(Logger);

    const cookie = options.CookieString;
    const requestOptions: request.RequestPromiseOptions = {
        encoding: 'utf-8'
    };

    if (cookie) {
        requestOptions.headers = {
            Cookie: cookie
        };
        logger.info('init http with cookie.');
    } else {
        logger.info('init http without cookie.');
    }

    return request.defaults(requestOptions);
}

class LightNovelParser implements IParser {
    private _options: AppOptions;
    private _range: Range | null;
    private _url: LightNovelUrl;
    private _chapters: Array<Chapter> = [];
    private _http: request.RequestPromiseAPI;
    private _threadSubject: string | null = null;
    private _logger: Logger;

    constructor() {
        this._options = ioc.getRequired<AppOptions>(AppOptions);
        this._logger = ioc.getRequired<Logger>(Logger);
        this._range = this._options.range;
        this._url = LightNovelUrl.parse(<string> this._options.source);

        this._http = createWebClient(this._options);
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
    buildNovelInfo(novel: Novel) {
        const firstChapter = novel.chapters[0];
        if (!firstChapter) {
            return;
        }

        let lines = firstChapter.Lines;

        // title
        while (lines) {
            const line = <Elements.Line> lines.shift();
            if (!/^[\-=]+$/.test(line.TextContent)) {
                novel.title = line.TextContent;
                break;
            }
        }

        if (novel.title === null) {
            novel.title = this._threadSubject;
        }

        // author
        for (const line of lines) {
            const text = line.TextContent;
            if (/作者/.test(text)) {
                const match = text.match(/作者[：:]\s*(\W+)\s*$/);
                if (match) {
                    novel.author = match[1];
                    break;
                }
            }
        }
    }

    invoke(context: DoggooFlowContext) {
        return this._buildNovel(context.state.novel);
    }

    async _buildNovel(novel: Novel) {
        const asyncDoms: Array<Promise<jsdom.JSDOM>> = [];
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
            this._parse(dom, url);
        }

        // add resolved chapters to novel.
        this._chapters.forEach(chapter => {
            if (chapter.textLength > this._options.limitChars) {
                novel.add(chapter);
            }
        });

        // resolve novel info
        this.buildNovelInfo(novel);

        novel.chapters.forEach((chapter, index) => {
            for (const item of chapter.Contents) {
                if (item instanceof Elements.Line) {
                    const ht = index === 0 ? 'title' : 'chapter';
                    item.HeaderType = ht;
                    break;
                }
            }
        });
    }

    async _getDomAsync(url: string) {
        let response: string | null = null;
        try {
            response = await this._http.get(url);
        } catch (error) {
            if (error.name === 'RequestError') {
                this._logger.error(`timeout when load url: %s, msg: %s.`, url, error.message);
            }
            throw error;
        }
        const dom = new jsdom.JSDOM((<string> response));
        return dom;
    }

    _checkDom(dom: JSDOM) {
        const messagetext = dom.window.document.querySelector('#messagetext');
        if (messagetext) {
            this._logger.error(<string>messagetext.textContent);
        }
    }

    _parse(dom: JSDOM, baseUrlString: string) {
        try {
            this._parseCore(dom, baseUrlString);
        } catch (error) {
            this._logger.warn('error on %s', baseUrlString);
            throw error;
        }
    }

    _parseCore(dom: JSDOM, baseUrlString: string) {
        const window = dom.window;
        const document = window.document;

        const threadSubject = document.querySelector('#thread_subject');
        if (threadSubject) {
            this._threadSubject = threadSubject.textContent;
        }

        const posts = Array.from(window.document.querySelectorAll('#postlist .plhin'));
        posts.forEach(post => {
            this._parsePost({
                window, post, baseUrlString
            });
        });
    }

    _parsePost(options: { window: DOMWindow, post: Element, baseUrlString: string }) {
        const { window, post, baseUrlString } = options;

        if (this._range) {
            const postIndexEl = post.querySelector('.plc .pi strong a em');
            const postIndex = (<HTMLElement>postIndexEl).textContent;
            const floor = Number(postIndex);
            if (!this._range.in(floor)) {
                return;
            }
        }

        const content = post.querySelector('.pct .t_f');
        if (content === null) {
            // maybe: 作者被禁止或删除 内容自动屏蔽
            this._logger.info('post %s has not content.', post.id);
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

        // parse chapter content
        const visitor = new NodeVisitor();
        visitor.addVisitInnerTagName('IGNORE_JS_OP');

        const chapter = new Chapter();

        // some post has header.
        const pcb = <HTMLElement> post.querySelector('.plc .pcb');
        if (pcb.children[0] && pcb.children[0].tagName === 'H2') {
            chapter.addText(<string> pcb.children[0].textContent);
            chapter.addLineBreak();
        }

        // visit post content
        content.childNodes.forEach(z => {
            visitor.visit(new ChapterContext(window, chapter, z));
        });

        this._chapters.push(chapter);
    }
}

export default {
    match,
    Parser: LightNovelParser
}
