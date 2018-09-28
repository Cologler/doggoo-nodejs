'use strict';

import os from 'os';

import { ioc } from "anyioc";

import { Chapter } from '../models/sections';
import { IGenerator, DoggooFlowContext } from '../doggoo';

/**
 * a simple stringbuilder.
 *
 * @class StringBuilder
 */
export class StringBuilder {
    private _doc: string[] = [];

    append(text: string) {
        this._doc.push(text);
        return this;
    }

    appendLineBreak() {
        this._doc.push(os.EOL);
        return this;
    }

    value() {
        return this._doc.join('');
    }
}

export abstract class NodeVisitor {
    visitChapter(chapter: Chapter) {
        chapter.contents.forEach(z => this.visitItem(z));
        return this;
    }

    /**
     *
     *
     * @param {HTMLElement} item
     * @returns
     * @memberof NodeVisitor
     */
    visitItem(item: HTMLElement) {
        switch (item.tagName) {
            case 'BR':
                return this.onLineBreak(<HTMLBRElement>item);
            case 'P':
                return this.onTextElement(<HTMLParagraphElement>item);
            case 'IMG':
                return this.onImageElement(<HTMLImageElement>item);
            case 'A':
                return this.onLinkElement(<HTMLAnchorElement>item);
            default:
                throw new Error(`Unhandled chapter content type <${item.tagName}>`);
        }
    }

    abstract onLineBreak(item: HTMLBRElement): void;
    abstract onTextElement(item: HTMLParagraphElement): void;
    abstract onImageElement(item: HTMLImageElement): void;
    abstract onLinkElement(item: HTMLAnchorElement): void;
}

export abstract class Generator implements IGenerator {
    get requireImages(): boolean {
        return false;
    }

    abstract invoke(context: DoggooFlowContext): void;
}

class NoneGenerator extends Generator {
    invoke() { }
}

ioc.registerSingleton('none-generator', () => new NoneGenerator());
