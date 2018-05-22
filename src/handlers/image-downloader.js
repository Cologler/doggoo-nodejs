'use strict';

const PATH = require('path');
const fs = require('fs');

const { ioc } = require('@adonisjs/fold');
const bhttp = require("bhttp");

const { Image } = require('../models/elements');
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

    async run(context) {
        await Promise.all(this._promises);
        console.log(`[INFO] download ${this._promises.length} images finished.`);
    }

    /**
     *
     *
     * @param {Image} image
     * @memberof ImagesDownloader
     */
    addImage(image) {
        const dir = 'assets';
        if (this._promises.length === 0) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
        }
        const promise = this.onImage(dir, this._promises.length, image);
        this._promises.push(promise);
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
