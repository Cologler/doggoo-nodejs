'use strict';

import { ioc } from "anyioc";

import { AppInfo } from "./doggoo";

const build = 55;
const buildtime = new Date(1562822197364);

ioc.registerSingleton('app-info', () => {
    const info: AppInfo = {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
    return info;
});
