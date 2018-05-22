'use strict';

class Novel {
    constructor() {
        this._title = null;
        this._chapters = [];
    }

    get title() {
        return this._title;
    }

    set title(value) {
        this._title = value;
    }

    get titleOrDefault() {
        return this._title || 'novel';
    }

    add(chapter) {
        this._chapters.push(chapter);
    }

    get chapters() {
        return this._chapters;
    }
}

module.exports = {
    Novel
};
