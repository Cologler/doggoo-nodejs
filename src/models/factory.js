'use strict';

const { ioc } = require('@adonisjs/fold');

class ElementFactory {
    constructor() {
        this._eventEmitter = ioc.use('event-emitter');
        this._dom = ioc.use('dom');
        /** @type {HTMLDocument} */
        this._document = this._dom.window.document;

        this._imageIndex = 0;
    }

    createLineBreak(nodeIndex) {
        const node = this._document.createElement('br');
        node.nodeIndex = nodeIndex;
        return node;
    }

    createText(text, nodeIndex) {
        const node = this._document.createElement('p');
        node.textContent = text;
        node.nodeIndex = nodeIndex;
        return node;
    }

    createImage(url, nodeIndex) {
        const node = this._document.createElement('img');
        node.setAttribute('raw-url', url);
        node.imageIndex = this._imageIndex;
        node.nodeIndex = nodeIndex;
        this._imageIndex++;
        this._eventEmitter.emit('add-image', this, {
            image: node
        });
        return node;
    }

    createLink(title, url, nodeIndex) {
        const node = this._document.createElement('a');
        node.textContent = title;
        node.setAttribute('href', url);
        node.nodeIndex = nodeIndex;
        return node;
    }
}

ioc.singleton('element-factory', () => {
    return new ElementFactory();
});

module.exports = {
    ElementFactory
};
