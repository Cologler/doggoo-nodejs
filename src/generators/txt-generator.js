'use strict';

const os = require('os');
const fs = require('fs');

const { ioc } = require('@adonisjs/fold');
const isInvalid = require('is-invalid-path');

const HtmlHelper = require('../utils/html-helper');
const { Generator, NodeVisitor, StringBuilder } = require('./base');

class TextNodeVisitor extends NodeVisitor {
    constructor() {
        super();
        this._builder = new StringBuilder();
    }

    onLineBreak() {
        this._builder.appendLineBreak();
    }

    /**
     *
     *
     * @param {HTMLParagraphElement} item
     * @memberof NodeVisitor
     */
    onTextElement(item) {
        this._builder.append(item.textContent);
    }

    /**
     *
     *
     * @param {HTMLImageElement} item
     * @memberof NodeVisitor
     */
    onImageElement(item) {
        const url = HtmlHelper.get(item, HtmlHelper.PROP_RAW_URL);
        this._builder.append(`<image ${url}>`);
    }

    /**
     *
     *
     * @param {HTMLAnchorElement} item
     * @memberof NodeVisitor
     */
    onLinkElement(item) {
        this._builder.append(item.getAttribute('href'));
    }

    value() {
        return this._builder.value();
    }
}

class TxtGenerator extends Generator {
    constructor() {
        super();
    }

    invoke(context) {
        return this.run(context.state.novel);
    }

    run(novel) {
        const infos = ioc.use('infos');
        infos.format = 'txt';
        let text = infos.toString();

        text += os.EOL + os.EOL;
        text += novel.chapters.map(z => {
            return new TextNodeVisitor().visitChapter(z).value();
        }).join(os.EOL + os.EOL + os.EOL + os.EOL);

        let title = novel.titleOrDefault;
        if (title.length >= 30 || isInvalid(title)) {
            title = 'book';
        }
        const appinfo = ioc.use('app-info');
        const filename = `${title}.${appinfo.name}-${appinfo.build}.txt`;

        const path = filename;
        fs.writeFileSync(path, text, {
            encoding: 'utf8',
            flag: 'w'
        });
    }
}

ioc.bind('txt-generator', () => new TxtGenerator());

module.exports = TxtGenerator;
