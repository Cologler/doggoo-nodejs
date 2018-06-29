'use strict';

const fs = require('fs');
const path = require("path");
const { promisify } = require('util');

const { docopt } = require('docopt');
const { ioc } = require('@adonisjs/fold');

const { exit } = require('./err');
const { Range } = require('./utils/range');

const existsAsync = promisify(fs.exists);
const readFileAsync = promisify(fs.readFile);
const homedir = require('os').homedir();

const doc = `
Generate e-book from website.

Usage:
    doggoo SRC [options]
    doggoo -h | --help
    doggoo --version

Options:
    --format=<>                 # Set the output format.
    --cookie=<>                 # Set the cookie for network requests.
    --output=<>                 # Set the output location.
    --range=<>                  # Set range.
    --cc=<>                     # Set the chinese converter.
    --cover-index=<>            # Set the cover index in all images.
    --limit-chars=<>            # Set ignore if char count less than the value.
    --no-images                 # (epub) Do not download images.
    --css=<>                    # (epub) Use the css to create epub.
    --header-regex=<>           # (src:txt) Use regex to split chapter.
    --enable-filter             # Allow filter chapter.
    --enable-filter-summary     # Allow filter chapter.
`;

const appinfo = ioc.use('app-info');

const buildtime = `${appinfo.buildtime.toLocaleDateString()} ${appinfo.buildtime.toLocaleTimeString()}`;

const options = docopt(doc, {
    argv: process.argv.slice(2),
    help: true,
    version: `${appinfo.name} (build ${appinfo.build}) at (${buildtime})`,
    options_first: false,
    exit: true
});

class ApplicationOptions {
    constructor() {
        // range
        const range = options['--range'];
        if (range) {
            this._range = new Range(range);
            console.log(`[INFO] configured range ${this._range.toString()}.`);
        } else {
            this._range = null;
        }

        // --limit-chars
        this._limitChars = options['--limit-chars'];
        if (this._limitChars !== null) {
            if (!/\d+/.test(this._limitChars)) {
                console.log('<limit-chars> must be a number.');
                process.exit(1);
            }
            this._limitChars = Number(this._limitChars);
            console.log(`[INFO] configured limit-chars: ${this._limitChars}.`);
        } else {
            this._limitChars = 0;
        }

        this._cookie = null;
        this._css = null;

        // --header-regex
        this._headerRegex = options['--header-regex'];
        if (this._headerRegex) {
            try {
                this._headerRegex = new RegExp(this._headerRegex);
            } catch (_) {
                console.error(`[ERROR] invaild regex pattern: <${this._headerRegex}>.`);
                process.exit(1);
            }
        }
    }

    get source() {
        return options['SRC'];
    }

    set source(val) {
        options['SRC'] = val;
    }

    get format() {
        return options['--format'];
    }

    get cookie() {
        return this._cookie;
    }

    get output() {
        return options['--output'];
    }

    get range() {
        return this._range;
    }

    get cc() {
        return options['--cc'];
    }

    get coverIndex() {
        return options['--cover-index'];
    }

    get noImages() {
        return this.hasFlag('--no-images');
    }

    hasFlag(name) {
        return options[name] === true;
    }

    get limitChars() {
        return this._limitChars;
    }

    get css() {
        return this._css;
    }

    get headerRegex() {
        return this._headerRegex;
    }

    async loadAsync() {
        async function resolvePath(fileName) {
            // current work dir
            if (await existsAsync(fileName)) {
                return path.resolve(fileName);
            }

            // home dir
            let filePath = path.join(homedir, fileName);
            if (await existsAsync(filePath)) {
                return filePath;
            }

            return null;
        }

        // cookie
        this._cookie = options['--cookie'];
        if (this._cookie && this._cookie.startsWith('@')) {
            const path = this._cookie.substr(1);
            if (!await existsAsync(path)) {
                return exit(`no such cookie file: <${path}>.`);
            }
            this._cookie = await readFileAsync(path, 'utf-8');
            console.log(`[INFO] load cookie from file <${path}>.`);
        } else if (!this._cookie) {
            const path = await resolvePath('doggoo_cookie.txt');
            if (path) {
                this._cookie = await readFileAsync(path, 'utf-8');
                console.log(`[INFO] load default cookie from file <${path}>.`);
            }
        }

        // css
        let cssPath = options['--css'];
        if (cssPath) {
            if (cssPath.startsWith('@')) {
                cssPath = cssPath.substr(1);
            }
            if (!await existsAsync(cssPath)) {
                return exit(`no such css file: <${this._css}>.`);
            }
            this._css = path.resolve(cssPath);
        } else {
            cssPath = await resolvePath('doggoo_style.css');
            if (cssPath) {
                this._css = cssPath;
                console.log(`[INFO] load default style from file <${cssPath}>.`);
            }
        }
    }
}

ioc.singleton('options', () =>{
    return new ApplicationOptions();
});
