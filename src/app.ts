'use strict';

import { ioc } from "anyioc";

import { AppInfo } from "./doggoo";

const build = 53;
const buildtime = new Date(1540890274437);

ioc.registerSingleton('app-info', () => {
    const info: AppInfo = {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
    return info;
});
