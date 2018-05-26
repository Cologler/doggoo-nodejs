'use strict';

const { ioc } = require('@adonisjs/fold');

const { LineBreak, Text, Image, Link } = require('./elements');

class ElementFactory {
    constructor() {
        /** @type {events.EventEmitter} */
        this._eventEmitter = ioc.use('event-emitter');

        this._imageIndex = 0;
    }

    createLineBreak(nodeIndex) {
        const node = new LineBreak({
            nodeIndex
        });
        return node;
    }

    createText(text, textIndex, nodeIndex) {
        const node = new Text(text, {
            nodeIndex,
            textIndex
        });
        return node;
    }

    createImage(url, nodeIndex) {
        const node = new Image(url, {
            nodeIndex,
            imageIndex: this._imageIndex
        });
        this._imageIndex++;
        this._eventEmitter.emit('add-image', this, {
            image: node
        });
        return node;
    }

    createLink(title, url, nodeIndex) {
        const node = new Link(title, url, {
            nodeIndex
        });
        return node;
    }
}

ioc.singleton('element-factory', () => {
    return new ElementFactory();
});

module.exports = {
    ElementFactory
};
