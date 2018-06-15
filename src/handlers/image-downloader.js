'use strict';

const PATH = require('path');
const fs = require('fs');

const { ioc } = require('@adonisjs/fold');
const bhttp = require("bhttp");

const { HandlerBase } = require('./handler');

const IMAGE_EXT = new Set([
    '.jpg', '.jpeg', '.png', '.bmp', '.gif'
]);

class ImagesDownloader extends HandlerBase {
    constructor() {
        super();
        this._promises = [];
        this._results = {}; // map as <url:object>

        this._requireImages = ioc.use('generator').requireImages === true;
        if (this._requireImages) {
            ioc.use('event-emitter').on('add-image', (sender, args) => {
                this.addImage(args.image);
            });
        }
    }

    async run(context) {
        console.log(`[INFO] downloading ${this._promises.length} images ...`);
        await Promise.all(this._promises);
        console.log(`[INFO] download images finished.`);
    }

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

    /**
     *
     *
     * @param {any} root
     * @param {any} index
     * @param {HTMLImageElement} img
     * @memberof ImagesDownloader
     */
    async onImage(root, index, img) {
        const url = img.getAttribute('raw-url');
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
            responseTimeout: 5000
        });

        let response;

        try {
            response = await promise;
        } catch (error) {
            if (error instanceof bhttp.ResponseTimeoutError) {
                console.error(`[ERROR] timeout when downloading image <${url}>.`);
                process.exit(1);
            }
        }

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
