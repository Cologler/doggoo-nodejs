'use strict';

const store = new WeakMap();

const HtmlHelper = {
    get: function(node, propName, def = null) {
        const options = store.get(node);
        return options && options[propName] || def;
    },

    set: function(node, propName, value) {
        let options = store.get(node);
        if (!options) {
            options = {};
            store.set(node, options);
        }
        options[propName] = value;
    },

    PROP_RAW_URL: Symbol('raw-url'),
    PROP_HEADER_TYPE: Symbol('header-type'),
    PROP_HEADER_LEVEL: Symbol('header-level'),
};

module.exports = HtmlHelper;
