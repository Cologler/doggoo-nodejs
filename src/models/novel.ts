import { Chapter } from "./sections";

export class Novel {
    private _chapters: Array<Chapter> = [];
    public title: string | null = null;
    public author: string | null = null;
    public summary: string | null = null;

    get titleOrDefault() {
        return this.title || 'novel';
    }

    add(chapter: Chapter) {
        this._chapters.push(chapter);
    }

    get chapters() {
        return this._chapters;
    }

    filterChapters(func: (value: Chapter, index: number, array: Chapter[]) => value is Chapter) {
        this._chapters = this._chapters.filter(func);
    }
}
