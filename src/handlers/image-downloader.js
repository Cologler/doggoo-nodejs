'use strict';

const PATH = require('path');
const fs = require('fs');

const { ioc } = require('@adonisjs/fold');
const bhttp = require("bhttp");

const { ImageElement } = require('../model');
const { HandlerBase } = require('./handler');

const IMAGE_EXT = new Set([
    '.jpg', '.jpeg', '.png', '.bmp', '.gif'
]);

class ImagesDownloader extends HandlerBase {
    constructor() {
        super();
        this._promises = [];
        this._results = {}; // map as <url:object>
    }

    async handle(context) {
        this._handle_core(context);
        await Promise.all(this._promises);
        console.log(`[INFO] download images finished.`);
    }

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
                    const promise = this.onImage(dir, index, img);
                    this._promises.push(promise);
                    index++;
                }
            }
        }
        console.log(`[INFO] begin download ${index} images.`);
    }

    async onImage(root, index, img) {
        const url = img.url;
        let ext = (PATH.extname(url) || '.jpg').toLowerCase();
        if (!IMAGE_EXT.has(ext)) {
            ext = '.jpg';
        }
        const filename = `image-${index}${ext}`;
        const path = PATH.join(root, filename);

        this._results[url] = {
            filename,
            path,
        };

        const promise = bhttp.get(url, {
            steam: true,
            //responseTimeout: 5000
        });
        const response = await promise;
        fs.writeFileSync(path, response.body, {
            encoding: 'binary',
            flag: 'w'
        });
    }

    getFileInfo(url) {
        return this._results[url];
    }
}

ioc.singleton('image-downloader', () => {
    return new ImagesDownloader();
});
