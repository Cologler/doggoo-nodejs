import { HeaderTypes } from '../const';
export namespace Elements {
    interface IElement {
        readonly TextContentLength: number;
        readonly TextContent: string;
    }

    export class Text implements IElement {
        constructor(public Content: string = '') {

        }

        get TextContentLength() {
            return this.Content.length;
        }

        get TextContent() {
            return this.Content;
        }
    }

    export class Link implements IElement {
        public Url: string = '';
        public Title: string = '';

        get TextContentLength() {
            return this.Title.length;
        }

        get TextContent() {
            return this.Title;
        }
    }

    export type LineNodeType = Text | Link;

    export class Line implements IElement {
        public Nodes: Array<LineNodeType> = [];
        public HeaderType: HeaderTypes | null = null;
        public HeaderLevel: number | null = null;

        get TextContentLength() {
            return this.Nodes.reduce((prevValue, item) => prevValue + item.TextContentLength, 0);
        }

        get TextContent() {
            return this.Nodes.map(z => z.TextContent).join('');
        }
    }

    export class Image implements IElement {
        public Index: number | null = null;
        public Uri: string | null = null;

        get TextContentLength() {
            return 0;
        }

        get TextContent() {
            return '';
        }
    }

    export class LineBreak implements IElement {
        get TextContentLength() {
            return 0;
        }

        get TextContent() {
            return '';
        }
    }

    /**
     * Note for generate:
     *
     * <Line> node implicit endswith <LineBreak>, that mean:
     *
     * <Line1><Line2><LineBreak><Line3> generate:
     *   Line1\nLine2\nLine3\n
     *
     * <Line1><Line2><Line3><LineBreak> generate:
     *   Line1\nLine2\nLine3\n
    */

}

export type Elements = Elements.Line | Elements.Image | Elements.LineBreak;
