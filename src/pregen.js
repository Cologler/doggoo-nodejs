'use strict';

const PATH = require('path');
const fs = require('fs');
var bhttp = require("bhttp");
const { ImageElement } = require('./model');

async function prepareNovel(context) {
    let index = 0;
    const promises = [];
    for (const chapter of context.novel.chapters) {
        const images = chapter.contents.filter(z => z instanceof ImageElement);
        if (images) {
            const dir = PATH.join(context.root, 'images');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            for (const item of images) {
                const img = item;
                const url = img.url;
                const filename = index + PATH.extname(url);
                const path = PATH.join(dir, filename);
                index++;

                const promise = bhttp.get(url, {
                    steam: true
                });
                promises.push({
                    promise,
                    callback: response => {
                        fs.writeFileSync(path, response.body, {
                            encoding: 'binary',
                            flag: 'w'
                        });
                        img.path = PATH.join('images', filename);
                        index++;
                    }
                });
            }
        }
    }
    for (const p of promises) {
        const r = await p.promise;
        p.callback(r);
    }
}

module.exports = {
    prepareNovel
}
