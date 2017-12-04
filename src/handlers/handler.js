'use strict';

class HandlerBase {
    constructor() {
        this._options = [];
        this._flags = [];
        Object.defineProperties(this, {
            options: { get: () => this._options },
            flags: { get: () => this._flags }
        });
    }

    async handle(context) {
        throw new Error();
    }
}

module.exports = {
    HandlerBase
};
