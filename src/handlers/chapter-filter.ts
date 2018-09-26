import readline from 'readline';

import { ioc } from 'anyioc';

import { Novel } from "../models/novel";
import { Logger } from "../utils/logger";
import { AppOptions } from "../options";

import { Range } from "../utils/range";

export class Filter {
    invoke(context: any) {
        return this.run(context.state.novel);
    }

    async run(novel: Novel) {
        const options = ioc.getRequired<AppOptions>(AppOptions);
        const logger = ioc.getRequired<Logger>(Logger);

        const requireSummary = options.hasFlag('--enable-filter-summary');
        logger.info('begin filter ...');

        const userInput = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        while (true) {
            // print examples
            const chaptersDescInfo =  novel.chapters.map((chapter, index) => {
                /** @type {string[]} */
                const texts = chapter.textContents;
                const header = `[${index}]`;
                if (texts.length === 0) {
                    return `${header} <NO-TEXT>`;
                } else {
                    return `${header} ${texts[0]}`;
                }
            }).map(z => ' '.repeat(7) + z).join('\n');
            logger.info('current chapters:\n%s', chaptersDescInfo);

            console.log('       please input the id (split by `;`) that you want to remove (empty to exit):');

            let inputValue = await new Promise<string>(resolve => {
                userInput.on('line', line => {
                    resolve(line);
                });
            });

            inputValue = inputValue.trim();
            if (inputValue === '' || inputValue.toLowerCase() === 'exit') {
                break;
            }

            const table = new Set();
            const ranges: Array<Range> = [];
            inputValue.split(/;/g).forEach(item => {
                if (item.includes('-')) {
                    // range
                    ranges.push(new Range(item));
                } else {
                    table.add(item);
                }
            });

            novel.filterChapters(<any>((_: any, index: number) => {
                for (const range of ranges) {
                    if (range.in(index)) {
                        return false;
                    }
                }
                return !table.has(index.toString());
            }));
        }

        userInput.close();
    }
}
