import fs from 'fs';
import path from 'path';

import { ioc } from "anyioc";
import { Middleware } from "anyflow";

import { AppOptions } from "../options";
import { InfoBuilder, IParser, DoggooFlowContext } from '../doggoo';
import { readText } from '../utils/text-reader';
import { EasyParser } from './base';

function match() {
    const options = ioc.getRequired<AppOptions>('options');
    const dirpath = options.source;
    if (!dirpath || !fs.existsSync(dirpath)) {
        return false;
    }
    let stats = fs.lstatSync(dirpath);
    if (!stats.isDirectory()) {
        return false;
    }
    options.source = path.resolve(dirpath);
    return true;
}

class DirectoryParser extends EasyParser {
    name: string = 'dir';

    async parseChapters(context: DoggooFlowContext): Promise<any> {
        const options = context.state.options;
        const dirpath = options.source;
        const items = await fs.promises.readdir(dirpath);
        items.sort();
        for (const name of items) {
            const filepath = path.join(dirpath, name);
            let stats = await fs.promises.lstat(filepath);
            if(stats.isFile()) {
                await this._readFile(name, filepath);
            }
        }
    }

    async _readFile(name: string, filepath: string) {
        let text = await readText(filepath);
        text = text.replace(/\r/g, '');
        const chapter = this.createChapter();

        chapter.addText(this.convertText(name));
        chapter.addLineBreak();

        for (const line of text.split(/\n/g)) {
            const t = this.convertText(line);
            const textNode = chapter.addText(t);
            if (textNode) {
                chapter.addLineBreak();
            }
        }
    }
}

export default {
    match,
    Parser: DirectoryParser
}
