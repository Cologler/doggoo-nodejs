'use strict';

class HtmlHelper {
    /**
     * Creates an instance of HtmlHelper.
     * @param {HTMLElement} node
     * @memberof HtmlHelper
     */
    constructor(node) {
        this._ptr = node;
    }

    get isHeader() {
        return this.headerLevel !== null;
    }

    get headerLevel() {
        return this._ptr.options && this._ptr.options['headerLevel'] || null;
    }

    set headerLevel(value) {
        this._ptr.options = this._ptr.options || {};
        this._ptr.options['headerLevel'] = value;
    }
}

module.exports = {
    HtmlHelper
};
