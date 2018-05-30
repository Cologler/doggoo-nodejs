'use strict';

const { ioc } = require('@adonisjs/fold');
const uuid = require('node-uuid');
const { JSDOM } = require('jsdom');

const { HtmlHelper } = require('../utils/html-helper');
const { Generator, NodeVisitor } = require('./base');
const { EpubBuilder } = require('epub-builder/dist/builder.js');

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

        /** @type {HTMLDocument} */
        this._document = ioc.use('dom').window.document;
        this._rootElement = this._document.createElement('div');
    }

    get book() {
        return this._context.book;
    }

    get coverIndex() {
        return this._context.coverIndex;
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
            el.style.textAlign = 'center';
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
            elDiv.setAttribute('style', 'page-break-after:always;');
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
        return this._rootElement.innerHTML;
    }
}

class EpubGenerator extends Generator {
    constructor () {
        super();
        this._book = new EpubBuilder();

        /** @type {string|Number} */
        this._cover = 0;
        this._imageIndex = 0;

        this._hasImages = !ioc.use('options').noImages;
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
        this.resolveCover(context);

        novel.chapters.forEach(chapter => {
            const chapterTitle = chapter.title || '';
            const text = new EpubNodeVisitor(this).visitChapter(chapter).value();
            book.addChapter(chapterTitle, text);
        });
        if (title.length >= 30) {
            title = 'book';
        }
        const appinfo = ioc.use('app-info');
        book.createBook(`${title}.${appinfo.name}-${appinfo.build}`);
    }
}

module.exports = EpubGenerator;
