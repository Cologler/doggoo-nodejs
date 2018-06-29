'use strict';

const fs = require('fs');
const PATH = require('path');

const { ioc } = require('@adonisjs/fold');

require('./print');

ioc.singleton('event-emitter', () => {
    const events = require('events');
    return new events.EventEmitter();
});
ioc.singleton('dom', () => {
    const { JSDOM } = require('jsdom');
    return new JSDOM();
});

require('./app');
require('./options');
require('./handlers/image-downloader');
require('./models/factory');

const SessionContext = require('./core/session-context');
const { setup } = require('./generators');
const sites = require('./sites');
const { MessageError } = require('./err');

function createRoot(output) {
    if (output) {
        const path = output;
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
            return path;
        }
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
    const options = ioc.use('options');
    await options.loadAsync();

    const site = sites.find(z => z.match());
    if (!site) {
        ioc.use('error')(`Unknown source <${options.source}>.`);
    }

    const parser = new site.Parser();

    const info = ioc.use('info');

    info(`matched parser <${parser.name}>.`);

    const rootDir = createRoot(options.output);
    info(`creating book on ${rootDir} ...`);
    process.chdir(rootDir);

    const session = new SessionContext();
    ioc.singleton('context', () => session);

    session.addMiddleware(parser);

    if (options.hasFlag('--enable-filter')) {
        const { Filter } = require('./handlers/chapter-filter');
        session.addMiddleware(new Filter());
    }

    const { Optimizer } = require('./handlers/optimize-composition');
    session.addMiddleware(new Optimizer());

    setup(session);
    await session.run();

    info(`Done.`);
}

(async function() {
    try {
        await main();
    } catch (error) {
        if (error instanceof MessageError) {
            console.error(`[ERROR] ${error.message}`);
        } else {
            console.error(error);
        }
    }
})();
