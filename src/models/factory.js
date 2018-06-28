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

    createLineBreak() {
        const node = this._document.createElement('br');
        return node;
    }

    createTextNode(text) {
        return this._document.createTextNode(text);
    }

    createText() {
        const node = this._document.createElement('p');
        return node;
    }

    createImage(url) {
        const node = this._document.createElement('img');
        node.setAttribute('raw-url', url);
        node.imageIndex = this._imageIndex;
        this._imageIndex++;
        this._eventEmitter.emit('add-image', this, {
            image: node
        });
        return node;
    }

    createLink(title, url) {
        const node = this._document.createElement('a');
        node.textContent = title;
        node.setAttribute('href', url);
        return node;
    }
}

ioc.singleton('element-factory', () => {
    return new ElementFactory();
});

module.exports = {
    ElementFactory
};
