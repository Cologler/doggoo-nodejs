'use strict';

const HtmlHelper = {
    get: function(node, propName, def = null) {
        propName = propName.toLowerCase();
        return node.options && node.options[propName] || def;
    },

    set: function(node, propName, value) {
        propName = propName.toLowerCase();
        node.options = node.options || {};
        node.options[propName] = value;
    },
};

module.exports = HtmlHelper;
