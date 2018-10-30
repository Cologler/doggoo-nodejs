import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import iconv from 'iconv-lite';

import { ioc } from "anyioc";

const readFileAsync = promisify(fs.readFile);
const detectFileAsync = promisify(require('chardet').detectFile);

import { readText } from "../utils/text-reader";
import { setAttr, AttrSymbols } from '../utils/attrs';
import { Chapter } from '../models/sections';
import { Novel } from "../models/novel";
import { TextConverter } from "../components/text-converter";
import { AppOptions } from "../options";
import { InfoBuilder, IParser, DoggooFlowContext } from '../doggoo';
import { EasyParser } from './base';

function match() {
    const options = ioc.getRequired<AppOptions>('options');
    const filepath = options.source;
    if (!filepath || !fs.existsSync(filepath)) {
        return false;
    }
    let stats = fs.lstatSync('/the/path');
    if (!stats.isFile()) {
        return false;
    }
    if (filepath.toLowerCase().endsWith('.txt')) {
        options.source = path.resolve(filepath);
        return true;
    }
    return false;
}

class TxtFileParser extends EasyParser {
    name: string = 'txt';

    constructor() {
        super();
    }

    async parseChapters(context: DoggooFlowContext) {
        // hide user info from the generated book.
        ioc.getRequired<InfoBuilder>('info-builder').source = 'a txt file';

        const novel = context.state.novel;

        const options = ioc.getRequired<AppOptions>('options');
        const filepath = options.source;
        /** @type {RegExp} */
        const headerRegex = options.headerRegex || /^第.+([章节话話])/;

        let text = await readText(filepath);
        text = text.replace(/\r/g, '');

        /*
         * TODO: add image from txt
         * like: <image FILE_PATH>
         */

        let chapter = null;
        for (const line of text.split(/\n/g)) {
            const t = this.convertText(line);

            const headerMatch = line.match(headerRegex);
            if (chapter === null || headerMatch) {
                chapter = this.createChapter();
            }

            const textNode = chapter.addText(t);

            if (textNode) {
                if (headerMatch && headerMatch[1]) {
                    let headerType = null;

                    if (/[章]/.test(headerMatch[1])) {
                        headerType = 'chapter';
                    } else if (/[节]/.test(headerMatch[1])) {
                        headerType = 'section';
                    } else if (/[话話]/.test(headerMatch[1])) {
                        headerType = 'number';
                    } else {
                        headerType = 'number';
                    }

                    if (headerType) {
                        setAttr(textNode, AttrSymbols.HeaderType, headerType);
                    }
                }

                chapter.addLineBreak();
            }
        }
    }
}

export default {
    match,
    Parser: TxtFileParser
}
