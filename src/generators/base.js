'use strict';

const os = require('os');

const elements = require('../models/elements');

/**
 * a simple stringbuilder.
 *
 * @class StringBuilder
 */
class StringBuilder {
    constructor() {
        this._doc = [];
    }

    append(text) {
        this._doc.push(text);
        return this;
    }

    appendLineBreak() {
        this._doc.push(os.EOL);
        return this;
    }

    value() {
        return this._doc.join('');
    }
}

class NodeVisitor {
    visitChapter(chapter) {
        chapter.contents.forEach(z => this.visitItem(z));
        return this;
    }

    visitItem(item) {
        switch (item.constructor) {
            case elements.LineBreak:
                return this.onLineBreak(item);
            case elements.Text:
                return this.onTextElement(item);
            case elements.Image:
                return this.onImageElement(item);
            case elements.Link:
                return this.onLinkElement(item);
            default:
                throw new Error(`Unhandled chapter content type <${item.constructor}>`);
        }
    }

    onLineBreak(item) {
        throw new Error('NotImplementedError');
    }

    onTextElement(item) {
        throw new Error('NotImplementedError');
    }

    onImageElement(item) {
        throw new Error('NotImplementedError');
    }

    onLinkElement(item) {
        throw new Error('NotImplementedError');
    }
}

class Generator {
    run(context) {
        throw new Error('NotImplementedError');
    }
}

module.exports = {
    Generator,
    NodeVisitor,
    StringBuilder
};