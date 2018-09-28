'use strict';

import { ioc } from "anyioc";

import { AppInfo } from "./doggoo";

const build = 49;
const buildtime = new Date(1538155709823);

ioc.registerSingleton('app-info', () => {
    const info: AppInfo = {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
    return info;
});
