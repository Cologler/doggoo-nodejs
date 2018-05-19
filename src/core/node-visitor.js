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
    }

    absUrl(window, url) {
        if (!/^https?:\/\//.test(url)) {
            if (!url.startsWith('/')) {
                url = '/' + url;
            }
            url = `${window['raw-protocol']}//${window['raw-host']}${url}`;
        }
        return url;
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
        const t = this._context.cc(context.node.textContent);
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
            case 'STRONG':
            case 'STRIKE':
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
}
