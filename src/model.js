'use strict';

class ChapterElement {
    constructor(options) {
        Object.keys(options).map(k => {
            Object.defineProperty(this, k, {
                get: () => options[k]
            })
        });
    }
}

class LineBreak extends ChapterElement { }

class TextElement extends ChapterElement { }

class ImageElement extends ChapterElement { }

class LinkElement extends ChapterElement { }

class Chapter {
    constructor() {
        this._title = '';
        this._contents = [];
        this._textLength = 0;
        this._textIndex = 0;
        this._nodeIndex = 0;
    }

    get title() {
        return this._title;
    }

    set title(value) {
        this._title = value;
    }

    addText(text) {
        text = text.trim();
        if (!text) {
            // ignore empty text.
            return;
        }
        this._textLength += text.length;
        this._contents.push(new TextElement({
            content: text,
            textIndex: this._textIndex,
            nodeIndex: this._nodeIndex
        }));
        this._textIndex ++;
        this._nodeIndex ++;
    }

    addLineBreak() {
        if (this._contents.length === 0) {
            // ignore leading <br/>
            return;
        }
        this._contents.push(new LineBreak({
            nodeIndex: this._nodeIndex
        }));
        this._nodeIndex ++;
    }

    addImage(url) {
        this._contents.push(new ImageElement({
            url: url,
            nodeIndex: this._nodeIndex
        }));
        this._nodeIndex ++;
    }

    addLink(url, title) {
        this._textLength += title.length;
        this._contents.push(new LinkElement({
            url: url,
            title: title,
            nodeIndex: this._nodeIndex
        }));
        this._nodeIndex ++;
    }

    get contents() {
        return this._contents;
    }

    get textLength() {
        return this._textLength;
    }
}

class Intro {
    constructor() {

    }
}

class TOC {
    constructor() {

    }
}

class Novel {
    constructor() {
        this._title = '';
        this._chapters = [];
    }

    get title() {
        return this._title;
    }

    set title(value) {
        this._title = value;
    }

    add(chapter) {
        this._chapters.push(chapter);
    }

    get chapters() {
        return this._chapters;
    }
}

module.exports = {
    Novel,
    Chapter,

    LineBreak,
    TextElement,
    ImageElement,
    LinkElement
}
