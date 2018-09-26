
'use strict';

import { ioc } from "anyioc";

import { Logger } from "../utils/logger";
import { AppOptions } from '../options';

require('./markdown-generator');
require('./txt-generator');
require('./epub-generator');

const GeneratorMap: { [name: string]: string } = {
    'markdown': 'markdown-generator',
    'md':       'markdown-generator',
    'txt':      'txt-generator',
    'epub':     'epub-generator',
    'none':     'none-generator',
};

export function setup() {
    ioc.registerSingleton('generator', () => {
        const logger = ioc.getRequired<Logger>(Logger);
        const format = ioc.getRequired<AppOptions>(AppOptions).format || 'epub';

        let generatorName = GeneratorMap[format];
        if (!generatorName) {
            logger.warn('unknown format: %s. use epub.', format);
            generatorName = GeneratorMap['epub'];
        }
        return ioc.getRequired<any>(generatorName);
    });
}
