'use strict';

const fs = require('fs');
const PATH = require('path');

const { appopt } = require('./options');
const SessionContext = require('./core/session-context');
const { useGenerator } = require('./generators');
const app = require('./app');
const sites = require('./sites');
const { MessageError } = require('./err');
const x = require('./options');

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

function getOptions() {
    let argv = process.argv;

    if (argv.length < 3) {
        throw new MessageError('Require source (maybe a url).');
    }

    let options = null;
    const firstArgs = argv[2];
    if (argv.length === 3 && fs.existsSync(firstArgs)) {
        options = JSON.parse(fs.readFileSync(firstArgs));
    }

    return options || {
        source: firstArgs
    };
}

async function main() {
    const options = getOptions();
    const site = sites.find(z => z.match(options));
    if (!site) {
        throw Error(`Unknown source <${options.source}>.`);
    }

    const parser = new site.Parser();

    console.log(`[INFO] Matched parser <${parser.name}>.`);

    const rootDir = createRoot(appopt().output);
    console.log(`[INFO] Creating book on ${rootDir} ...`);

    const session = new SessionContext(options);
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
