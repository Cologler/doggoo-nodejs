'use strict';

const PATH = require('path');
const fs = require('fs');
var bhttp = require("bhttp");
const { ImageElement } = require('./model');

class Preproccesser {
    constructor() {
        this._promises = [];
    }

    prepare(context) {
        let index = 0;
        for (const chapter of context.novel.chapters) {
            const images = chapter.contents.filter(z => z instanceof ImageElement);
            if (images) {
                const dir = 'asserts';
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
                for (const img of images) {
                    this.onImage(dir, index, img);
                    index++;
                }
            }
        }
        console.log(`[INFO] begin download ${index} images.`);
    }

    async onImage(root, index, img) {
        const url = img.url;
        const filename = `image-${index}${PATH.extname(url)}`;
        const path = PATH.join(root, filename);

        const promise = bhttp.get(url, {
            steam: true,
            responseTimeout: 5000
        });
        this._promises.push(promise);
        const response = await promise;
        fs.writeFileSync(path, response.body, {
            encoding: 'binary',
            flag: 'w'
        });
        img.path = path;
        img.filename = filename;
    }

    async waitAll() {
        return Promise.all(this._promises);
    }
}

async function prepareNovel(context) {
    const per = new Preproccesser();
    per.prepare(context);
    await per.waitAll();
    console.log(`[INFO] download images completed.`);
}

module.exports = {
    prepareNovel
}
