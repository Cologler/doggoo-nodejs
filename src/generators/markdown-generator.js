'use strict';

const os = require('os');
const fs = require('fs');

const app = require('../app'); // ???
const { Generator } = require('./base');

class MarkdownGenerator extends Generator {
    generate(context) {
        const novel = context.novel;
        const w = novel.chapters.length.toString().length;
        novel.chapters.forEach((z, i) => {
            const text = this.toDoc(z).trim();
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

    onLineBreak(node) {
        return os.EOL + os.EOL;
    }

    onTextElement(node) {
        if (node.textIndex === 0) {
            return '# ' + node.content;
        }
        return node.content;
    }

    onImageElement(node) {
        return `![](${node.path})`;
    }

    onLinkElement(node) {
        return `[${node.title}](${node.url})`;
    }
}

module.exports = MarkdownGenerator;
