'use strict';

const assert = require('assert');
const { MessageError } = require('../err');

function toRangeNumbers(text) {
    if (/^\d+?$/.test(text)) {
        return [1, Number(text)];
    }

    const match2 = text.match(/^(\d+)-(\d+)?$/);
    if (!match2 || (match2[1] || match2[2]) === undefined) {
        throw new MessageError(`${text} is invalid range args. try input like '1-15'`);
    }
    assert.strictEqual(match2.length, 3);
    const min = match2[1] ? Number(match2[1]) : null;
    const max = match2[2] ? Number(match2[2]) : null;
    return [min, max];
}

class Range {
    constructor() {
        let min = null;
        let max = null;
        if (arguments.length === 1) {
            const source = arguments[0];
            assert.strictEqual(typeof source, 'string');
            [min, max] = toRangeNumbers(source);
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
