'use strict';

const PATH = require('path');
const fs = require('fs');
const { promisify } = require('util');

const { ioc } = require('@adonisjs/fold');
const bhttp = require("bhttp");

const HtmlHelper = require('../utils/html-helper');

const writeFileAsync = promisify(fs.writeFile);

const IMAGE_EXT = new Set([
    '.jpg', '.jpeg', '.png', '.bmp', '.gif'
]);

class ImagesDownloader {
    constructor() {
        this._promises = [];
        this._results = {}; // map as <url:object>

        this._requireImages = ioc.use('generator').requireImages === true;
        if (this._requireImages) {
            ioc.use('event-emitter').on('add-image', (sender, args) => {
                this.addImage(args.image);
            });
        }
    }

    async invoke() {
        ioc.use('info')('downloading %s images ...', this._promises.length);
        await Promise.all(this._promises);
        ioc.use('info')(`download images finished.`);
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
        const url = HtmlHelper.get(img, HtmlHelper.PROP_RAW_URL);
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
            responseTimeout: 30000
        });

        let response;

        try {
            response = await promise;
        } catch (error) {
            if (error instanceof bhttp.ResponseTimeoutError) {
                ioc.use('error')('timeout when downloading image <%s>.', url);
            }
            throw error;
        }

        await writeFileAsync(path, response.body, {
            encoding: 'binary',
            flag: 'w'
        });
    }

    getFileInfo(url) {
        return this._results[url];
    }

    getAllFileInfos() {
        return this._results;
    }
}

ioc.singleton('image-downloader', () => {
    return new ImagesDownloader();
});
