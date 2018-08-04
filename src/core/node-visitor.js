'use strict';

class ChapterContext {
    constructor(window, chapter) {
        Object.defineProperties(this, {
            window: { get: () => window },
            chapter: { get: () => chapter }
        });
    }

    createChildNode(node) {
        const context = new ChapterContext(this.window, this.chapter);
        Object.defineProperties(context, {
            node: { get: () => node },
        });
        return context;
    }
}

class NodeVisitor {
    constructor(context) {
        this._context = context;
        this._visitInnerTagNames = new Set();
        this._textConverter = use('text-converter');
    }

    addVisitInnerTagName(tagName) {
        this._visitInnerTagNames.add(tagName);
    }

    visit(context) {
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

    visitTextNode(context) {
        const t = this._textConverter.convert(context.node.textContent);
        switch (context.node.parentNode.tagName) {
            case 'A':
                context.chapter.addLink(context.node.parentNode.href, t);
                break;

            default:
                context.chapter.addText(t);
                break;
        }
    }

    ensureNoChild(el) {
        if (el.childNodes.length !== 0) {
            throw new Error('ensure no child.');
        }
    }

    visitElementNode(context) {
        if (this._visitInnerTagNames.has(context.node.tagName)) {
            this.visitInner(context);
            return;
        }

        switch (context.node.tagName) {
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
                this.ensureNoChild(context.node);
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
                context.chapter.addImage(context.node.src);
                break;

            default:
                throw Error(`unhandled node: <${context.node.tagName}>\n${context.node.innerHTML}`);
        }
    }

    visitInner(context) {
        context.node.childNodes.forEach(z => {
            this.visit(context.createChildNode(z));
        });
    }
}

module.exports = {
    ChapterContext,
    NodeVisitor
};
