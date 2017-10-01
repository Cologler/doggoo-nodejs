'use strict';

const { HandlerBase } = require('../handlers/handler');
const URL = require('url');
const { Chapter } = require('../models/sections');
const request = require('async-request');
const jsdom = require('jsdom');
const NodeVisitor = require('../core/node-visitor');

class LightNovelParser extends HandlerBase {
    get name() {
        return 'LightNovel';
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

    async handle(context) {
        await this.parse(context, null);
    }

    async parse(context, lastPromise) {
        const body = (await request(context.source)).body;
        if (lastPromise) {
            await lastPromise;
        }
        const dom = new jsdom.JSDOM(body);
        const window = dom.window;
        const posters = Array.from(window.document.querySelectorAll('#postlist .pct .t_f'));
        posters.forEach(z => {
            ['style', 'script', '.pstatus', '.quote'].forEach(x => {
                z.querySelectorAll(x).forEach(c => c.remove());
            });
        });
        posters.forEach((z, i) => {
            this.parseChapter(context, window, z, i);
        });
    }
}

function match(source) {
    let url = URL.parse(source);
    if (url && url.hostname === 'www.lightnovel.cn') {
        // example: `/thread-901251-1-1.html`
        return /^\/thread-\d+-1-1.html$/.test(url.pathname);
    }
    return false;
}

module.exports = {
    match,
    Parser: LightNovelParser
}
