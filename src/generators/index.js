'use strict';

const MarkdownGenerator = require('./markdown-generator');
const TxtGenerator = require('./txt-generator');
const EpubGenerator = require('./epub-generator');

function findGenerator(context) {
    const name = context.appopt.format;
    switch (name) {
        case 'markdown':
        case 'md':
        case 'gitbook':
            return new MarkdownGenerator();

        case 'txt':
            return new TxtGenerator();

        case 'epub':
            return new EpubGenerator();

        default:
            return new EpubGenerator();
    }
}

function useGenerator(context) {
    const generator = findGenerator(context);
    generator.registerAsHandler(context);
}

module.exports = {
    useGenerator
}
