
import { ioc } from 'anyioc';

import { Novel } from "../models/novel";
import { Chapter } from "../models/sections";
import { Logger } from '../utils/logger';
import { Elements } from '../models/elements';
import { HeaderTypes } from '../const';
import { ElementFactory } from '../models/factory';

type HeaderInfo = {
    title: string,
    level: number,
};

export class Optimizer {
    private _headerTypes: {
        [type: string]: number
    } = {}; // headerType map to level.
    private _headers: Array<HeaderInfo> = [];
    private _factory = ioc.getRequired<ElementFactory>(ElementFactory);

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
        const headerTypes = new Set<string>();

        for (const chapter of novel.chapters) {
            for (const item of chapter.Lines) {
                const ht = item.HeaderType;
                if (ht !== null) {
                    headerTypes.add(ht);
                }
            }
        }

        let levelOffset = 0;
        for (const typeName of HeaderTypes) {
            if (headerTypes.has(typeName)) {
                this._headerTypes[typeName] = levelOffset++;
            }
        }
    }

    optimizeChapter(chapter: Chapter, chapterIndex: number) {
        for (const line of chapter.Lines) {
            let hl: number = 1;
            const ht = line.HeaderType;
            if (ht !== null) {
                hl += this._headerTypes[ht];
            }
            if (hl > 6) {
                hl = 6; // max header is h6.
            }
            line.HeaderLevel = hl;
            chapter.title = line.TextContent;
            this._headers.push({
                title: chapter.title || '',
                level: hl,
            });
            break;
        }

        // ensure each line endswith a line break
        const newContents: Elements[] = [];
        for (const item of chapter.Contents) {
            if (!(item instanceof Elements.LineBreak)) {
                if (newContents[newContents.length - 1] instanceof Elements.Line) {
                    newContents.push(this._factory.createLineBreak());
                }
            }
            newContents.push(item);
        }
        if (newContents[newContents.length - 1] instanceof Elements.Line) {
            newContents.push(this._factory.createLineBreak());
        }
        chapter.Contents = newContents;
    }
}
