'use strict';

import { ioc } from "anyioc";

import { AppInfo } from "./doggoo";

import buildInfo from './build.json';

const build = buildInfo.BuildNumber;
const buildtime = new Date(buildInfo.BuildTime);

ioc.registerSingleton('app-info', () => {
    const info: AppInfo = {
        name: 'doggoo',
        build: build.toString(),
        buildtime,
    };
    return info;
});
