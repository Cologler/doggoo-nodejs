'use strict';

const request = require('async-request');
const jsdom = require('jsdom');
const fs = require('fs');
const PATH = require('path');
const { Args, SessionContext } = require('./core');
const { parsers } = require('./parser');
const { getGenerator } = require('./generators.js');
const { prepareNovel } = require('./pregen');

async function requestData(url) {
    // TODO: das
    const response = await request(url);
    const body = response.body;
    return body;
}

function createRoot(output) {
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
        url: firstArgs
    };
}

async function main() {
    const options = getOptions();
    const parser = parsers.find(z => z.match(options.url));
    if (!parser) {
        throw Error(`Unknown source <${options.url}>.`);
    } else {
        console.log(`Matched parser <${parser.name}>.`);
    }
    if (process.argv.length > 3) {
        const args = new Args();
        parser.registerArgs(args);
        options.args = args.parseArgs(process.argv.slice(3));
    } else {
        options.args = options.args || {};
    }

    const generator = getGenerator(options.args['--gen']);
    const body = await requestData(options.url);
    const dom = new jsdom.JSDOM(body);
    Object.assign(options, {
        root: createRoot(options.args['--output']),
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
