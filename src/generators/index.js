'use strict';

const { ioc } = require('@adonisjs/fold');

const MarkdownGenerator = require('./markdown-generator');
const TxtGenerator = require('./txt-generator');
const EpubGenerator = require('./epub-generator');

function findGenerator(name) {
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
    const format = ioc.use('options').format;
    const generator = findGenerator(format);
    ioc.singleton('generator', () => {
        return generator;
    });
    if (generator instanceof EpubGenerator) {
        if (generator.requireImages) {
            context.addMiddleware(ioc.use('image-downloader'));
        }
    }
    context.addMiddleware(generator);
}

module.exports = {
    useGenerator
};
