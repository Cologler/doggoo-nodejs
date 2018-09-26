
import { ioc } from 'anyioc';

import { getAttr, setAttr, AttrSymbols } from '../utils/attrs';
import { Novel } from "../models/novel";
import { Chapter } from "../models/sections";
import { Logger } from '../utils/logger';

type HeaderInfo = {
    title: string,
    level: number,
};

export class Optimizer {
    private _headerTypes: {
        [type: string]: number
    } = {}; // headerType map to level.
    private _headers: Array<HeaderInfo> = [];

    invoke(context: any) {
        this.run(context.state.novel);
    }

    run(novel: Novel) {
        this.prepareOptimize(novel);
        novel.chapters.forEach((chapter, i) => {
            this.optimizeChapter(chapter, i);
        });

        // print headers
        const headers = this._headers.map(header => {
            return ' '.repeat(header.level * 2 + 7) + header.title;
        }).join('\n');
        ioc.getRequired<Logger>(Logger).info('resolved headers:\n%s', headers);
    }

    prepareOptimize(novel: Novel) {
        const headerTypes = new Set();

        for (const chapter of novel.chapters) {
            for (const item of chapter.contents) {
                if (item.tagName === 'P') {
                    const ht = getAttr(item, AttrSymbols.HeaderType);
                    if (ht !== null) {
                        headerTypes.add(ht);
                    }
                    break;
                }
            }
        }

        let levelOffset = 0;
        for (const typeName of [
            'title', 'chapter', 'section', 'number'
        ]) {
            if (headerTypes.has(typeName)) {
                this._headerTypes[typeName] = levelOffset++;
            }
        }
    }

    optimizeChapter(chapter: Chapter, chapterIndex: number) {
        for (const item of chapter.contents) {
            if (item.tagName === 'P') {
                let hl: number = 1;
                const ht = getAttr<string>(item, AttrSymbols.HeaderType);
                if (ht !== null) {
                    hl += this._headerTypes[ht];
                }
                if (hl > 6) {
                    hl = 6; // max header is h6.
                }
                setAttr(item, AttrSymbols.HeaderLevel, hl);
                chapter.title = item.textContent;
                this._headers.push({
                    title: chapter.title || '',
                    level: hl,
                });
                break;
            }
        }
    }
}
