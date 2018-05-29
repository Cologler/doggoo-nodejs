'use strict';

const os = require('os');

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

    /**
     *
     *
     * @param {HTMLElement} item
     * @returns
     * @memberof NodeVisitor
     */
    visitItem(item) {
        switch (item.tagName) {
            case 'BR':
                return this.onLineBreak(item);
            case 'P':
                return this.onTextElement(item);
            case 'IMG':
                return this.onImageElement(item);
            case 'A':
                return this.onLinkElement(item);
            default:
                throw new Error(`Unhandled chapter content type <${item.tagName}>`);
        }
    }

    /**
     *
     *
     * @param {HTMLBRElement} item
     * @memberof NodeVisitor
     */
    onLineBreak(item) {
        throw new Error('NotImplementedError');
    }

    /**
     *
     *
     * @param {HTMLParagraphElement} item
     * @memberof NodeVisitor
     */
    onTextElement(item) {
        throw new Error('NotImplementedError');
    }

    /**
     *
     *
     * @param {HTMLImageElement} item
     * @memberof NodeVisitor
     */
    onImageElement(item) {
        throw new Error('NotImplementedError');
    }

    /**
     *
     *
     * @param {HTMLAnchorElement} item
     * @memberof NodeVisitor
     */
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