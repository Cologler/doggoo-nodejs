'use strict';

class NodeVisitor {
    constructor(context) {
        this._context = context;
    }

    visit(window, chapter, node) {
        switch (node.nodeType) {
            case window.Node.TEXT_NODE:
                this.visitTextNode(window, chapter, node);
                break;

            case window.Node.ELEMENT_NODE:
                this.visitElementNode(window, chapter, node);
                break;

            default:
                throw Error(`unhandled NodeType: <${node.nodeType}>`);
        }
    }

    visitTextNode(window, chapter, node) {
        const t = this._context.cc(node.textContent);
        switch (node.parentNode.tagName) {
            default:
                chapter.addText(t);
                break;
        }
    }

    visitElementNode(window, chapter, node) {
        switch (node.tagName) {
            case 'DIV':
                this.visitInner(window, chapter, node);
                chapter.addLineBreak();
                break;

            case 'FONT':
            case 'STRONG':
                this.visitInner(window, chapter, node);
                break;

            case 'A':
                const t = this._context.cc(node.textContent);
                chapter.addLink(node.href, t);
                break;

            case 'BR':
                chapter.addLineBreak();
                break;

            case 'IMG':
                chapter.addImage(node.getAttribute('file'));
                break;

            default:
                throw Error(`unhandled node: <${node.tagName}>\n${node.innerHTML}`);
        }
    }

    visitInner(window, chapter, node) {
        node.childNodes.forEach(z => {
            this.visit(window, chapter, z);
        });
    }
}

module.exports = NodeVisitor;
