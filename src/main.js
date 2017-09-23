'use strict';

const request = require('async-request');
const jsdom = require('jsdom');
const fs = require('fs');
const PATH = require('path');
const { SessionContext } = require('./core');
const { parsers } = require('./parser');
const { getGenerator } = require('./generators.js');
const { prepareNovel } = require('./pregen');

async function requestData(url) {
    // TODO: das
    const response = await request(url);
    const body = response.body;
    return body;
}

function createRoot() {
    const root = '.';
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

function parseArgv() {
    let argv = process.argv;
    let options = {};

    if (argv.length < 3) {
        throw Error('require url.');
    }

    options.url = argv[2];
    options.args = {};

    if (argv.length > 3) {
        for (let i = 3; i < argv.length; i += 2) {
            const key = argv[i];
            if (argv.length === i + 1) {
                throw Error(`args ${key} has no value.`);
            }
            const value = argv[i+1];
            switch (key) {
                case '--gen':
                case '--cover':
                case '--cc':
                    options.args[key] = value;
                    break;
                default:
                    throw Error(`unknown args ${key}`);
            }
        }
    }

    return options;
}

async function main() {
    const options = parseArgv();
    const parser = parsers.find(z => z.match(options.url));
    if (!parser) {
        console.log('unknown url.');
        return;
    }
    const generator = getGenerator(options.args['--gen']);
    const body = await requestData(options.url);
    const dom = new jsdom.JSDOM(body);
    Object.assign(options, {
        root: createRoot(),
        window: dom.window
    });

    const session = new SessionContext(options);
    process.chdir(session.root);
    parser.parse(session);
    await prepareNovel(session);
    generator.generate(session);
}

(async function() {
    try {
        await main();
    } catch (error) {
        console.error(error);
    }
})();
