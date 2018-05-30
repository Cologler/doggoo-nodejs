'use strict';

const { ioc } = require('@adonisjs/fold');
const uuid = require('node-uuid');
const { JSDOM } = require('jsdom');
const { parse } = require('parse5');
const { serializeToString } = require('xmlserializer');

const { HtmlHelper } = require('../utils/html-helper');
const { Generator, NodeVisitor } = require('./base');
const { EpubBuilder } = require('epub-builder/dist/builder.js');
const { Publisher } = require('epub-builder/dist/api.js');
const { FileRefAsset } = require('epub-builder/dist/lib/asset.js');
const { XHtmlDocument } = require('epub-builder/dist/lib/html.js');

const STYLE_NAME = 'style.css';

/*
epub support elements:
"address", "blockquote", "del", "div",
"dl", "h1", "h2", "h3", "h4", "h5", "h6",
"hr", "ins", "noscript", "ns:svg", "ol", "p", "pre",
"script", "table" or "ul".
 */

class EpubNodeVisitor extends NodeVisitor {
    /**
     *
     * Creates an instance of EpubNodeVisitor.
     * @param {EpubGenerator} context
     * @memberof EpubNodeVisitor
     */
    constructor(context) {
        super();
        this._context = context;

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

    visitChapter(chapter) {
        // title
        const chapterTitle = chapter.title || '';
        const titleEl = this._document.createElement('title');
        titleEl.textContent = chapterTitle;
        this._document.head.appendChild(titleEl);

        // css
        if (this._context.css) {
            const styleEl = this._document.createElement('link');
            styleEl.type = 'text/css';
            styleEl.rel = 'stylesheet';
            styleEl.href = STYLE_NAME;
            this._document.head.appendChild(styleEl);
        }

        return super.visitChapter(chapter);
    }

    onLineBreak(item) {
        // ignore
    }

    /**
     *
     *
     * @param {HTMLParagraphElement} item
     * @memberof NodeVisitor
     */
    onTextElement(item) {
        let el = null;
        const helper = new HtmlHelper(item);
        if (helper.isHeader) {
            el = this._document.createElement(`h${helper.headerLevel}`);
            //el.style.textAlign = 'center';
            el.textContent = item.textContent;
        } else {
            el = item;
        }
        this._rootElement.appendChild(el);
    }

    /**
     *
     *
     * @param {HTMLImageElement} item
     * @memberof NodeVisitor
     */
    onImageElement(item) {
        const url = item.getAttribute('raw-url');
        const fileinfo = this._context.imageDownloader.getFileInfo(url);

        if (this._context.requireImages) {
            if (item.imageIndex === this.coverIndex || url === this.coverIndex) {
                this.book.addCoverImage(fileinfo.path);
            } else {
                this.book.addAsset(fileinfo.path);
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

        this._rootElement.appendChild(el);;
    }

    /**
     *
     *
     * @param {HTMLAnchorElement} item
     * @memberof NodeVisitor
     */
    onLinkElement(item) {
        this._rootElement.appendChild(item);;
    }

    value() {
        const html = this._dom.serialize();
        const dom = parse(html);
        return serializeToString(dom);
    }
}

class EpubGenerator extends Generator {
    constructor () {
        super();
        this._book = new EpubBuilder();

        /** @type {string|Number} */
        this._cover = 0;
        this._imageIndex = 0;

        const options = ioc.use('options');
        this._hasImages = !options.noImages;
        this._css = options.css;
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

    get css() {
        return this._css;
    }

    get imageDownloader() {
        return this._downloader = this._downloader || ioc.use('image-downloader');
    }

    resolveCover(context) {
        const coverIndex = context.appopt.coverIndex;
        if (coverIndex) {
            const index = Number(coverIndex);
            if (!isNaN(index)) {
                this._cover = index;
            }
        }
    }

    run(context) {
        const novel = context.novel;
        const book = this._book;
        let title = novel.titleOrDefault;

        book.title = title;
        book.author = novel.author || 'AUTHOR';
        book.summary = novel.summary || context.getGenerateMessage('epub');
        book.UUID = uuid.v4();
        book.appendMeta(new Publisher('doggoo'));
        this.resolveCover(context);
        if (this.css) {
            book.addAsset(new FileRefAsset(this.css, STYLE_NAME));
        }

        novel.chapters.forEach((chapter, index) => {
            const text = new EpubNodeVisitor(this).visitChapter(chapter).value();
            const doc = new XHtmlDocument(`chapter-${index}.xhtml`);
            doc.title = chapter.title || '';
            doc.html = text;
            book.addAsset(doc);
        });
        if (title.length >= 30) {
            title = 'book';
        }
        const appinfo = ioc.use('app-info');
        book.createBook(`${title}.${appinfo.name}-${appinfo.build}`);
    }
}

module.exports = EpubGenerator;
