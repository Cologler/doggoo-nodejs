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
    'none':     'none-generator',
};

function setup() {
    ioc.singleton('generator', () => {
        const format = ioc.use('options').format || 'epub';
        const generatorName = GeneratorMap[format];
        if (!generatorName) {
            ioc.use('warn')(`unknown format: <${format}>. use epub.`);
        }
        return ioc.use(generatorName || 'epub');
    });
}

module.exports = {
    setup
};
