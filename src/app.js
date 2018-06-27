'use strict';

const { ioc } = require('@adonisjs/fold');

const build = 25;
const buildtime = new Date(1530081590157);

ioc.singleton('app-info', () => {
    return {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
});
