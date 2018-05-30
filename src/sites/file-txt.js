'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const { ioc } = require('@adonisjs/fold');

const readFileAsync = promisify(fs.readFile);
const detectFileAsync = promisify(require('chardet').detectFile);

const { Chapter } = require('../models/sections');

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
    }

    createChapter() {
        let chapter = new Chapter();
        this._chapters.push(chapter);
        return chapter;
    }

    async run(context) {
        // hide user info from the generated book.
        context.src = 'txt file';

        const options = ioc.use('options');
        const filepath = options.source;
        const novel = context.novel;
        /** @type {RegExp} */
        const headerRegex = options.headerRegex || /^第.+话/;

        const encoding = await detectFileAsync(filepath);
        /** @type {string} */
        let text = await readFileAsync(filepath, encoding);
        text = text.replace(/\r/g, '');

        let chapter = null;
        for (const line of text.split(/\n/g)) {
            const t = context.cc(line);
            if (chapter !== null && headerRegex !== null) {
                if (headerRegex.test(line)) {
                    chapter = this.createChapter();
                }
            }
            chapter = chapter || this.createChapter();
            chapter.addText(t);
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
