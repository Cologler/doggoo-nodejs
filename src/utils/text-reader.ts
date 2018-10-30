import fs from "fs";
import { promisify } from 'util';

import iconv from 'iconv-lite';

const detectFileAsync = promisify(require('chardet').detectFile);

export async function readText(filepath: string): Promise<string> {
    const encoding = await detectFileAsync(filepath);
    const buffer = Buffer.from(await fs.promises.readFile(filepath, {
        encoding: 'binary'
    }), 'binary');
    let text = iconv.decode(buffer, encoding);
    return text;
}