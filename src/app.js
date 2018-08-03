'use strict';

const { ioc } = require('@adonisjs/fold');

const build = 35;
const buildtime = new Date(1533297538284);

ioc.singleton('app-info', () => {
    return {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
});
