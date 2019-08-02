'use strict';

import PATH from 'path';
import fs from 'fs';
import os from 'os';
import { EventEmitter } from 'events';

import { ioc } from 'anyioc';
import request from 'request-promise-native';
import { RequestError } from "request-promise-native/errors";

import { IGenerator } from '../doggoo';
import { Logger } from '../utils/logger';
import { Events } from '../const';
import { Elements } from '../models/elements';

const IMAGE_EXT = new Set([
    '.jpg', '.jpeg', '.png', '.bmp', '.gif'
]);

export type FileInfo = {
    filename: string,
    path: string,
}

const CacheDir = PATH.join(os.tmpdir(), 'doggoo-images');
if (!fs.existsSync(CacheDir)){
    fs.mkdirSync(CacheDir);
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
            ioc.getRequired<EventEmitter>('event-emitter').on(Events.addImage, (sender, args) => {
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

    addImage(image: Elements.Image) {
        const dir = 'assets';
        if (this._promises.length === 0) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
        }
        const promise = this.onImage(dir, this._promises.length, image);
        this._promises.push(promise);
    }

    async fetchBody(url: string): Promise<Buffer> {
        try {
            return await request.get(url, {
                encoding: null, // for buffer
                timeout: 30000
            });
        } catch (error) {
            if (error instanceof RequestError) {
                this._logger.error('cannot download image with url: <%s>, msg: <%s>', url, error.message);
            }
            throw error;
        }
    }

    async fetchToCache(url: string): Promise<string> {
        const fileName = url.replace(/[:/]/g, '#');
        const filePath = PATH.join(CacheDir, fileName);

        if (!fs.existsSync(filePath)) {
            const body = await this.fetchBody(url);
            if (body.length === 0) {
                this._loggerCalls.push(() => {
                    this._logger.warn('image size: 0, url: <%s>', url);
                });
            }
            // use sync write to avoid crash to write a bad file.
            fs.writeFileSync(filePath, body, {
                encoding: 'binary',
                flag: 'w'
            });
        }

        return filePath;
    }

    async onImage(root: string, index: number, img: Elements.Image) {
        const url = img.Uri;
        if (url === null) {
            return;
        }

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

        const cachedFilePath = await this.fetchToCache(url);
        await fs.promises.copyFile(cachedFilePath, path);
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
