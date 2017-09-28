'use strict';

const opencc = require('node-opencc');

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
        this._handlers = [];
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

    addHandler(handler) {
        this._handlers.push(handler);
    }

    async execute() {
        for (const handler of this._handlers) {
            await handler.handle(this);
        }
    }
}

module.exports = SessionContext;
