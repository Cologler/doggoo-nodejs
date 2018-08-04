'use strict';

const HtmlHelper = require('../utils/html-helper');


class Optimizer {
    constructor() {
        this._headerTypes = {}; // headerType map to level.
        this._headers = [];
    }

    invoke(context, next) {
        this.run(context.state.novel);
        return next();
    }

    run(novel) {
        this.prepareOptimize(novel);
        novel.chapters.forEach((chapter, i) => {
            this.optimizeChapter(chapter, i);
        });

        // print headers
        const headers = this._headers.map(header => {
            return '       ' + '  '.repeat(header.level) + header.title;
        }).join('\n');
        use('info')('resolved headers:\n%s', headers);
    }

    prepareOptimize(novel) {
        const headerTypes = new Set();

        for (const chapter of novel.chapters) {
            for (const item of chapter.contents) {
                if (item.tagName === 'P') {
                    const ht = HtmlHelper.get(item, 'HeaderType');
                    if (ht !== null) {
                        headerTypes.add(ht);
                    }
                    break;
                }
            }
        }

        let levelOffset = 0;
        for (const typeName of [
            'title', 'chapter', 'section', 'number'
        ]) {
            if (headerTypes.has(typeName)) {
                this._headerTypes[typeName] = levelOffset++;
            }
        }
    }

    optimizeChapter(chapter, chapterIndex) {
        for (const item of chapter.contents) {
            if (item.tagName === 'P') {
                let hl = 1;
                const ht = HtmlHelper.get(item, 'HeaderType');
                if (ht !== null) {
                    hl += this._headerTypes[ht];
                }
                if (hl > 6) {
                    hl = 6; // max header is h6.
                }
                HtmlHelper.set(item, 'HeaderLevel', hl);
                chapter.title = item.textContent;
                this._headers.push({
                    title: chapter.title,
                    level: hl,
                });
                break;
            }
        }
    }


}

module.exports = {
    Optimizer
};
