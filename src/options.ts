'use strict';

const fs = require('fs');
const path = require("path");
const { promisify } = require('util');

const { docopt } = require('docopt');
import { ioc } from "anyioc";
import { Logger } from "./utils/logger";

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

import { Range } from "./utils/range";
import { AppInfo } from './doggoo';

export abstract class AppOptions {
    public abstract source: string;

    abstract get format(): string;
    abstract get CookieString(): string | null;
    abstract get output(): string | null;
    abstract get range(): Range | null;
    abstract get cc(): string | null;
    abstract get coverIndex(): string | null;
    abstract get noImages(): boolean;
    abstract hasFlag(name: string): boolean;
    abstract get limitChars(): number;
    abstract get cssPath(): string | null;
    abstract get headerRegex(): RegExp | null;

    abstract async loadAsync(): Promise<any>;
}

async function resolvePathAsync(fileName: string) {
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

class AppOptionsImpl extends AppOptions {
    private _options: any;
    private _range: Range | null = null;
    private _limitChars: number = 0;
    private _headerRegex: RegExp | null = null;
    private _cookieString: string | null = null;
    private _cssPath: string | null = null;
    public source: string;

    constructor() {
        super();
        const appinfo = ioc.getRequired<AppInfo>('app-info');
        const buildtime = `${appinfo.buildtime.toLocaleDateString()} ${appinfo.buildtime.toLocaleTimeString()}`;
        this._options =  docopt(doc, {
            argv: process.argv.slice(2),
            help: true,
            version: `${appinfo.name} (build ${appinfo.build}) at (${buildtime})`,
            options_first: false,
            exit: true
        });
        this.source = this._options['SRC'];
    }

    get format() {
        return this._options['--format'];
    }

    get CookieString() {
        return this._cookieString;
    }

    get output() {
        return this._options['--output'];
    }

    get range() {
        return this._range;
    }

    get cc() {
        return this._options['--cc'];
    }

    get coverIndex() {
        return this._options['--cover-index'];
    }

    get noImages() {
        return this.hasFlag('--no-images');
    }

    hasFlag(name: string) {
        return this._options[name] === true;
    }

    get limitChars() {
        return this._limitChars;
    }

    get cssPath() {
        return this._cssPath;
    }

    get headerRegex() {
        return this._headerRegex;
    }

    private loadRange(logger: Logger) {
        const rangeArg = this._options['--range'];
        if (rangeArg) {
            const range = new Range(rangeArg);
            this._range = range;
            logger.info(`configured range %s.`, range.toString());
        }
    }

    private loadLimitChars(logger: Logger) {
        const limitCharsArg = this._options['--limit-chars'];
        if (limitCharsArg) {
            if (!/\d+/.test(limitCharsArg)) {
                logger.error('<limit-chars> must be a number.');
            }
            this._limitChars = Number(limitCharsArg);
            logger.info('configured limit-chars: %s.', this._limitChars);
        } else {
            this._limitChars = 0;
        }
    }

    private loadHeaderRegex(logger: Logger) {
        const headerRegexArg = this._options['--header-regex'];
        if (headerRegexArg) {
            try {
                this._headerRegex = new RegExp(headerRegexArg);
            } catch (_) {
                logger.error('invaild regex pattern: %s.', headerRegexArg);
            }
        }
    }

    private async loadCookieStringAsync(logger: Logger) {
        const cookieArg: string = this._options['--cookie'];
        if (cookieArg) {
            if (cookieArg.startsWith('@')) {
                const path = cookieArg.substr(1);
                if (!await existsAsync(path)) {
                    return logger.error('no such cookie file: %s.', path);
                }
                this._cookieString = await readFileAsync(path, 'utf-8');
                logger.info('load cookie from file: %s', path);
            } else {
                this._cookieString = cookieArg;
                logger.info('load cookie from argument: %s', cookieArg);
            }
        } else {
            const path = await resolvePathAsync('doggoo_cookie.txt');
            if (path) {
                this._cookieString = await readFileAsync(path, 'utf-8');
                logger.info('load default cookie from file: %s.', path);
            }
        }
    }

    private async loadCSSPathAsync(logger: Logger) {
        const cssArg: string = this._options['--css'];
        if (cssArg) {
            let cssPath = cssArg;
            if (cssArg.startsWith('@')) {
                cssPath = cssPath.substr(1);
            }
            if (!await existsAsync(cssPath)) {
                return logger.error('no such css file: %s.', cssPath);
            }
            this._cssPath = path.resolve(cssPath);
        } else {
            let cssPath = await resolvePathAsync('doggoo_style.css');
            if (cssPath) {
                this._cssPath = cssPath;
                logger.info('load default style from file: %s.', cssPath);
            }
        }
    }

    async loadAsync() {
        const logger = ioc.getRequired<Logger>(Logger);
        this.loadRange(logger);
        this.loadLimitChars(logger);
        this.loadHeaderRegex(logger);
        await this.loadCookieStringAsync(logger);
        await this.loadCSSPathAsync(logger);
    }
}

ioc.registerSingleton(AppOptions, () => new AppOptionsImpl());
ioc.registerTransient('options', ioc => ioc.getRequired(AppOptions));
