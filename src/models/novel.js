'use strict';

class Novel {
    constructor() {
        this._title = null;
        /** @type {object[]} */
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

    filterChapters(func) {
        this._chapters = this._chapters.filter(func);
    }
}

module.exports = {
    Novel
};
