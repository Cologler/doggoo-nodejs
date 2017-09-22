'use strict';

const URL = require('url');
const model = require('./model');
const { Novel, Chapter } = model;

class Parser {
    match(url) {
        throw 'not impl.';
    }

    parse(session) {
        throw 'not impl.';
    }

    onNode(context, chapter, node) {
        const window = context.window;
        switch (node.nodeType) {
            case window.Node.TEXT_NODE:
                chapter.addText(node.textContent);
                break;

            case window.Node.ELEMENT_NODE:
                switch (node.tagName) {
                    case 'A':
                        chapter.addLink(node.href, node.textContent);
                        break;

                    case 'BR':
                        chapter.addLineBreak();
                        break;

                    case 'IMG':
                        chapter.addImage(node.getAttribute('file'));
                        break;

                    default:
                        console.log(`unhandled tag: $<${node.tagName}>`);
                        console.log(node.innerHTML);
                        throw '';
                }
                break;

            default:
                console.log(`unhandled nodeType: $<${node.nodeType}>`);
                throw '';
        }
    }
}

class LightNovelParser extends Parser {
    match(url) {
        return URL.parse(url).hostname === 'www.lightnovel.cn';
    }

    parseNovelInfo(novel, lines) {
        let inTerms = false;
        const terms = [];
        for (const line of lines) {
            if (/^(─+)|(\-+)$/.test(line)) {
                inTerms = !inTerms;
            } else if (inTerms) {
                terms.push(line);
            } else {

            }
        }
    }

    parseChapter(context, node, index) {
        const novel = context.novel;
        const chapter = new Chapter();
        node.childNodes.forEach(z => {
            this.onNode(context, chapter, z);
        });
        if (index === 0) {
            const first = chapter.contents.find(z => z instanceof model.TextElement);
            if (first) {
                novel.title = first.content;
            }
            const rawTexts = chapter.contents.map(z => {
                if (z instanceof model.TextElement) {
                    return z.content;
                } else if (z instanceof model.LineBreak) {
                    return '\n';
                }
            }).filter(z => z !== undefined);
            if (rawTexts) {
                this.parseNovelInfo(novel, rawTexts.slice(1));
            }
        }  {
            if (chapter.textLength > 100) {
                novel.add(chapter);
            }
        }
    }

    parse(context) {
        const posters = Array.from(context.window.document.querySelectorAll('#postlist .pct .t_f'));
        posters.forEach(z => {
            ['style', 'script', '.pstatus', '.quote'].forEach(x => {
                z.querySelectorAll(x).forEach(c => c.remove());
            });
        });
        context.novel = new Novel();
        posters.forEach((z, i) => {
            this.parseChapter(context, z, i);
        });
    }
}

const parsers = [
    new LightNovelParser()
];


module.exports = {
    parsers
}
