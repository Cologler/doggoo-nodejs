'use strict';

class SectionElement {
    constructor(options) {
        options = Object.assign({}, options);
        Object.keys(options).map(k => {
            Object.defineProperty(this, k, {
                get: () => options[k]
            });
        });
    }
}

class LineBreak extends SectionElement { }

class Text extends SectionElement {
    constructor(content, options) {
        super(options);
        this._content = content;
    }

    appendText(text) {
        this._content += text;
    }

    get content() {
        return this._content;
    }
}

class Image extends SectionElement {
    constructor(url, options) {
        super(options);
        this._url = url;
    }

    get url() {
        return this._url;
    }
}

class Link extends SectionElement {
    constructor(title, url, options) {
        super(options);
        this._title = title;
        this._url = url;
    }

    get title() {
        return this._title;
    }

    get url() {
        return this._url;
    }
}

module.exports = {
    LineBreak,
    Text,
    Image,
    Link
}
