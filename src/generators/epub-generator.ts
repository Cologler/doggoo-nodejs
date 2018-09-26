'use strict';

const uuid = require('uuid/v4');
const { JSDOM } = require('jsdom');
const { parse } = require('parse5');
const { serializeToString } = require('xmlserializer');
const isInvalid = require('is-invalid-path');
import { ioc } from "anyioc";

import { Chapter } from "../models/sections";
import { AppOptions } from '../options';
import { FileInfo } from '../handlers/image-downloader';
import { DoggooFlowContext, InfoBuilder, AppInfo } from "../doggoo";
import { Novel } from '../models/novel';

const { getAttr, AttrSymbols } = require('../utils/attrs');
const { Generator, NodeVisitor } = require('./base');
const { EpubBuilder } = require('epub-builder/dist/builder.js');
const { Publisher } = require('epub-builder/dist/api.js');
const { FileRefAsset } = require('epub-builder/dist/lib/asset.js');
const { XHtmlDocument } = require('epub-builder/dist/lib/html.js');
const { TocBuilder, NavPoint } = require('epub-builder/dist/toc/toc-builder');

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
    constructor(context: EpubGenerator, filename: string) {
        super();
        this._context = context;
        this._filename = filename;

        this._curText = null;

        this._dom = new JSDOM();
        this._document = this._dom.window.document;
        this._rootElement = this._document.createElement('div');
        this._document.body.appendChild(this._rootElement);
    }

    get book() {
        return this._context.book;
    }

    get coverIndex() {
        return this._context.coverIndex;
    }

    visitChapter(chapter: Chapter) {
        // title
        const chapterTitle = chapter.title || '';
        const titleEl = this._document.createElement('title');
        titleEl.textContent = chapterTitle;
        this._document.head.appendChild(titleEl);

        // css
        if (this._context.cssPath) {
            const styleEl = this._document.createElement('link');
            styleEl.type = 'text/css';
            styleEl.rel = 'stylesheet';
            styleEl.href = STYLE_NAME;
            this._document.head.appendChild(styleEl);
        }

        return super.visitChapter(chapter);
    }

    onLineBreak() {
        // ignore
    }

    onTextElement(item: HTMLParagraphElement) {
        let el = null;
        /** @type {number} */
        const hl = getAttr(item, AttrSymbols.HeaderLevel);
        if (hl !== null) {
            el = this._document.createElement(`h${hl}`);
            //el.style.textAlign = 'center';
            el.textContent = item.textContent;

            const np = new NavPoint();
            np.LabelText = el.textContent;
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
            el = item;
        }
        this._rootElement.appendChild(el);
    }

    onImageElement(item: HTMLImageElement) {
        const url = getAttr(item, AttrSymbols.RawUrl);
        const fileinfo = this._context.imageDownloader.getFileInfo(url);

        if (this._context.requireImages) {
            if (getAttr(item, AttrSymbols.ImageIndex) === this.coverIndex || url === this.coverIndex) {
                this._context.addCoverImage(fileinfo);
            } else {
                this._context.addAsset(fileinfo);
            }
        }

        let el = null;
        if (this._context.requireImages) {
            const elImg = item;
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

    /**
     *
     *
     * @param {HTMLAnchorElement} item
     * @memberof NodeVisitor
     */
    onLinkElement(item: HTMLAnchorElement) {
        this._rootElement.appendChild(item);;
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
    path: string,
}

export class EpubGenerator extends Generator {
    private _options: AppOptions;
    private _assets: Map<string, AssetInfo> = new Map();
    public NavPointsTable: Array<any> = [];
    public PlayOrder: number = 0;

    constructor () {
        super();
        this._book = new EpubBuilder();
        this._assetsPaths = new Set();

        /** @type {string|Number} */
        this._cover = 0;
        this._imageIndex = 0;

        this._options = ioc.getRequired<AppOptions>(AppOptions);
        this._hasImages = !this._options.noImages;
        this._cssPath = this._options.cssPath;
    }

    get requireImages() {
        return this._hasImages;
    }

    get book() {
        return this._book;
    }

    get coverIndex() {
        return this._cover;
    }

    get cssPath() {
        return this._cssPath;
    }

    get imageDownloader() {
        return this._downloader = this._downloader || ioc.getRequired('image-downloader');
    }

    resolveCover() {
        const coverIndex = this._options.coverIndex;
        if (coverIndex) {
            const index = Number(coverIndex);
            if (!isNaN(index)) {
                this._cover = index;
            }
        }
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
        this.resolveCover();
        if (this.cssPath) {
            book.addAsset(new FileRefAsset(this.cssPath, STYLE_NAME));
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
        tocBuilder.title = title;

        if (title.length >= 30 || isInvalid(title)) {
            title = 'book';
        }
        const appinfo = ioc.getRequired<AppInfo>('app-info');
        book.createBook(`${title}.${appinfo.name}-${appinfo.build}`);
    }
}

ioc.registerSingleton('epub-generator', () => new EpubGenerator());
