'use strict';

const os = require('os');
const fs = require('fs');

const { Generator, NodeVisitor, StringBuilder } = require('./base');

class MarkdownNodeVisitor extends NodeVisitor {
    constructor() {
        super();
        this._builder = new StringBuilder();
    }

    onLineBreak() {
        this._builder.appendLineBreak().appendLineBreak();
    }

    onTextElement(item) {
        let text = item.content;
        if (item.textIndex === 0) {
            text = '# ' + text;
        }
        this._builder.append(text).appendLineBreak();
    }

    onImageElement(item) {
        this._builder.append(`![](${item.path})`).appendLineBreak();
    }

    onLinkElement(item) {
        this._builder.append(`[${item.title}](${item.url})`).appendLineBreak();
    }

    value() {
        return this._builder.value();
    }
}

class MarkdownGenerator extends Generator {
    generate(context) {
        const novel = context.novel;
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

module.exports = MarkdownGenerator;
