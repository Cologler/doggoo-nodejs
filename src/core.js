'use strict';

const opencc = require('node-opencc');

class Args {
    constructor() {
        this._argsName = new Set();
        this._argsName.add('--gen');
        this._argsName.add('--cover');
        this._argsName.add('--cc');
        this._argsName.add('--output');
    }

    registerArgName(name) {
        this._argsName.add(name);
    }

    parseArgs(args) {
        const options = {};
        for (let i = 0; i < args.length; i += 2) {
            const key = args[i];
            if (args.length === i + 1) {
                throw Error(`Args ${key} has no value.`);
            }
            const value = args[i+1];
            if (this._argsName.has(key)) {
                options[key] = value;
            } else {
                throw Error(`Unknown args ${key}`);
            }
        }
        return options;
    }
}

class SessionContext {
    constructor(options) {
        Object.keys(options).map(k => {
            Object.defineProperty(this, k, {
                get: () => options[k]
            })
        });
        this._ccc = {
            hk2s : opencc.hongKongToSimplified,
            s2hk : opencc.simplifiedToHongKong,
            s2t  : opencc.simplifiedToTraditional,
            s2tw : opencc.simplifiedToTaiwan,
            //s2twp: opencc.simplifiedToTaiwanWithPhrases,
            t2hk : opencc.traditionalToHongKong,
            t2s  : opencc.traditionalToSimplified,
            t2tw : opencc.traditionalToTaiwan,
            tw2s : opencc.taiwanToSimplified,
            //tw2sp: opencc.taiwanToSimplifiedWithPhrases
        }
    }

    cc(text) {
        let c = this.args['--cc'];
        if (c) {
            let func = this._ccc[c];
            if (func) {
                return func(text);
            }
        }
        return text;
    }
}

module.exports = {
    Args,
    SessionContext,
}
