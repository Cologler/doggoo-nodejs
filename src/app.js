'use strict';

const { ioc } = require('@adonisjs/fold');

const build = 37;
const buildtime = new Date(1533567863720);

ioc.singleton('app-info', () => {
    return {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
});
