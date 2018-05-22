'use strict';

const { ioc } = require('@adonisjs/fold');
const uuid = require('node-uuid');
const { JSDOM } = require('jsdom');

const { Generator, NodeVisitor } = require('./base');
const { Text } = require('../models/elements');
const { EpubBuilder } = require('epub-builder/dist/builder.js');

class EpubNodeVisitor extends NodeVisitor {
    /**
     *
     * Creates an instance of EpubNodeVisitor.
     * @param {EpubGenerator} context
     * @memberof EpubNodeVisitor
     */
    constructor(context, chapterIndex) {
        super();
        this._context = context;
        this._chapterIndex = chapterIndex;

        this._curText = null;

        this._dom = new JSDOM();
        this._window = this._dom.window;
        this._document = this._window.document;
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

    onTextElement(item) {
        let el = null;
        if (item.textIndex === 0) {
            if (this._chapterIndex === 0) {
                el = this._document.createElement('h1');
            } else {
                el = this._document.createElement('h2');
            }
        } else {
            el = this._document.createElement('p');
        }

        el.textContent = item.content;
        this._rootElement.appendChild(el);
    }

    onImageElement(item) {
        const fileinfo = this._context.imageDownloader.getFileInfo(item.url);

        if (this._context.requireImages) {
            if (item.imageIndex === this.coverIndex || item.url === this.coverIndex) {
                this.book.addCoverImage(fileinfo.path);
            } else {
                this.book.addAsset(fileinfo.path);
            }
        }

        let el = null;
        if (this._context.requireImages) {
            el = this._document.createElement('img');
            el.setAttribute('src', fileinfo.filename);
            el.setAttribute('alt', fileinfo.filename);
        } else {
            el = this._document.createElement('p');
            el.textContent = `<image ${item.url}>`;
        }

        this._rootElement.appendChild(el);;
    }

    onLinkElement(item) {
        const el = this._document.createElement('a');
        el.setAttribute('href', item.url);
        el.textContent = item.title;
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
        this._chapterIndex = 0;

        this._hasImages = !ioc.use('options').noImages;
        this._downloader = ioc.use('image-downloader');
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
        return this._downloader;
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

        novel.chapters.forEach((z, i) => {
            const txtEls = z.contents.filter(z => z instanceof Text);
            const chapterTitle = txtEls.length > 0 ? txtEls[0].content : 'Chapter Title';
            const text = new EpubNodeVisitor(this, i).visitChapter(z).value();
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
