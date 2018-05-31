'use strict';

const { ioc } = require('@adonisjs/fold');

const build = 17;

ioc.singleton('app-info', () => {
    return {
        name: 'doggoo',
        build: build.toString()
    };
});
