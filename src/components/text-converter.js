'use strict';

const { ioc } = require('@adonisjs/fold');
const opencc = require('node-opencc');

const OpenCCOptionsMap = {
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

class FuncTextConverter {
    constructor(func) {
        this._func = func;
    }

    convert(text) {
        return this._func(text);
    }
}

function getTextConverter() {
    const options = ioc.use('options');
    const ccopt = options.cc;
    if (ccopt) {
        let func = OpenCCOptionsMap[ccopt];
        if (func) {
            ioc.use('info')('configured text converter: %s.', ccopt);
            return new FuncTextConverter(func);
        } else {
            const cmds = Object.keys(OpenCCOptionsMap).join('\n');
            const msg = `Unknown cc options. Available are: \n${cmds}`;
            throw new Error(msg);
        }
    } else {
        return new FuncTextConverter(text => text);
    }
}

function setup() {
    const textConverter = getTextConverter();
    ioc.singleton('text-converter', () => textConverter);
}

module.exports = {
    setup
};
