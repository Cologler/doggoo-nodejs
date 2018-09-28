'use strict';

import { ioc } from "anyioc";

import { AppInfo } from "./doggoo";

const build = 48;
const buildtime = new Date(1538001209484);

ioc.registerSingleton('app-info', () => {
    const info: AppInfo = {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
    return info;
});
