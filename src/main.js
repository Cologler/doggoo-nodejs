'use strict';

const fs = require('fs');
const PATH = require('path');

const { ioc } = require('@adonisjs/fold');

require('./options');
require('./app');
require('./handlers/image-downloader');

const SessionContext = require('./core/session-context');
const { useGenerator } = require('./generators');
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

    const site = sites.find(z => z.match());
    if (!site) {
        throw Error(`Unknown source <${options.source}>.`);
    }

    const parser = new site.Parser();

    console.log(`[INFO] Matched parser <${parser.name}>.`);

    const rootDir = createRoot(options.output);
    console.log(`[INFO] Creating book on ${rootDir} ...`);

    const session = new SessionContext();
    process.chdir(rootDir);
    session.addHandler(parser);
    useGenerator(session);
    await session.execute();

    console.log(`[INFO] Done.`);
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
