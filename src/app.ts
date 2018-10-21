'use strict';

import { ioc } from "anyioc";

import { AppInfo } from "./doggoo";

const build = 51;
const buildtime = new Date(1540111622609);

ioc.registerSingleton('app-info', () => {
    const info: AppInfo = {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
    return info;
});
