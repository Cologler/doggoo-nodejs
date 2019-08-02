'use strict';

const uuid = require('uuid/v4');
import { JSDOM } from 'jsdom';
const { parse } = require('parse5');
const { serializeToString } = require('xmlserializer');
const isInvalid = require('is-invalid-path');
import { ioc } from "anyioc";
import { EpubBuilder } from 'epub-builder/dist/builder';
import { Publisher } from 'epub-builder/dist/metadata/dc';
import { FileRefAsset } from 'epub-builder/dist/lib/asset';
import { XHtmlDocument } from 'epub-builder/dist/lib/html';
import { TocBuilder, NavPoint } from 'epub-builder/dist/toc/toc-builder';

import { Chapter } from "../models/sections";
import { AppOptions } from '../options';
import { FileInfo, ImagesDownloader } from '../handlers/image-downloader';
import { DoggooFlowContext, InfoBuilder, AppInfo } from "../doggoo";
import { Novel } from '../models/novel';
import { Generator, NodeVisitor } from "./base";
import { Elements } from '../models/elements';


const STYLE_NAME = 'style.css';

/*
 * Allowed elements in any:
 * "del", "ins", "noscript", "ns:svg", "script".
 */

/*
 * Allowed elements in <div>:
 * "address", "blockquote", "div", "dl",
 * "h1", "h2", "h3", "h4", "h5", "h6",
 * "hr", "ol", "p", "pre", "table" or "ul".
 */

/*
 * Allowed elements in <p>:
 * "a", "abbr", "acronym", "applet",
 * "b", "bdo", "big", "br", "cite", "code", "dfn", "em",
 * "i", "iframe", "img", "kbd", "map", "object", "q",
 * "samp", "small", "span", "strong", "sub", "sup",
 * "tt" or "var"
 */

class EpubNodeVisitor extends NodeVisitor {
    private _dom: JSDOM;
    private _document: Document;
    private _rootElement: HTMLDivElement;
    private _currentLine: HTMLElement | null = null;

    constructor(private _context: EpubGenerator, private _filename: string) {
        super();

        this._dom = new JSDOM();
        this._document = this._dom.window.document;
        this._rootElement = this._document.createElement('div');
        this._document.body.appendChild(this._rootElement);
    }

    get book() {
        return this._context.book;
    }

    get CoverIndex() {
        return this._context.CoverIndex;
    }

    visitChapter(chapter: Chapter) {
        // title
        this._document.title = chapter.title || '';
        //const chapterTitle = chapter.title || '';
        //const titleEl = this._document.createElement('title');
        //titleEl.textContent = chapterTitle;
        //this._document.head.appendChild(titleEl);

        // css
        if (this._context.CSSPath) {
            const styleEl = this._document.createElement('link');
            styleEl.type = 'text/css';
            styleEl.rel = 'stylesheet';
            styleEl.href = STYLE_NAME;
            (<HTMLHeadElement> this._document.head).appendChild(styleEl);
        }

        return super.visitChapter(chapter);
    }

    onLink(node: Elements.Link): void {
        const a = this._document.createElement('a');
        a.title = node.Title;
        a.href = node.Url;
        (<HTMLElement>this._currentLine).appendChild(a);
    }

    onText(node: Elements.Text): void {
        const t = this._document.createTextNode(node.Content);
        (<HTMLElement>this._currentLine).appendChild(t);
    }

    onLineBreak() {
        // ignore
    }

    onLineStart(item: Elements.Line): void {
        let el: HTMLElement | null = null;

        const hl = item.HeaderLevel;
        if (hl !== null) {
            el = this._document.createElement(`h${hl}`);
            //el.style.textAlign = 'center';
            el.textContent = item.TextContent;

            const np = new NavPoint();
            np.LabelText = <string> el.textContent;
            np.PlayOrder = this._context.PlayOrder ++;
            np.ContentSrc = this._filename;
            if (hl === 1 /* h1 */ || this._context.NavPointsTable.length === 0) {
                this._context.NavPointsTable.push(np);
            } else {
                let npl = hl;
                let parent = this._context.NavPointsTable[this._context.NavPointsTable.length - 1]; // last
                while (--npl > 1) {
                    if (!parent.SubNavPoints || parent.SubNavPoints.length === 0) {
                        break;
                    }
                    parent = parent.SubNavPoints[parent.SubNavPoints.length - 1];
                }
                parent.addSubNavPoint(np);
            }
        } else {
            el = this._document.createElement("p");
        }
        this._currentLine = el;
        this._rootElement.appendChild(el);
    }

    onLineEnd() {
        this._currentLine = null;
    }

    onImage(item: Elements.Image) {
        const url = item.Uri as string;
        const fileinfo = this._context.ImagesDownloader.getFileInfo(url);

        if (this._context.requireImages) {
            if (item.Index === this.CoverIndex || url === this.CoverIndex) {
                this._context.addCoverImage(fileinfo);
            } else {
                this._context.addAsset(fileinfo);
            }
        }

        let el = null;
        if (this._context.requireImages) {
            const elImg = this._document.createElement('img');
            elImg.setAttribute('src', fileinfo.filename);
            elImg.setAttribute('alt', fileinfo.filename);
            const elDiv = this._document.createElement('div');
            elDiv.classList.add('image-container');
            elDiv.appendChild(elImg);
            el = elDiv;
        } else {
            el = this._document.createElement('p');
            el.textContent = `<image ${url}>`;
        }

        this._rootElement.appendChild(el);
    }

    value() {
        const html = this._dom.serialize();
        const dom = parse(html);
        return serializeToString(dom);
    }
}

type AssetType = 'file' | 'cover';

type AssetInfo = {
    type: AssetType,
    file: FileInfo,
    path: string
}

export class EpubGenerator extends Generator {
    private _options: AppOptions;
    private _assets: Map<string, AssetInfo> = new Map();
    public NavPointsTable: Array<any> = [];
    public PlayOrder: number = 0;
    private _downloader?: ImagesDownloader;
    private _hasImages: boolean;
    private _cssPath: string | null;
    private _book: EpubBuilder = new EpubBuilder();
    private _coverIndex: number | string = 0;

    constructor () {
        super();

        this._options = ioc.getRequired<AppOptions>(AppOptions);
        this._hasImages = !this._options.noImages;
        this._cssPath = this._options.cssPath;

        const coverIndex = this._options.CoverIndex;
        if (coverIndex) {
            const index = Number(coverIndex);
            if (!isNaN(index)) {
                this._coverIndex = index;
            }
        }
    }

    get requireImages() {
        return this._hasImages;
    }

    get book() {
        return this._book;
    }

    get CoverIndex() {
        return this._coverIndex;
    }

    get CSSPath() {
        return this._cssPath;
    }

    get ImagesDownloader() : ImagesDownloader {
        if (this._hasImages && !this._downloader) {
            this._downloader = ioc.getRequired<ImagesDownloader>('image-downloader');
        }
        return <ImagesDownloader> this._downloader;
    }

    addCoverImage(fileinfo: FileInfo) {
        this.addAsset(fileinfo).type = 'cover';
    }

    addAsset(fileinfo: FileInfo): AssetInfo {
        let asset = this._assets.get(fileinfo.path);

        if (!asset) {
            this._assets.set(fileinfo.path, asset = {
                type: 'file',
                file: fileinfo,
                path: fileinfo.path,
            });
        }

        return asset;
    }

    invoke(context: DoggooFlowContext) {
        return this.run(context.state.novel);
    }

    run(novel: Novel) {
        const infoBuilder = ioc.getRequired<InfoBuilder>('info-builder');
        infoBuilder.format = 'epub';

        const book = this._book;

        let title = novel.titleOrDefault;
        const bookUid = uuid();

        book.title = title;
        book.author = novel.author || 'AUTHOR';
        book.summary = novel.summary || infoBuilder.toString();
        book.UUID = bookUid;
        book.appendMeta(new Publisher('doggoo'));
        if (this.CSSPath) {
            book.addAsset(new FileRefAsset(this.CSSPath, STYLE_NAME));
        }

        novel.chapters.forEach((chapter, index) => {
            const filename = `chapter-${index}.xhtml`;
            const text = new EpubNodeVisitor(this, filename).visitChapter(chapter).value();
            const doc = new XHtmlDocument(filename);
            doc.title = chapter.title || '';
            doc.html = text;
            book.addAsset(doc);
        });

        if (this.requireImages) {
            this._assets.forEach(value => {
                if (value.type === 'cover') {
                    this._book.addCoverImage(value.path);
                }
            });
            this._assets.forEach(value => {
                if (value.type === 'file') {
                    this._book.addAsset(value.path);
                }
            });
        }

        const tocBuilder = book.TocBuilder = new TocBuilder();
        this.NavPointsTable.forEach(z => tocBuilder.addNavPoint(z));
        tocBuilder.UUID = bookUid;
        tocBuilder.Title = title;

        if (title.length >= 30 || isInvalid(title)) {
            title = 'book';
        }
        const appinfo = ioc.getRequired<AppInfo>('app-info');
        book.createBook(`${title}.${appinfo.name}-${appinfo.build}.epub`);
    }
}

ioc.registerSingleton('epub-generator', () => new EpubGenerator());
