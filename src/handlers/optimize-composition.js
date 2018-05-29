'use strict';

const { HtmlHelper } = require('../utils/html-helper');

class Optimizer {
    async run(context) {
        const novel = context.novel;
        novel.chapters.forEach((chapter, i) => {
            this.optimizeChapter(chapter, i);
        });
    }

    optimizeChapter(chapter, chapterIndex) {
        for (const item of chapter.contents) {
            if (item.tagName === 'P') {
                const helper = new HtmlHelper(item);
                helper.headerLevel = chapterIndex === 0 ? 1 : 2;
                return;
            }
        }
    }
}

module.exports = {
    Optimizer
};
