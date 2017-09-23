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
                const t = context.cc(node.textContent);
                chapter.addText(t);
                break;

            case window.Node.ELEMENT_NODE:
                switch (node.tagName) {
                    case 'FONT':
                    case 'STRONG':
                        node.childNodes.forEach(z => {
                            this.onNode(context, chapter, z);
                        });
                        break;

                    case 'A':
                        const t = context.cc(node.textContent);
                        chapter.addLink(node.href, t);
                        break;

                    case 'BR':
                        chapter.addLineBreak();
                        break;

                    case 'IMG':
                        chapter.addImage(node.getAttribute('file'));
                        break;

                    default:
                        throw Error(`unhandled node: $<${node.tagName}>\n${node.innerHTML}`);
                }
                break;

            default:
                throw Error(`unhandled NodeType: $<${node.nodeType}>`);
        }
    }
}

class LightNovelParser extends Parser {
    match(url) {
        return URL.parse(url).hostname === 'www.lightnovel.cn';
    }

    parseNovelInfo(novel, lines) {
        { // title
            if (lines.length > 0) {
                novel.title = lines[0];
            }
            lines = lines.slice(1);
        }

        {
            for (const line of lines) {
                if (/作者/.test(line)) {
                    const match = line.match(/作者[：:]?\s*(\W+)\s*$/);
                    if (match) {
                        novel.author = match[1];
                    }
                }
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
            this.parseNovelInfo(novel, chapter.textContents);
        }

        if (chapter.textLength > 100) {
            novel.add(chapter);
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
