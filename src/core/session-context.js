'use strict';

const { ioc } = require('@adonisjs/fold');
const opencc = require('node-opencc');

const { Novel } = require('../model');

class SessionContext {
    constructor() {
        const options = ioc.use('options');

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
                value: options
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
        const ccopt = options.cc;
        if (ccopt) {
            let func = ccMap[options.cc];
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

    getGenerateMessage(format) {
        const appinfo = ioc.use('app-info');
        return `This ${format} was generated by ${appinfo.name} (build ${appinfo.build}) from ${this.appopt.source}`;
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
