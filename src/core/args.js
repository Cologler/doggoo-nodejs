'use strict';

class Args {
    constructor() {
        this._argsFlags = new Set();

        this._argsOptions = new Set();
        this._argsOptions.add('gen');
        this._argsOptions.add('cover');
        this._argsOptions.add('cc');
        this._argsOptions.add('output');
    }

    fromHandler(handler) {
        handler.options.forEach(z => this._argsOptions.add(z));
        handler.flags.forEach(z => this._argsFlags.add(z));
    }

    parseArgs(args) {
        const options = {};
        for (let i = 0; i < args.length; i++) {
            let key = args[i].toString();
            if (key.startsWith('--')) {
                key = key.substr(2);
                if (args.length === i + 1) {
                    throw Error(`Args ${key} has no value.`);
                }
                const value = args[i+1];
                if (!this._argsOptions.has(key)) {
                    throw Error(`Unknown options: ${key}`);
                }
                options[key] = value;
                i++;
            } else if (key.startsWith('-')) {
                key = key.substr(1);
                if (!this._argsFlags.has(key)) {
                    throw Error(`Unknown flags: ${key}`);
                }
                options[key] = true;
            } else {
                throw Error(`Unknown args: ${key}`);
            }
        }
        return options;
    }
}

module.exports = Args;
