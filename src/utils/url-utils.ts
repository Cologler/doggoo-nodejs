'use strict';

import URL from 'url';

export function getAbsoluteUrl(baseUrlString: string, urlString: string) {
    if (/^https?:\/\//.test(urlString)) {
        return urlString;
    }

    const baseUrl = new URL.URL(baseUrlString);
    baseUrl.pathname = '';
    baseUrl.search = '';
    if (urlString.startsWith('/')) {
        urlString = urlString.substr(1);
    }
    const ret = baseUrl.toString() + urlString;
    return ret;
}
