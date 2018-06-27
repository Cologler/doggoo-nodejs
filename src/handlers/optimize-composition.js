'use strict';

const HtmlHelper = require('../utils/html-helper');

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
                HtmlHelper.set(item, 'HeaderLevel', chapterIndex === 0 ? 1 : 2);
                chapter.title = item.textContent;
                return;
            }
        }
    }
}

module.exports = {
    Optimizer
};
