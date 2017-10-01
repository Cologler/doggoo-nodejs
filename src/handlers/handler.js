'use strict';

class HandlerBase {
    registerArgs(args) {
        // ignored
    }

    async handle(context) {
        throw new Error();
    }
}

class HandlerBatchBase {
    constructor() {
        this._promises = [];
    }

    handle(context) {
        this._handle_core(context);
        return Promise.all(this._promises);
    }

    _handle_core(context) { throw new Error(); }
}

module.exports = {
    HandlerBase,
    HandlerBatchBase
};
