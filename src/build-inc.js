'use strict';

const fs = require('fs');
const path = require('path');

const srcPath = 'src\\app.js';

const script = fs.readFileSync(srcPath, 'utf-8');
const match = script.match(/(const build = (\d+);)/i);
let build = Number(match[2]);
build ++;
const line = `const build = ${build};`;
const newScript = script.replace(match[1], line);
fs.writeFileSync(srcPath, newScript, 'utf-8');
