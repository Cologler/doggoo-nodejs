'use strict';

class Args {
    constructor() {
        this._argsName = new Set();
        this._argsName.add('--gen');
        this._argsName.add('--cover');
        this._argsName.add('--cc');
        this._argsName.add('--output');
    }

    registerArgName(name) {
        this._argsName.add(name);
    }

    parseArgs(args) {
        const options = {};
        for (let i = 0; i < args.length; i += 2) {
            const key = args[i];
            if (args.length === i + 1) {
                throw Error(`Args ${key} has no value.`);
            }
            const value = args[i+1];
            if (this._argsName.has(key)) {
                options[key] = value;
            } else {
                throw Error(`Unknown args ${key}`);
            }
        }
        return options;
    }
}

module.exports = Args;
