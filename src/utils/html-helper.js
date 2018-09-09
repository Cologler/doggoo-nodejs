'use strict';

const store = new WeakMap();

const HtmlHelper = {
    get: function(node, propName, def = null) {
        propName = propName.toLowerCase();
        const options = store.get(node);
        return options && options[propName] || def;
    },

    set: function(node, propName, value) {
        propName = propName.toLowerCase();
        const options = store.get(node) || {};
        options[propName] = value;
    },
};

module.exports = HtmlHelper;
