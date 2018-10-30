import fs from 'fs';
import path from 'path';

import { ioc } from "anyioc";

import { readText } from "../utils/text-reader";
import { setAttr, AttrSymbols } from '../utils/attrs';
import { AppOptions } from "../options";
import { DoggooFlowContext } from '../doggoo';
import { EasyParser } from './base';

function match() {
    const options = ioc.getRequired<AppOptions>('options');
    const filepath = options.source;
    if (!filepath || !fs.existsSync(filepath)) {
        return false;
    }
    let stats = fs.lstatSync(filepath);
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
        this.hideSource('a .txt file');

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
