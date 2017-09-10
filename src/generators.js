'use strict';

const PATH = require('path');
const fs = require('fs');
const model = require('./model');

class Generator {
    generate(context, chapters) {
        throw 'not impl.';
    }

    toDoc(chapter) {
        return chapter.contents.map(z => {
            switch (z.constructor) {
                case model.LineBreak:
                    return this.onLineBreak(z);
                case model.TextElement:
                    return this.onTextElement(z);
                case model.ImageElement:
                    return this.onImageElement(z);
                case model.LinkElement:
                    return this.onLinkElement(z);
                default:
                    throw new Error(`Unhandled chapter content type <${z.constructor}>`);
            }
        }).join('');
    }

    onLineBreak(node) {
        throw new Error('NotImplementedError');
    }

    onTextElement(node) {
        throw new Error('NotImplementedError');
    }

    onImageElement(node) {
        throw new Error('NotImplementedError');
    }

    onLinkElement(node) {
        throw new Error('NotImplementedError');
    }
}

class TxtGenerator extends Generator {
    generate(context) {
        const text = novel.chapters.map(z => z.toString()).join('\r\n');
        const filename = (novel.title || 'novel') + '.txt';
        const path = PATH.join(context.root, filename);
        fs.writeFileSync(path, text, {
            encoding: 'utf8',
            flag: 'w'
        });
    }
}

class MarkdownGenerator extends Generator {
    generate(context) {
        const novel = context.novel;
        const w = novel.chapters.length.toString().length;
        novel.chapters.forEach((z, i) => {
            const text = this.toDoc(z);
            const index = (i + 1).toLocaleString('en', {
                minimumIntegerDigits: w,
                useGrouping: false
            });
            const filename = `chapter-${index}.md`;
            const path = PATH.join(context.root, filename);
            fs.writeFileSync(path, text, {
                encoding: 'utf8',
                flag: 'w'
            });
        });
    }

    onLineBreak(node) {
        return '\n\n';
    }

    onTextElement(node) {
        if (node.textIndex === 0) {
            return '# ' + node.content;
        }
        return node.content;
    }

    onImageElement(node) {
        return `![](${node.url})`;
    }

    onLinkElement(node) {
        return `[${node.title}](${node.url})`;
    }
}

function getGenerator(name) {
    switch (name) {
        case 'markdown':
        case 'md':
        case 'gitbook':
            return new MarkdownGenerator();
        case 'txt':
        default:
            return new TxtGenerator();
    }
}

module.exports = {
    getGenerator
}
