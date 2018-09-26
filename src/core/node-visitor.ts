
import { JSDOM, DOMWindow } from 'jsdom';
import { ioc } from 'anyioc';

import { Chapter } from "../models/sections";
import { TextConverter } from '../components/text-converter';

export class ChapterContext {
    constructor(private _window: DOMWindow, private _chapter: Chapter, private _node: Node) {

    }

    get window() {
        return this._window;
    }

    get chapter() {
        return this._chapter;
    }

    get node() {
        return this._node;
    }

    createChildNode(node: Node) {
        return new ChapterContext(this.window, this.chapter, node);
    }
}

export class NodeVisitor {
    private _visitInnerTagNames: Set<string> = new Set();
    private _textConverter: TextConverter;

    constructor() {
        this._textConverter = ioc.getRequired<TextConverter>(TextConverter);
    }

    addVisitInnerTagName(tagName: string) {
        this._visitInnerTagNames.add(tagName);
    }

    visit(context: ChapterContext) {
        const window = context.window;
        switch (context.node.nodeType) {
            case window.Node.TEXT_NODE:
                this.visitTextNode(context);
                break;

            case window.Node.ELEMENT_NODE:
                this.visitElementNode(context);
                break;

            default:
                throw Error(`unhandled NodeType: <${context.node.nodeType}>`);
        }
    }

    visitTextNode(context: ChapterContext) {
        const t = this._textConverter.convert(context.node.textContent || '');
        const parent = <HTMLElement>context.node.parentNode;
        switch (parent.tagName) {
            case 'A':
                context.chapter.addLink((<HTMLAnchorElement>parent).href, t);
                break;

            default:
                context.chapter.addText(t);
                break;
        }
    }

    ensureNoChild(el: HTMLElement) {
        if (el.childNodes.length !== 0) {
            throw new Error('ensure no child.');
        }
    }

    visitElementNode(context: ChapterContext) {
        const el = <HTMLElement> context.node;

        if (this._visitInnerTagNames.has(el.tagName)) {
            this.visitInner(context);
            return;
        }

        switch (el.tagName) {
            case 'DIV':
                this.visitInner(context);
                context.chapter.addLineBreak();
                break;

            case 'A':
                this.visitInner(context);
                break;

            case 'P':
            case 'FONT':
            case 'STRONG': // 粗体
            case 'STRIKE': // 文字删除线
            case 'I':
                this.visitInner(context);
                break;

            case 'HR': // 分割线
                this.ensureNoChild(el);
                break;

            case 'TABLE':
            case 'TBODY':
            case 'TR':
            case 'TD':
                this.visitInner(context);
                break;

            case 'BR':
                context.chapter.addLineBreak();
                break;

            case 'IMG':
                context.chapter.addImage((<HTMLImageElement> el).src);
                break;

            default:
                throw Error(`unhandled node: <${el.tagName}>\n${el.innerHTML}`);
        }
    }

    visitInner(context: ChapterContext) {
        context.node.childNodes.forEach(z => {
            this.visit(context.createChildNode(z));
        });
    }
}
