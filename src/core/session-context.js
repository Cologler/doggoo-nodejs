'use strict';

const opencc = require('node-opencc');

const { appopt } = require('../options');
const { Novel } = require('../model');

class SessionContext {
    constructor() {
        Object.defineProperties(this, {
            handlers: {
                value: []
            },
            env: {
                value: {}
            },
            novel: {
                value: new Novel()
            },
            appopt: {
                value: appopt()
            }
        });

        const ccMap = {
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
        };

        this._ccfunc = null;
        const ccopt = appopt().cc;
        if (ccopt) {
            let func = ccMap[appopt().cc];
            if (func) {
                this._ccfunc = func;
            } else {
                const cmds = Object.keys(ccMap).join('\n');
                const msg = `Unknown cc options. Available are: \n${cmds}`;
                throw new Error(msg);
            }
        } else {
            this._ccfunc = text => text;
        }
    }

    get novel() {
        return this._novel;
    }

    cc(text) {
        return this._ccfunc(text);
    }

    addHandler(handler) {
        this.handlers.push(handler);
    }

    async execute() {
        for (const handler of this.handlers) {
            await handler.handle(this);
        }
    }
}

module.exports = SessionContext;
