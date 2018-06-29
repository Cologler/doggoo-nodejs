'use strict';

const readline = require('readline');

const { ioc } = require('@adonisjs/fold');

class Filter {
    async run(context) {
        const options = ioc.use('options');
        const novel = context.novel;

        const requireSummary = options.hasFlag('--enable-filter-summary');

        ioc.use('info')('begin filter ...');

        const userInput = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        while (true) {
            console.log('current chapters:');

            // print examples
            novel.chapters.forEach((chapter, index) => {
                /** @type {string[]} */
                const texts = chapter.textContents;
                const header = `[${index}]`;
                if (texts.length === 0) {
                    console.log(`${header} <NO-TEXT>`);
                } else {
                    console.log(`${header} ${texts[0]}`);
                    if (requireSummary && texts.length > 1) {
                        const padding = ' '.repeat(header.length);
                        console.log(`${padding} ${texts[1]}`);
                    }
                }
            });

            console.log('please input the id (split by `;`) that you want to remove (empty to exit):');

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
            inputValue.split(/;/g).forEach(item => table.add(item));

            novel.filterChapters((chapter, index) => !table.has(index.toString()));
        }

        userInput.close();
    }
}

module.exports = {
    Filter
};
