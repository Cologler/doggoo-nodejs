'use strict';

const model = require('../model');

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
            case model.LineBreak:
                return this.onLineBreak(item);
            case model.TextElement:
                return this.onTextElement(item);
            case model.ImageElement:
                return this.onImageElement(item);
            case model.LinkElement:
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