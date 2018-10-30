import { ioc } from "anyioc";

import { IParser, DoggooFlowContext } from "../doggoo";
import { Chapter } from "../models/sections";
import { TextConverter } from "../components/text-converter";
import { AppOptions } from "../options";

export abstract class EasyParser implements IParser {
    abstract name: string;

    private _chapters: Array<Chapter> = [];
    private _textConverter: TextConverter;

    constructor() {
        this._textConverter = ioc.getRequired<TextConverter>(TextConverter);
    }

    createChapter() {
        let chapter = new Chapter();
        this._chapters.push(chapter);
        return chapter;
    }

    convertText(text: string): string {
        return this._textConverter.convert(text);
    }

    async invoke(context: DoggooFlowContext) {
        await this.parseChapters(context);
        await this.createBook(context);
    }

    abstract parseChapters(context: DoggooFlowContext): Promise<any>;

    async createBook(context: DoggooFlowContext) {
        const options = context.state.options;
        const novel = context.state.novel;

        this._chapters.filter(z => {
            return z.textLength > options.limitChars;
        }).forEach(z => {
            novel.add(z);
        });
    }
}