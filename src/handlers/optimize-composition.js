'use strict';

const HtmlHelper = require('../utils/html-helper');

class Optimizer {
    constructor() {
        this._headerTypes = {}; // headerType map to level.
    }

    async run(context) {
        const novel = context.novel;
        this.prepareOptimize(novel);
        novel.chapters.forEach((chapter, i) => {
            this.optimizeChapter(chapter, i);
        });
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
                break;
            }
        }
    }


}

module.exports = {
    Optimizer
};
