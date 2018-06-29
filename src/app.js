'use strict';

const { ioc } = require('@adonisjs/fold');

const build = 28;
const buildtime = new Date(1530154601918);

ioc.singleton('app-info', () => {
    return {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
});
