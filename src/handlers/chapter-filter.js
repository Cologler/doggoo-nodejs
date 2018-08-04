'use strict';

const readline = require('readline');

const { ioc } = require('@adonisjs/fold');

const { Range } = require('../utils/range');

class Filter {
    invoke(context) {
        return this.run(context.state.novel);
    }

    async run(novel) {
        const options = ioc.use('options');

        const requireSummary = options.hasFlag('--enable-filter-summary');

        ioc.use('info')('begin filter ...');

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
            ioc.use('info')('current chapters:\n%s', chaptersDescInfo);

            console.log('       please input the id (split by `;`) that you want to remove (empty to exit):');

            /** @type {string} */
            let inputValue = await new Promise(resolve => {
                userInput.on('line', line => {
                    resolve(line);
                });
            });

            inputValue = inputValue.trim();
            if (inputValue === '' || inputValue.toLowerCase() === 'exit') {
                break;
            }

            const table = new Set();
            const ranges = [];
            inputValue.split(/;/g).forEach(item => {
                if (item.includes('-')) {
                    // range
                    ranges.push(new Range(item));
                } else {
                    table.add(item);
                }
            });

            novel.filterChapters((chapter, index) => {
                for (const range of ranges) {
                    if (range.in(index)) {
                        return false;
                    }
                }
                return !table.has(index.toString());
            });
        }

        userInput.close();
    }
}

module.exports = {
    Filter
};
