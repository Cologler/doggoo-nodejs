'use strict';

class SessionContext {
    constructor(options) {
        Object.keys(options).map(k => {
            Object.defineProperty(this, k, {
                get: () => options[k]
            })
        });
    }
}

module.exports = {
    SessionContext
}
