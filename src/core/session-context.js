'use strict';

const { ioc } = require('@adonisjs/fold');

const { Novel } = require('../models/novel');

class SessionContext {
    constructor() {
        const options = ioc.use('options');
        Object.defineProperties(this, {
            _middlewares: {
                value: []
            },
            env: {
                value: {}
            },
            novel: {
                value: new Novel()
            },
            appopt: {
                value: options
            }
        });
    }

    get novel() {
        return this._novel;
    }

    addMiddleware(middleware) {
        this._middlewares.push(middleware);
    }

    async run() {
        for (const middleware of this._middlewares) {
            await middleware.run(this);
        }
    }
}

module.exports = SessionContext;
