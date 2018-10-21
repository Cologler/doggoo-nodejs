'use strict';

const PATH = require('path');
const fs = require('fs');
const { promisify } = require('util');
import { EventEmitter } from 'events';

import { ioc } from 'anyioc';
import * as request from 'request-promise-native';

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

export class ImagesDownloader {
    private _promises: Array<Promise<any>> = [];
    private _results: { [url: string]: FileInfo } = {};
    private _requireImages: boolean;
    private _logger: Logger;
    private _loggerCalls: Array<Function> = [];

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
        for (const logCall of this._loggerCalls) {
            logCall();
        }
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

        const body = await request.get(url, {
            encoding: null, // for buffer
            timeout: 30000
        });

        if (body.length === 0) {
            this._loggerCalls.push(() => {
                this._logger.warn('image size: 0, url: <%s>', url);
            });
        }

        await writeFileAsync(path, body, {
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
