'use strict';

import os from 'os';

import { ioc } from "anyioc";

import { Chapter } from '../models/sections';
import { IGenerator, DoggooFlowContext } from '../doggoo';
import { Elements } from '../models/elements';

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
        chapter.Contents.forEach(z => this.visitItem(z));
        return this;
    }

    /**
     *
     *
     * @param {HTMLElement} item
     * @returns
     * @memberof NodeVisitor
     */
    visitItem(item: Elements) {
        if (item instanceof Elements.LineBreak) {
            return this.onLineBreak(item);
        }

        if (item instanceof Elements.Line) {
            return this.onLine(item);
        }

        if (item instanceof Elements.Image) {
            return this.onImage(item);
        }

        throw new Error(`Unhandled element types: ${item}`);
    }

    onLineStart(line: Elements.Line): void { }
    onLine(line: Elements.Line): void {
        this.onLineStart(line);
        for (const node of line.Nodes) {
            if (node instanceof Elements.Text) {
                this.onText(node);
            } else if (node instanceof Elements.Link) {
                this.onLink(node);
            }
        }
        this.onLineEnd(line);
    }
    onLineEnd(line: Elements.Line): void { }

    abstract onLink(link: Elements.Link): void;
    abstract onText(text: Elements.Text): void;
    abstract onImage(image: Elements.Image): void;
    abstract onLineBreak(lineBreak: Elements.LineBreak): void;
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
