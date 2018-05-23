'use strict';

const URL = require('url');

function getAbsoluteUrl(baseUrlString, url) {
    if (/^https?:\/\//.test(url)) {
        return url;
    }

    const baseUrl = new URL.URL(baseUrlString);
    baseUrl.pathname = '';
    baseUrl.search = '';
    if (url.startsWith('/')) {
        url = url.substr(1);
    }
    const ret = baseUrl.toString() + url;
    return ret;
}

module.exports = {
    getAbsoluteUrl
};
