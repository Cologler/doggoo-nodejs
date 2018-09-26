'use strict';

import { ioc } from "anyioc";

import { AppInfo } from "./doggoo";

const build = 47;
const buildtime = new Date(1537981615012);

ioc.registerSingleton('app-info', () => {
    const info: AppInfo = {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
    return info;
});
