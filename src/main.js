'use strict';

const fs = require('fs');
const PATH = require('path');
const Args = require('./core/args');
const SessionContext = require('./core/session-context');
const { useGenerator } = require('./generators');
const app = require('./app');
const sites = require('./sites');

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
        throw Error('Require source (maybe a url).');
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
    if (process.argv.length === 3 && process.argv[2] === '-v') {
        console.log(`${app.name} (build ${app.build})`);
        return;
    }

    const options = getOptions();
    const site = sites.find(z => z.match(options));
    if (!site) {
        throw Error(`Unknown source <${options.source}>.`);
    }

    const parser = new site.Parser();

    console.log(`Matched parser <${parser.name}>.`);

    if (process.argv.length > 3) {
        const args = new Args();
        parser.registerArgs(args);
        options.args = args.parseArgs(process.argv.slice(3));
    } else {
        options.args = options.args || {};
    }

    Object.assign(options, {
        root: createRoot(options.args['--output'])
    });

    const session = new SessionContext(options);
    process.chdir(session.root);
    session.addHandler(parser);
    useGenerator(session);
    await session.execute();
}

(async function() {
    try {
        await main();
    } catch (error) {
        console.error(error);
    }
})();
