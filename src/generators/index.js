'use strict';

const { ioc } = require('@adonisjs/fold');

require('./markdown-generator');
require('./txt-generator');
require('./epub-generator');

const GeneratorMap = {
    'markdown': 'markdown-generator',
    'md':       'markdown-generator',
    'txt':      'txt-generator',
    'epub':     'epub-generator',
};

function setup(context) {
    ioc.singleton('generator', () => {
        const format = ioc.use('options').format || 'epub';
        const generatorName = GeneratorMap[format];
        if (!generatorName) {
            console.log(`[INFO] unknown format: <${format}>. use epub.`);
        }
        return ioc.use(generatorName || 'epub');
    });

    const generator = ioc.use('generator');
    generator.setup(context);
    context.addMiddleware(generator);
}

module.exports = {
    setup
};
