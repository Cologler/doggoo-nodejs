'use strict';
/**
 * print message without stack.
 *
 * @class MessageError
 * @extends {Error}
 */
class MessageError extends Error {

}

function exit(msg, code = 1) {
    console.error(`[ERROR] ${msg}`);
    process.exit(code);
}

module.exports = {
    MessageError,
    exit
};
