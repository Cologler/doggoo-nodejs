'use strict';

const { LineBreak, Text, Image, Link } = require('./elements');

class Section {
    constructor() {
        this._contents = [];
        this._textLength = 0;
        this._textIndex = 0;
    }

    addText(text) {
        text = text.trim();
        if (!text) {
            // ignore empty text.
            return;
        }
        this._textLength += text.length;
        const last = this._contents.length > 0 && this._contents[this._contents.length - 1];
        if (last && last instanceof Text) {
            last.appendText(text);
        } else {
            this._contents.push(new Text(text, {
                textIndex: this._textIndex,
                nodeIndex: this._contents.length
            }));
            this._textIndex ++;
        }
    }

    addLineBreak() {
        if (this._contents.length === 0) {
            // ignore leading <br/>
            return;
        }
        this._contents.push(new LineBreak({
            nodeIndex: this._contents.length
        }));
    }

    addImage(url) {
        this._contents.push(new Image(url, {
            nodeIndex: this._contents.length
        }));
    }

    addLink(url, title) {
        this._textLength += title.length;
        this._contents.push(new Link(title, url, {
            nodeIndex: this._contents.length
        }));
    }

    get contents() {
        return this._contents;
    }

    get textLength() {
        return this._textLength;
    }

    get textContents() {
        let ret = [];
        this._contents.forEach(z => {
            if (z instanceof Text) {
                if (ret.length === 0) {
                    ret.push(z.content);
                } else { // > 0
                    ret[ret.length - 1] += z.content;
                }
            } else if (z instanceof LineBreak) {
                if (ret.length > 0) {
                    ret.push('');
                }
            }
        });
        ret = ret.filter(z => z !== '');
        return ret;
    }
}

class Chapter extends Section {
    constructor() {
        super();
        this._title = '';
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

module.exports = {
    Chapter
}