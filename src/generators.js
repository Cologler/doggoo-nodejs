'use strict';

const PATH = require('path');
const fs = require('fs');
const model = require('./model');
const ImageDownloader = require('./handlers/image-downloader');
const OutputGenerator = require('./handlers/output-generator');
const app = require('./app');

class Generator {
    generate(context) {
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

    registerAsHandler(context) {
        const outputHandler = new OutputGenerator(this);
        context.addHandler(outputHandler);
    }
}

class TxtGenerator extends Generator {
    generate(context) {
        const novel = context.novel;
        const text = novel.chapters.map(z => this.toDoc(z)).join('\n\n\n\n');
        const title = novel.titleOrDefault;
        const filename = `${title}.${app.name}-${app.build}.txt`;
        const path = filename;
        fs.writeFileSync(path, text, {
            encoding: 'utf8',
            flag: 'w'
        });
    }

    onLineBreak(node) {
        return '\n';
    }

    onTextElement(node) {
        return node.content;
    }

    onImageElement(node) {
        return `<此处为插图 ${node.url}>`;
    }

    onLinkElement(node) {
        return node.url;
    }
}

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
        return '\n\n';
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


const EpubGenerator = (() => {
    const uuid = require('node-uuid');
    const xmlescape = require('xml-escape');

    class EpubGenerator extends Generator {
        constructor () {
            super();
            this._book = require("epub-builder");
            this._cover = 0;
            this._imageIndex = 0;
        }

        resolveCover(context) {
            const coverArg = context.args['--cover'] || null;
            if (coverArg) {
                const index = Number(coverArg);
                if (!isNaN(index)) {
                    this._cover = index;
                }
            }
        }

        generate(context) {
            const novel = context.novel;
            const book = this._book;
            const title = novel.titleOrDefault;

            book.setTitle(title);
            book.setAuthor(novel.author || 'AUTHOR');
            book.setSummary(novel.summary || 'SUMMARY');
            book.setUUID(uuid.v4());
            this.resolveCover(context);

            novel.chapters.forEach((z, i) => {
                const txtEls = z.contents.filter(z => z instanceof model.TextElement);
                const chapterTitle = txtEls.length > 0 ? txtEls[0].content : 'Chapter Title';
                const text = this.toDoc(z).trim();
                book.addChapter(chapterTitle, text);
            });
            book.createBook(`${title}.${app.name}-${app.build}`);
        }

        onLineBreak(node) {
            return ''; // epub does not allow <br/>
        }

        onTextElement(node) {
            const data = xmlescape(node.content);
            if (node.textIndex === 0) {
                return `<h1>${data}</h1>`;
            } else {
                return `<p>${xmlescape(node.content)}</p>`;
            }
        }

        onImageElement(node) {
            if (this._imageIndex === this._cover || node.url === this._cover) {
                this._book.addCoverImage(node.path);
            } else {
                this._book.addAsset(node.path);
            }

            this._imageIndex++;
            return `<img src="${node.filename}"/>`;
        }

        onLinkElement(node) {
            const data = xmlescape(node.title);
            return `<a href="${node.url}">${data}</a>`;
        }

        registerAsHandler(context) {
            context.addHandler(new ImageDownloader());
            super.registerAsHandler(context);
        }
    }

    return EpubGenerator;
})();

function getGenerator(context) {
    const name = context.args['--gen'];
    switch (name) {
        case 'markdown':
        case 'md':
        case 'gitbook':
            return new MarkdownGenerator();

        case 'txt':
            return new TxtGenerator();

        case 'epub':
            return new EpubGenerator();

        default:
            return new EpubGenerator();
    }
}

function setupGenerator(context) {
    const generator = getGenerator(context);
    generator.registerAsHandler(context);
}

module.exports = {
    setupGenerator
}
