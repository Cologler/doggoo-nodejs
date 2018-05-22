'use strict';

const URL = require('url');

function getAbsoluteUrl(baseUrlString, url) {
    if (/^https?:\/\//.test(url)) {
        return url;
    }

    const baseUrl = new URL.URL(baseUrlString);
    baseUrl.pathname = url;
    return baseUrl.toString();
}

module.exports = {
    getAbsoluteUrl
};
