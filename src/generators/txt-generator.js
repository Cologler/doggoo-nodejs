'use strict';

const os = require('os');
const fs = require('fs');

const { ioc } = require('@adonisjs/fold');

const { Generator, NodeVisitor, StringBuilder } = require('./base');

class TextNodeVisitor extends NodeVisitor {
    constructor() {
        super();
        this._builder = new StringBuilder();
    }

    onLineBreak() {
        this._builder.appendLineBreak();
    }

    onTextElement(item) {
        this._builder.append(item.content);
    }

    onImageElement(item) {
        this._builder.append(`<image ${item.url}>`);
    }

    onLinkElement(item) {
        this._builder.append(item.url);
    }

    value() {
        return this._builder.value();
    }
}

class TxtGenerator extends Generator {
    constructor() {
        super();
    }

    generate(context) {
        const novel = context.novel;

        let text = context.getGenerateMessage('txt');
        text += os.EOL + os.EOL;
        text += novel.chapters.map(z => {
            return new TextNodeVisitor().visitChapter(z).value();
        }).join(os.EOL + os.EOL + os.EOL + os.EOL);
        const title = novel.titleOrDefault;

        const appinfo = ioc.use('app-info');
        const filename = `${title}.${appinfo.name}-${appinfo.build}.txt`;

        const path = filename;
        fs.writeFileSync(path, text, {
            encoding: 'utf8',
            flag: 'w'
        });
    }
}

module.exports = TxtGenerator;
