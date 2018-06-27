'use strict';

const { ioc } = require('@adonisjs/fold');

const build = 26;
const buildtime = new Date(1530140382284);

ioc.singleton('app-info', () => {
    return {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
});
