'use strict';

const model = require('../model');
const OutputGenerator = require('../handlers/output-generator');

class Generator {
    generate(context) {
        throw 'not impl.';
    }

    toDoc(chapter) {
        return chapter.contents.map(z => {
            switch (z.constructor) {
                case model.LineBreak:
                    return this.onLineBreak(z);
                case model.TextElement:
                    return this.onTextElement(z);
                case model.ImageElement:
                    return this.onImageElement(z);
                case model.LinkElement:
                    return this.onLinkElement(z);
                default:
                    throw new Error(`Unhandled chapter content type <${z.constructor}>`);
            }
        }).join('');
    }

    onLineBreak(node) {
        throw new Error('NotImplementedError');
    }

    onTextElement(node) {
        throw new Error('NotImplementedError');
    }

    onImageElement(node) {
        throw new Error('NotImplementedError');
    }

    onLinkElement(node) {
        throw new Error('NotImplementedError');
    }

    registerAsHandler(context) {
        const outputHandler = new OutputGenerator(this);
        context.addHandler(outputHandler);
    }
}

module.exports = {
    Generator
}