import util from 'util';
import { ioc } from "anyioc";
import clc from 'cli-color';

const ErrorStyle = clc.red.bold;
const WarnStyle = clc.yellow;
const InfoStyle = clc.green;
const VarStyle = clc.blueBright;

function formatMessage(message: string, args: any[]): string {
    const styledArgs = args.map(z => VarStyle(z).toString());
    const styledMessage = util.format(message, ...styledArgs);
    return styledMessage;
}

export class Logger {
    info(message: string, ...args: any[]) {
        const styledMessage = formatMessage(message, args);
        console.info(
            InfoStyle('[INFO]') + ` ${styledMessage}`
        );
    }

    warn(message: string, ...args: any[]) {
        const styledMessage = formatMessage(message, args);
        console.warn(
            WarnStyle('[WARN]') + ` ${styledMessage}`
        );
    }

    /**
     * print error message also direct exit process (exit code: 1).
     *
     * @param {string} message
     * @param {...any[]} args
     * @memberof Logger
     */
    error<T>(message: string, ...args: any[]): T {
        const styledMessage = formatMessage(message, args);
        console.error(
            ErrorStyle('[ERROR]') + ` ${styledMessage}`
        );
        process.exit(1);
        throw new Error('process already exits.');
    }
}

ioc.registerSingleton(Logger, () => new Logger());
