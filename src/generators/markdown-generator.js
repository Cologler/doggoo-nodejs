'use strict';

const fs = require('fs');

const { ioc } = require('@adonisjs/fold');

const HtmlHelper = require('../utils/html-helper');
const { Generator, NodeVisitor, StringBuilder } = require('./base');

class MarkdownNodeVisitor extends NodeVisitor {
    constructor() {
        super();
        this._builder = new StringBuilder();
    }

    onLineBreak() {
        this._builder.appendLineBreak().appendLineBreak();
    }

    /**
     *
     *
     * @param {HTMLParagraphElement} item
     * @memberof NodeVisitor
     */
    onTextElement(item) {
        let text = item.textContent;
        const hl = HtmlHelper.get(item, 'HeaderLevel');
        if (hl !== null) {
            text = '#'.repeat(hl) + ' ' + text;
        }
        this._builder.append(text).appendLineBreak();
    }

    /**
     *
     *
     * @param {HTMLImageElement} item
     * @memberof NodeVisitor
     */
    onImageElement(item) {
        const url = item.getAttribute('raw-url');
        this._builder.append(`![](${url})`).appendLineBreak();
    }

    /**
     *
     *
     * @param {HTMLAnchorElement} item
     * @memberof NodeVisitor
     */
    onLinkElement(item) {
        const title = item.textContent;
        const url = item.getAttribute('href');
        this._builder.append(`[${title}](${url})`).appendLineBreak();
    }

    value() {
        return this._builder.value();
    }
}

class MarkdownGenerator extends Generator {
    invoke(context) {
        return this.run(context.state.novel);
    }

    run(novel) {
        const w = novel.chapters.length.toString().length;
        novel.chapters.forEach((z, i) => {
            const text = new MarkdownNodeVisitor().visitChapter(z).value();
            const index = (i + 1).toLocaleString('en', {
                minimumIntegerDigits: w,
                useGrouping: false
            });
            const filename = `chapter-${index}.md`;
            const path = filename;
            fs.writeFileSync(path, text, {
                encoding: 'utf8',
                flag: 'w'
            });
        });
    }
}

ioc.bind('markdown-generator', () => new MarkdownGenerator());

module.exports = MarkdownGenerator;
