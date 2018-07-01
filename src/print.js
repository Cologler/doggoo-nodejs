'use strict';

const util = require('util');

const { ioc } = require('@adonisjs/fold');
const clc = require('cli-color');

const ErrorStyle = clc.red.bold;
const WarnStyle = clc.yellow;
const InfoStyle = clc.green;
const VarStyle = clc.blueBright;

function info(message, ...args) {
    args = args.map(z => VarStyle(z).toString());
    message = util.format(message, ...args);
    console.info(InfoStyle('[INFO]') + ` ${message}`);
}

function error(message, ...args) {
    args = args.map(z => VarStyle(z).toString());
    message = util.format(message, ...args);
    console.error(ErrorStyle('[ERROR]') + ` ${message}`);
    process.exit(1);
}

function warn(message, ...args) {
    args = args.map(z => VarStyle(z).toString());
    message = util.format(message, ...args);
    console.warn(WarnStyle('[WARN]') + ` ${message}`);
}

ioc.bind('info', () => info);
ioc.bind('error', () => error);
ioc.bind('warn', () => warn);

module.exports = {
    info, error,
};
