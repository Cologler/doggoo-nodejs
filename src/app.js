'use strict';

const { ioc } = require('@adonisjs/fold');

const build = 38;
const buildtime = new Date(1535167969584);

ioc.singleton('app-info', () => {
    return {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
});
