'use strict';

const { ioc } = require('@adonisjs/fold');
const clc = require('cli-color');

const ErrorStyle = clc.red.bold;
const WarnStyle = clc.yellow;
const InfoStyle = clc.green;

function info(message) {
    console.info(InfoStyle('[INFO]') + ` ${message}`);
}

function error(message, exitCode = 1) {
    console.error(ErrorStyle('[ERROR]') + ` ${message}`);
    if (exitCode) {
        process.exit(exitCode);
    }
}

function warn(message) {
    console.warn(WarnStyle('[WARN]') + ` ${message}`);
}

ioc.bind('info', () => info);
ioc.bind('error', () => error);
ioc.bind('warn', () => warn);

module.exports = {
    info, error,
};
