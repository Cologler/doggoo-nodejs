'use strict';

const fs = require('fs');

const srcPath = 'src\\app.js';

const script = fs.readFileSync(srcPath, 'utf-8');
let newScript = script;

// build
const buildMatch = script.match(/(const build = (\d+);)/i);
let build = Number(buildMatch[2]);
build ++;
const newBuildLine = `const build = ${build};`;
newScript = newScript.replace(buildMatch[1], newBuildLine);

// build time
const buildTimeMatch = script.match(/(const buildtime = new Date\(\d+\);)/i);
const newBuildTime = new Date().getTime();
const newBuildTimeLine =`const buildtime = new Date(${newBuildTime});` ;
newScript = newScript.replace(buildTimeMatch[1], newBuildTimeLine);

fs.writeFileSync(srcPath, newScript, 'utf-8');
