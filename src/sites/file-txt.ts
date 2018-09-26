'use strict';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import iconv from 'iconv-lite';

import { ioc } from "anyioc";

const readFileAsync = promisify(fs.readFile);
const detectFileAsync = promisify(require('chardet').detectFile);

import { setAttr, AttrSymbols } from '../utils/attrs';
import { Chapter } from '../models/sections';
import { Novel } from "../models/novel";
import { TextConverter } from "../components/text-converter";
import { AppOptions } from "../options";
import { InfoBuilder, IParser } from '../doggoo';

function match() {
    const options = ioc.getRequired<AppOptions>('options');
    const filepath = options.source;
    if (filepath && fs.existsSync(filepath) && filepath.toLowerCase().endsWith('.txt')) {
        options.source = path.resolve(filepath);
        return true;
    }
    return false;
}

class TxtFileParser implements IParser {
    name: string = 'txt';

    private _chapters: Array<Chapter> = [];
    private _textConverter: TextConverter;

    constructor() {
        this._textConverter = ioc.getRequired<TextConverter>(TextConverter);
    }

    createChapter() {
        let chapter = new Chapter();
        this._chapters.push(chapter);
        return chapter;
    }

    async run(context: any) {
        const novel = context.novel;
        return this._buildNovel(novel);
    }

    invoke(context: any) {
        return this._buildNovel(context.state.novel);
    }

    async _buildNovel(novel: Novel) {
        // hide user info from the generated book.
        ioc.getRequired<InfoBuilder>('info-builder').source = 'a txt file';

        const options = ioc.getRequired<AppOptions>('options');
        const filepath = <string> options.source;
        /** @type {RegExp} */
        const headerRegex = options.headerRegex || /^第.+([章节话話])/;

        const encoding = await detectFileAsync(filepath);
        /** @type {string} */
        const buffer = Buffer.from(await readFileAsync(filepath, {
            encoding: 'binary'
        }), 'binary');
        let text = iconv.decode(buffer, encoding);
        text = text.replace(/\r/g, '');

        /*
         * TODO: add image from txt
         * like: <image FILE_PATH>
         */

        let chapter = null;
        for (const line of text.split(/\n/g)) {
            const t = this._textConverter.convert(line);

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

        this._chapters.filter(z => {
            return z.textLength > options.limitChars;
        }).forEach(z => {
            novel.add(z);
        });
    }
}

export default {
    match,
    Parser: TxtFileParser
}
