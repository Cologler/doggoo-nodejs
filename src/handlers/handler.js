'use strict';

class HandlerBase {
    registerArgs(args) {
        // ignored
    }

    async handle(context) {
        throw new Error();
    }
}

module.exports = {
    HandlerBase
};
