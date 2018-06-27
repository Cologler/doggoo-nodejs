'use strict';

const { ioc } = require('@adonisjs/fold');

class Section {
    constructor() {
        /** @type {HTMLElement[]} */
        this._contents = [];

        /** @type {ElementFactory} */
        this._factory = ioc.use('element-factory');
    }

    addText(text) {
        text = text.trim();
        if (!text) {
            // ignore empty text.
            return;
        }

        let last = this._contents[this._contents.length - 1];
        if (last && last.tagName === 'P') {
            last.textContent += text;
        } else {
            this._contents.push(
                last = this._factory.createText(text)
            );
        }
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

    addImage(url) {
        const node = this._factory.createImage(url);
        this._contents.push(node);
        return node;
    }

    addLink(url, title) {
        const node = this._factory.createLink(title, url);

        const last = this._contents[this._contents.length - 1];
        if (last && last.tagName === 'P') {
            last.appendChild(node);
        } else {
            this._contents.push(
                node
            );
        }

        return node;
    }

    get contents() {
        return this._contents;
    }

    get textContents() {
        /** @type {string[]} */
        const ret = [];
        this.contents.forEach(z => {
            if (z.tagName === 'P') {
                if (ret.length === 0) {
                    ret.push(z.textContent);
                } else { // > 0
                    ret[ret.length - 1] += z.textContent;
                }
            } else if (z.tagName === 'BR') {
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

class Chapter extends Section {
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

module.exports = {
    Chapter
};
