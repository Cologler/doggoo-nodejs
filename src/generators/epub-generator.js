'use strict';

const { ioc } = require('@adonisjs/fold');
const uuid = require('node-uuid');
const xmlescape = require('xml-escape');

const { Generator } = require('./base');
const model = require('../model');
const { EpubBuilder } = require('epub-builder/dist/builder.js');

class EpubGenerator extends Generator {
    constructor () {
        super();
        this._book = new EpubBuilder();
        this._cover = 0;
        this._imageIndex = 0;
        this._chapterIndex = 0;

        this._hasImages = !ioc.use('options').noImages;
        this._downloader = ioc.use('image-downloader');
    }

    get requireImages() {
        return this._hasImages;
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
            this._chapterIndex ++;
            const txtEls = z.contents.filter(z => z instanceof model.TextElement);
            const chapterTitle = txtEls.length > 0 ? txtEls[0].content : 'Chapter Title';
            const text = this.toDoc(z).trim();
            book.addChapter(chapterTitle, text);
        });
        if (title.length >= 30) {
            title = 'book';
        }
        const appinfo = ioc.use('app-info');
        book.createBook(`${title}.${appinfo.name}-${appinfo.build}`);
    }

    onLineBreak(node) {
        return ''; // epub does not allow <br/>?
    }

    onTextElement(node) {
        const data = xmlescape(node.content);

        if (node.textIndex === 0) {
            if (this._chapterIndex === 1) {
                return `<h1>${data}</h1>`;
            } else {
                return `<h2>${data}</h2>`;
            }
        } else {
            return `<p>${data}</p>`;
        }
    }

    onImageElement(node) {
        const fileinfo = this._downloader.getFileInfo(node.url);

        if (this._hasImages) {
            if (this._imageIndex === this._cover || node.url === this._cover) {
                this._book.addCoverImage(fileinfo.path);
            } else {
                this._book.addAsset(fileinfo.path);
            }
        }

        this._imageIndex++;
        let image = '';

        if (this._hasImages) {
            image = `<img src="${fileinfo.filename}" alt="${fileinfo.filename}"/>`;
        } else {
            const pholder = `<image ${node.url}>`;
            const data = xmlescape(pholder);
            image = `<p>${data}</p>`;
        }

        return `<div style="page-break-after:always;">${image}</div>`;
    }

    onLinkElement(node) {
        const data = xmlescape(node.title);
        return `<a href="${node.url}">${data}</a>`;
    }
}

module.exports = EpubGenerator;
