const fs = require('fs');

import { ioc } from "anyioc";

import { DoggooFlowContext } from '../doggoo';
import { Novel } from '../models/novel';
const { getAttr, AttrSymbols } = require('../utils/attrs');
import { Generator, NodeVisitor, StringBuilder } from './base'

class MarkdownNodeVisitor extends NodeVisitor {
    private _builder: StringBuilder = new StringBuilder();

    constructor() {
        super();
        this._builder = new StringBuilder();
    }

    onLineBreak() {
        this._builder.appendLineBreak().appendLineBreak();
    }

    onTextElement(item: HTMLParagraphElement) {
        let text = item.textContent;
        if (text) {
            const hl = getAttr(item, AttrSymbols.HeaderLevel);
            if (hl !== null) {
                text = '#'.repeat(hl) + ' ' + text;
            }
            this._builder.append(text).appendLineBreak();
        }
    }

    onImageElement(item: HTMLImageElement) {
        const url = getAttr(item, AttrSymbols.RawUrl);
        this._builder.append(`![](${url})`).appendLineBreak();
    }

    onLinkElement(item: HTMLAnchorElement) {
        const title = item.textContent;
        const url = item.getAttribute('href');
        this._builder.append(`[${title}](${url})`).appendLineBreak();
    }

    value() {
        return this._builder.value();
    }
}

class MarkdownGenerator extends Generator {
    invoke(context: DoggooFlowContext) {
        return this.run(context.state.novel);
    }

    run(novel: Novel) {
        const w = novel.chapters.length.toString().length;
        novel.chapters.forEach((z, i) => {
            const text = new MarkdownNodeVisitor().visitChapter(z).value();
            const index = (i + 1).toLocaleString('en', {
                minimumIntegerDigits: w,
                useGrouping: false
            });
            const filename = `chapter-${index}.md`;
            const path = filename;
            fs.writeFileSync(path, text, {
                encoding: 'utf8',
                flag: 'w'
            });
        });
    }
}

ioc.registerSingleton('markdown-generator', () => new MarkdownGenerator());
