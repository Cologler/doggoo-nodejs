import { strictEqual } from "assert";
import { getAttr, setAttr, AttrSymbols } from './attrs';

describe('attrs.ts', function() {
    it('should has default value null', function() {
        const obj = {};
        strictEqual(getAttr(obj, 1), null);
    });

    it('should has default value argument', function() {
        const obj = {};
        strictEqual(getAttr(obj, 2, 4), 4);
    });

    it('should can set and get value', function() {
        const obj = {};
        setAttr(obj, 3, 2);
        strictEqual(getAttr(obj, 3), 2);
    });
});
