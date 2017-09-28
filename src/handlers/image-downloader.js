'use strict';

const PATH = require('path');
const fs = require('fs');
const bhttp = require("bhttp");
const { ImageElement } = require('../model');
const { HandlerBatchBase } = require('./handler');

class ImagesDownloader extends HandlerBatchBase {
    _handle_core(context) {
        let index = 0;
        for (const chapter of context.novel.chapters) {
            const images = chapter.contents.filter(z => z instanceof ImageElement);
            if (images) {
                const dir = 'assets';
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
        const ext = PATH.extname(url) || '.jpg';
        const filename = `image-${index}${ext}`;
        const path = PATH.join(root, filename);

        const promise = bhttp.get(url, {
            steam: true,
            //responseTimeout: 5000
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
}

module.exports = ImagesDownloader;