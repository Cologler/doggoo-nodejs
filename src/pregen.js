'use strict';

const PATH = require('path');
const fs = require('fs');
var bhttp = require("bhttp");
const { ImageElement } = require('./model');

async function prepareNovel(context) {
    let index = 0;
    for (const chapter of context.novel.chapters) {
        const images = chapter.contents.filter(z => z instanceof ImageElement);
        if (images) {
            const dir = PATH.join(context.root, 'images');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            for (const img of images) {
                const url = img.url;
                const response = await bhttp.get(url, {
                    steam: true
                });
                const filename = index + PATH.extname(url);
                const path = PATH.join(dir, filename);
                fs.writeFileSync(path, response.body, {
                    encoding: 'binary',
                    flag: 'w'
                });
                img.path = PATH.join('.', 'images', filename);
                index++;
            }
        }
    }
}

module.exports = {
    prepareNovel
}
