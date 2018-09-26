'use strict';

import { ioc } from 'anyioc';

const opencc= require('node-opencc');

import { AppOptions } from "../options";
import { Logger } from "../utils/logger";

const OpenCCOptionsMap: { [k: string]: any } = {
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

export abstract class TextConverter {
    abstract convert(text: string): string;
}

class FuncTextConverter extends TextConverter {
    private _func: (origin: string) => string;

    constructor(func: (origin: string) => string) {
        super();
        this._func = func;
    }

    convert(text: string) {
        return this._func(text);
    }
}

function getTextConverter() {
    const options = ioc.getRequired<AppOptions>(AppOptions);
    const ccopt = options.cc;
    if (ccopt) {
        let func = <(origin: string) => string>(OpenCCOptionsMap[ccopt]);
        const logger = ioc.getRequired<Logger>(Logger);
        if (func) {
            logger.info('configured text converter: %s.', ccopt);
            return new FuncTextConverter(func);
        } else {
            const cmds = Object.keys(OpenCCOptionsMap).join('\n');
            const msg = `Unknown cc options. Available are: \n${cmds}`;
            return logger.error(msg);
        }
    } else {
        return new FuncTextConverter(text => text);
    }
}

ioc.registerSingleton(TextConverter, getTextConverter);
ioc.registerTransient('text-converter', () => ioc.getRequired(TextConverter));
