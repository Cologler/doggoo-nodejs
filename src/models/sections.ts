'use strict';

import { ioc } from "anyioc";

import { ElementFactory } from "./factory";
import { Elements } from "./elements";

class Section {
    private _contents: Array<Elements> = [];
    private _factory: ElementFactory;

    constructor() {
        this._contents = [];
        this._factory = ioc.getRequired<ElementFactory>(ElementFactory);
    }

    private _getLastLine() {
        let last = this._contents[this._contents.length - 1];
        if (last instanceof Elements.Line) {
            return last;
        } else {
            const newOne = this._factory.createLine();
            this._contents.push(newOne);
            return newOne;
        }
    }

    addText(text: string) {
        text = text.trim();
        if (!text) {
            // ignore empty text.
            return;
        }

        const last = this._getLastLine();
        last.Nodes.push(this._factory.createText(text));
        return last;
    }

    addLineBreak() {
        if (this._contents.length === 0) {
            // ignore leading <br/>
            return;
        }

        const node = this._factory.createLineBreak();
        this._contents.push(node);
        return node;
    }

    addImage(url: string) {
        const node = this._factory.createImage(url);
        this._contents.push(node);
        return node;
    }

    addLink(url: string, title: string) {
        const node = this._factory.createLink(title, url);
        const last = this._getLastLine();
        last.Nodes.push(node);
        return node;
    }

    get contents() {
        return this._contents;
    }

    get textContents(): string[] {
        const ret: string[] = [];
        this.contents.forEach(z => {
            if (z instanceof Elements.Line) {
                if (ret.length === 0) {
                    ret.push(z.TextContent);
                } else { // > 0
                    ret[ret.length - 1] += z.TextContent;
                }
            } else if (z instanceof Elements.LineBreak) {
                if (ret.length > 0) {
                    ret.push('');
                }
            }
        });
        return ret.filter(z => z !== '');
    }

    get textLength() {
        return this.textContents
            .map(z => z.length)
            .reduce((x, y) => x + y, 0);
    }
}

export class Chapter extends Section {
    private _title: string | null = null;

    constructor() {
        super();
        this._title = null;
    }

    get title() {
        return this._title;
    }

    set title(value) {
        this._title = value;
    }
}

class Intro extends Section {
    constructor() {
        super();
    }
}

class ToC extends Section {
    constructor() {
        super();
    }
}
