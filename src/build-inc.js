'use strict';

const { writeFileSync } = require('fs');
const buildInfo = require('./build.json');

buildInfo.BuildNumber++;
buildInfo.BuildTime = new Date().getTime();
const text = JSON.stringify(buildInfo, undefined, 4);
writeFileSync('src\\build.json', text, 'utf-8');
