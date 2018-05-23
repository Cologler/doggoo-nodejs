'use strict';

const { ioc } = require('@adonisjs/fold');

ioc.singleton('app-info', () => {
    return {
        name: 'doggoo',
        build: '14'
    };
});
