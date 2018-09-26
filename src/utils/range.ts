'use strict';

const assert = require('assert');
import { ioc } from "anyioc";
import { Logger } from "./logger";

function InvalidRangeArgs<T>(text: string): T {
    return ioc.getRequired<Logger>(Logger).error<T>(
        `<%s> is invalid range args. try input like '1-15'`, text
    );
}

type OptionalNumber = number | null;

function toRangeNumbers(text: string): [OptionalNumber, OptionalNumber] {
    if (/^\d+?$/.test(text)) {
        return [1, Number(text)];
    }

    const match = text.match(/^(\d+)-(\d+)?$/);
    if (!match || (match[1] || match[2]) === undefined) {
        return InvalidRangeArgs(text);
    }
    assert.strictEqual(match.length, 3);
    const min = match[1] ? Number(match[1]) : null;
    const max = match[2] ? Number(match[2]) : null;
    return [min, max];
}

export class Range {
    private _min: OptionalNumber;
    private _max: OptionalNumber;

    constructor(..._: any[]) {
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

    in(value: number) {
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
