import { DoggooFlowContext, AppInfo } from "../doggoo";
import { Novel } from "../models/novel";
'use strict';

const os = require('os');
const fs = require('fs');

const isInvalid = require('is-invalid-path');
import { ioc } from "anyioc";

const { getAttr, AttrSymbols } = require('../utils/attrs');
import { Generator, NodeVisitor, StringBuilder } from './base';

class TextNodeVisitor extends NodeVisitor {
    private _builder: StringBuilder = new StringBuilder();

    constructor() {
        super();
    }

    onLineBreak() {
        this._builder.appendLineBreak();
    }

    onTextElement(item: HTMLParagraphElement) {
        const text = item.textContent;
        if (text) {
            this._builder.append(text);
        }
    }

    onImageElement(item: HTMLImageElement) {
        const url = getAttr(item, AttrSymbols.RawUrl);
        this._builder.append(`<image ${url}>`);
    }

    onLinkElement(item: HTMLAnchorElement) {
        const href = item.getAttribute('href');
        if (href) {
            this._builder.append(href);
        }
    }

    value() {
        return this._builder.value();
    }
}

class TxtGenerator extends Generator {
    constructor() {
        super();
    }

    invoke(context: DoggooFlowContext) {
        return this.run(context.state.novel);
    }

    run(novel: Novel) {
        const infoBuilder: any = ioc.getRequired('infoBuilder');
        let text = infoBuilder.toString();

        text += os.EOL + os.EOL;
        text += novel.chapters.map(z => {
            return new TextNodeVisitor().visitChapter(z).value();
        }).join(os.EOL + os.EOL + os.EOL + os.EOL);

        let title = novel.titleOrDefault;
        if (title.length >= 30 || isInvalid(title)) {
            title = 'book';
        }
        const appinfo = ioc.getRequired<AppInfo>('app-info');
        const filename = `${title}.${appinfo.name}-${appinfo.build}.txt`;

        const path = filename;
        fs.writeFileSync(path, text, {
            encoding: 'utf8',
            flag: 'w'
        });
    }
}

ioc.registerSingleton('txt-generator', () => new TxtGenerator());
