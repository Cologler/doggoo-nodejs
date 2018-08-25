'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const iconv = require('iconv-lite');

const { ioc } = require('@adonisjs/fold');

const readFileAsync = promisify(fs.readFile);
const detectFileAsync = promisify(require('chardet').detectFile);

const { Chapter } = require('../models/sections');
const HtmlHelper = require('../utils/html-helper');

function match() {
    const options = ioc.use('options');
    /** @type {string} */
    const filepath = options.source;
    if (fs.existsSync(filepath) && filepath.toLowerCase().endsWith('.txt')) {
        options.source = path.resolve(filepath);
        return true;
    }
    return false;
}

class TxtFileParser {
    constructor() {
        /** @type {Chapter[]} */
        this._chapters = [];
        this._textConverter = ioc.use('text-converter');
    }

    createChapter() {
        let chapter = new Chapter();
        this._chapters.push(chapter);
        return chapter;
    }

    async run(context) {
        const novel = context.novel;
        return this._buildNovel(novel);
    }

    invoke(context) {
        return this._buildNovel(context.state.novel);
    }

    async _buildNovel(novel) {
        // hide user info from the generated book.
        use('infos').source = 'a txt file';

        const options = ioc.use('options');
        const filepath = options.source;
        /** @type {RegExp} */
        const headerRegex = options.headerRegex || /^第.+([章节话話])/;

        const encoding = await detectFileAsync(filepath);
        /** @type {string} */
        const buffer = await readFileAsync(filepath, {
            encoding: 'binary'
        });
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
            if (headerMatch && headerMatch[1]) {
                let headerType = null;

                if (/[章]/.test(headerMatch[1])) {
                    headerType = 'chapter';
                } else if (/[节]/.test(headerMatch[1])) {
                    headerType = 'section';
                } else if (/[话話]/.test(headerMatch[1])) {
                    headerType = 'number';
                }

                if (headerType) {
                    HtmlHelper.set(textNode, 'HeaderType', headerType);
                }
            }

            chapter.addLineBreak();
        }

        this._chapters.filter(z => {
            return z.textLength > options.limitChars;
        }).forEach(z => {
            novel.add(z);
        });
    }
}

module.exports = {
    match,
    Parser: TxtFileParser
};
