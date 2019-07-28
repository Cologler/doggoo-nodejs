import { ioc } from "anyioc";
import { Logger } from './logger';

/**
 * get a value from nullable,
 * show message and exit if null.
 * @param value
 * @param message
 */
export function NotNull<T>(value: T | null, message: string): T {
    if (value === null) {
        return ioc.getRequired<Logger>(Logger).error<T>(message);
    }

    return value;
}
