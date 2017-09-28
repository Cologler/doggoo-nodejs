'use strict';

const { HandlerBase } = require('./handler');

class OutputGenerator extends HandlerBase {
    constructor(baseGenerator) {
        super();
        this._baseGenerator = baseGenerator;
    }

    async handle(context) {
        this._baseGenerator.generate(context);
     }
}

module.exports = OutputGenerator;
