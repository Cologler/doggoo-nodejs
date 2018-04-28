'use strict';

const { docopt } = require('docopt');

const app = require('./app');

const doc = `
Generate e-book from website.

Usage:
    doggoo URL [options]
    doggoo -h | --help
    doggoo --version

Options:
    --format=<>         # Set the output format.
    --cookie=<>         # Set the cookie for network requests.
    --output=<>         # Set the output location.
    --range=<>          # Set range.
    --cc=<>             # Set the chinese converter.
    --cover-index=<>    # Set the cover index in all images.
    --no-images         # Do not download images.
`;

const options = docopt(doc, {
    argv: process.argv.slice(2),
    help: true,
    version: `${app.name} (build ${app.build})`,
    options_first: false,
    exit: true
});

class ApplicationOptions {
    get source() {
        return options['URL'];
    }

    get format() {
        return options['--format'];
    }

    get cookie() {
        return options['--cookie'];
    }

    get output() {
        return options['--output'];
    }

    get range() {
        return options['--range'];
    }

    get cc() {
        return options['--cc'];
    }

    get coverIndex() {
        return options['--cover-index'];
    }

    get noImages() {
        return this.hasFlag('--no-images');
    }

    hasFlag(name) {
        return options[name] === true;
    }
}

function appopt() {
    return new ApplicationOptions();
}

module.exports = {
    appopt
};
