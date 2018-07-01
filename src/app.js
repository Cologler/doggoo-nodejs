'use strict';

const { ioc } = require('@adonisjs/fold');

const build = 31;
const buildtime = new Date(1530430290843);

ioc.singleton('app-info', () => {
    return {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
});
