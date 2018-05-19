'use strict';

const assert = require('assert');
const { MessageError } = require('../err');

class Range {
    constructor() {
        let min = null;
        let max = null;
        if (arguments.length === 1) {
            const source = arguments[0];
            assert.strictEqual(typeof source, 'string');
            const match = source.match(/^(\d+)-(\d+)?$/);
            if (!match || (match[1] || match[2]) === undefined) {
                throw new MessageError(`${source} is invalid range args. try input like '1-15'`);
            }
            assert.strictEqual(match.length, 3);
            min = match[1] ? Number(match[1]) : null;
            max = match[2] ? Number(match[2]) : null;
        } else if (arguments.length === 2) {
            min = arguments[0];
            max = arguments[1];
            assert.strictEqual(typeof min, 'number');
            assert.strictEqual(typeof min, 'number');
        }
        this._min = min;
        this._max = max;
    }

    in(value) {
        if (typeof this._min === 'number') {
            if (value < this._min) {
                return false;
            }
        }
        if (typeof this._max === 'number') {
            if (value > this._max) {
                return false;
            }
        }
        return true;
    }

    toString() {
        if (typeof this._min === 'number') {
            if (typeof this._max === 'number') {
                return `[${this._min}, ${this._max}]`;
            } else {
                return `[${this._min}...]`;
            }
        } else if (typeof this._max === 'number') {
            return `[...${this._max}]`;
        } else {
            return `[None]`;
        }
    }
}

module.exports = {
    Range
}
