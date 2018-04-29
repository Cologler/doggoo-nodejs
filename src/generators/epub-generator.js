'use strict';

const uuid = require('node-uuid');
const xmlescape = require('xml-escape');

const app = require('../app');
const { appopt } = require('../options');
const { Generator } = require('./base');
const model = require('../model');
const ImageDownloader = require('../handlers/image-downloader');
const { EpubBuilder } = require('epub-builder/dist/builder.js');

class EpubGenerator extends Generator {
    constructor () {
        super();
        this._book = new EpubBuilder();
        this._cover = 0;
        this._imageIndex = 0;

        this._hasImages = !appopt().noImages;
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

    generate(context) {
        const novel = context.novel;
        const book = this._book;
        let title = novel.titleOrDefault;

        book.title = title;
        book.author = novel.author || 'AUTHOR';
        book.summary = novel.summary || context.getGenerateMessage('epub');
        book.UUID = uuid.v4();
        this.resolveCover(context);

        novel.chapters.forEach((z, i) => {
            const txtEls = z.contents.filter(z => z instanceof model.TextElement);
            const chapterTitle = txtEls.length > 0 ? txtEls[0].content : 'Chapter Title';
            const text = this.toDoc(z).trim();
            book.addChapter(chapterTitle, text);
        });
        if (title.length >= 30) {
            title = 'book';
        }
        book.createBook(`${title}.${app.name}-${app.build}`);
    }

    onLineBreak(node) {
        return ''; // epub does not allow <br/>?
    }

    onTextElement(node) {
        const data = xmlescape(node.content);
        if (node.textIndex === 0) {
            return `<h1>${data}</h1>`;
        } else {
            return `<p>${data}</p>`;
        }
    }

    onImageElement(node) {
        if (this._hasImages) {
            if (this._imageIndex === this._cover || node.url === this._cover) {
                this._book.addCoverImage(node.path);
            } else {
                this._book.addAsset(node.path);
            }
        }

        this._imageIndex++;
        let image = '';

        if (this._hasImages) {
            image = `<img src="${node.filename}" alt="${node.filename}"/>`;
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

    registerAsHandler(context) {
        if (this._hasImages) {
            context.addHandler(new ImageDownloader());
        }
        super.registerAsHandler(context);
    }
}

module.exports = EpubGenerator;
