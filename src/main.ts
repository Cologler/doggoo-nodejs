'use strict';

import fs from 'fs';
import PATH from 'path';

import { ioc } from 'anyioc';
import { App } from 'anyflow';

import { FlowContextState, IGenerator } from "./doggoo";
import { Novel } from './models/novel';
import { AppOptions } from './options';
import { Logger } from './utils/logger';

ioc.registerSingleton('event-emitter', () => {
    const events = require('events');
    return new events.EventEmitter();
});
ioc.registerSingleton('dom', () => {
    const { JSDOM } = require('jsdom');
    return new JSDOM();
});

require('./app');
require('./options');
require('./handlers/image-downloader');
require('./models/factory');
require('./utils/info-builder');
require('./components/text-converter');

import sites from "./sites";

function createRoot(output: string | null): string {
    if (output) {
        const path = output;
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        return path;
    } else {
        const root = output || '.';
        let index = 1;
        while (true) {
            const path = PATH.join(root, 'novel-' + index);
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
                return path;
            }
            index += 1;
        }
    }
}

async function main() {
    const options = ioc.getRequired<AppOptions>(AppOptions);
    const logger = ioc.getRequired<Logger>(Logger);

    await options.loadAsync();

    const site = sites.find(z => z.match());
    if (!site) {
        return logger.error('unknown source <%s>.', options.source);
    }

    require('./generators').setup();

    const parser = new site.Parser();

    logger.info('matched parser <%s>.', parser.name);

    const rootDir = createRoot(options.output);
    logger.info('creating book on %s ...', rootDir);
    process.chdir(rootDir);

    const app = new App<FlowContextState>();
    app.flow()
        .use(async c => {
            // setup envs
            c.state.options = options;
            c.state.novel = new Novel();
        }).use(parser);

    const { Filter } = require('./handlers/chapter-filter');
    app.branch(c => c.state.options.hasFlag('--enable-filter'))
        .flow()
        .use(new Filter());

    const { Optimizer } = require('./handlers/optimize-composition');
    app.flow().use(new Optimizer());

    const generator = ioc.getRequired<IGenerator>('generator');
    if (generator.requireImages) {
        app.flow().use(ioc.getRequired<any>('image-downloader'));
    }
    app.flow().use(<any> generator);

    await app.run();
    logger.info(`Done.`);
}

(async function() {
    try {
        await main();
    } catch (error) {
        console.error(error);
        process.exit(1); // cancel all incompletion jobs.
    }
})();
