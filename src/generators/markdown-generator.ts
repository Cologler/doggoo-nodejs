const fs = require('fs');

import { ioc } from "anyioc";

import { DoggooFlowContext } from '../doggoo';
import { Novel } from '../models/novel';
import { Generator, NodeVisitor, StringBuilder } from './base'
import { Elements } from "../models/elements";

class MarkdownNodeVisitor extends NodeVisitor {
    private _builder: StringBuilder = new StringBuilder();

    constructor() {
        super();
        this._builder = new StringBuilder();
    }

    onLineBreak() {
        this._builder.appendLineBreak().appendLineBreak();
    }

    onLink(link: Elements.Link) {
        const title = link.Title;
        const url = link.Url;
        this._builder.append(`[${title}](${url})`).appendLineBreak();
    }

    onText(node: Elements.Text) {
        this._builder.append(node.Content).appendLineBreak();
    }

    onImage(item: Elements.Image) {
        const url = item.Uri;
        this._builder.append(`![](${url})`).appendLineBreak();
    }

    onLineStart(line: Elements.Line) {
        const hl = line.HeaderLevel;
        if (hl !== null) {
            const text = '#'.repeat(hl) + ' ';
            this._builder.append(text);
        }
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
