'use strict';

const PATH = require('path');
const fs = require('fs');
const { promisify } = require('util');
import { EventEmitter } from 'events';

import { ioc } from 'anyioc';
const bhttp = require("bhttp");

import { IGenerator } from '../doggoo';
import { Logger } from '../utils/logger';
const { getAttr, AttrSymbols } = require('../utils/attrs');

const writeFileAsync = promisify(fs.writeFile);

const IMAGE_EXT = new Set([
    '.jpg', '.jpeg', '.png', '.bmp', '.gif'
]);

export type FileInfo = {
    filename: string,
    path: string,
}

class ImagesDownloader {
    private _promises: Array<Promise<any>> = [];
    private _results: { [url: string]: FileInfo } = {};
    private _requireImages: boolean;
    private _logger: Logger;

    constructor() {
        this._logger = ioc.getRequired<Logger>(Logger);
        this._requireImages = ioc.getRequired<IGenerator>('generator').requireImages;
        if (this._requireImages) {
            ioc.getRequired<EventEmitter>('event-emitter').on('add-image', (sender, args) => {
                this.addImage(args.image);
            });
        }
    }

    async invoke() {
        this._logger.info('downloading %s images ...', this._promises.length);
        await Promise.all(this._promises);
        this._logger.info(`download images finished.`);
    }

    addImage(image: HTMLImageElement) {
        const dir = 'assets';
        if (this._promises.length === 0) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
        }
        const promise = this.onImage(dir, this._promises.length, image);
        this._promises.push(promise);
    }

    async onImage(root: string, index: number, img: HTMLImageElement) {
        const url = getAttr(img, AttrSymbols.RawUrl);
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
                return this._logger.error('timeout when downloading image <%s>.', url);
            }
        }

        await writeFileAsync(path, response.body, {
            encoding: 'binary',
            flag: 'w'
        });
    }

    getFileInfo(url: string): FileInfo {
        return this._results[url];
    }

    getAllFileInfos() {
        return this._results;
    }
}

ioc.registerSingleton('image-downloader', () => {
    return new ImagesDownloader();
});
