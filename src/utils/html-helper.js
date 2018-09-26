'use strict';

const store = new WeakMap();

const HtmlHelper = {
    get: function(node, propName, def = null) {
        const options = store.get(node);
        return options && options[propName] || def;
    },

    set: function(node, propName, value) {
        const options = store.get(node) || {};
        options[propName] = value;
    },

    PROP_RAW_URL: Symbol('raw-url'),
    PROP_HEADER_TYPE: Symbol('header-type'),
    PROP_HEADER_LEVEL: Symbol('header-level'),
};

module.exports = HtmlHelper;
