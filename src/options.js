'use strict';

const fs = require('fs');
const path = require("path");

const { docopt } = require('docopt');
const { ioc } = require('@adonisjs/fold');

const { Range } = require('./utils/range');

const doc = `
Generate e-book from website.

Usage:
    doggoo URL [options]
    doggoo -h | --help
    doggoo --version

Options:
    --format=<>         # Set the output format.
    --cookie=<>         # Set the cookie for network requests.
    --output=<>         # Set the output location.
    --range=<>          # Set range.
    --cc=<>             # Set the chinese converter.
    --cover-index=<>    # Set the cover index in all images.
    --no-images         # Do not download images.
    --limit-chars=<>    # Set ignore if char count less than the value.
    --css               # Use the css to create epub.
`;

const appinfo = ioc.use('app-info');

const options = docopt(doc, {
    argv: process.argv.slice(2),
    help: true,
    version: `${appinfo.name} (build ${appinfo.build})`,
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

        // --cookie
        this._cookie = options['--cookie'];
        if (this._cookie && this._cookie.startsWith('@')) {
            const path = this._cookie.substr(1);
            if (!fs.existsSync(path)) {
                console.error(`[ERROR] no such cookie file: <${path}>.`);
                process.exit(1);
            }
            this._cookie = fs.readFileSync(path, 'utf-8');
            console.log(`[INFO] load cookie from file <${path}>.`);
        } else if (!this._cookie) {
            const path = 'doggoo_cookie.txt';
            if (fs.existsSync(path)) {
                this._cookie = fs.readFileSync(path, 'utf-8');
                console.log(`[INFO] load default cookie from file <${path}>.`);
            }
        }

        // --css
        this._css = options['--css'];
        if (this._css) {
            if (!fs.existsSync(this._css)) {
                console.error(`[ERROR] no such css file: <${this._css}>.`);
                process.exit(1);
            }
            this._css = path.resolve(this._css);
        } else {
            let cssPath = path.resolve('doggoo_style.css');
            if (fs.existsSync(cssPath)) {
                this._css = cssPath;
                console.log(`[INFO] load default style from file <${cssPath}>.`);
            }
        }
    }

    get source() {
        return options['URL'];
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
}

ioc.singleton('options', () =>{
    return new ApplicationOptions();
});
