'use strict';

const URL = require('url');
const model = require('./model');
const { Novel, Chapter } = model;
const request = require('async-request');
const jsdom = require('jsdom');
const NodeVisitor = require('./core/node-visitor');

class Parser {

    get name() { throw Error('not impl.'); }

    match(url) { throw Error('not impl.'); }

    parse(session) { throw Error('not impl.'); }

    registerArgs(args) { }
}

class TiebaParser extends Parser {
    get name() {
        return 'Tieba';
    }

    match(source) {
        if (source === 'tieba') {
            return true;
        }
    }

    registerArgs(args) {
        args.registerArgName('--input');
    }
}

class LightNovelParser extends Parser {
    get name() {
        return 'LightNovel';
    }

    match(source) {
        let url = URL.parse(source);
        return url && url.hostname === 'www.lightnovel.cn';
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

    parseChapter(context, window, node, index) {
        const visitor = new NodeVisitor(context);
        const novel = context.novel;
        const chapter = new Chapter();
        node.childNodes.forEach(z => {
            visitor.visit(window, chapter, z);
        });

        if (index === 0) {
            this.parseNovelInfo(novel, chapter.textContents);
        }

        if (chapter.textLength > 100) {
            novel.add(chapter);
        }
    }

    async parse(context) {
        const body = (await request(context.url)).body;
        const dom = new jsdom.JSDOM(body);
        const window = dom.window;
        const posters = Array.from(window.document.querySelectorAll('#postlist .pct .t_f'));
        posters.forEach(z => {
            ['style', 'script', '.pstatus', '.quote'].forEach(x => {
                z.querySelectorAll(x).forEach(c => c.remove());
            });
        });
        context.novel = new Novel();
        posters.forEach((z, i) => {
            this.parseChapter(context, window, z, i);
        });
    }
}

const parsers = [
    new LightNovelParser(),
    new TiebaParser()
];


module.exports = {
    parsers
}
