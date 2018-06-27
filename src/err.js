'use strict';
/**
 * print message without stack.
 *
 * @class MessageError
 * @extends {Error}
 */
class MessageError extends Error {

}

function timeout(msg) {
    console.error(`[ERROR] ${msg}`);
    process.exit(1);
}

module.exports = {
    MessageError,
    timeout
};
