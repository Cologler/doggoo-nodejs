import { strictEqual } from "assert";
import { LightNovelUrl } from './lightnovel';

describe('lightnovel.ts', function() {
    it('should can parse thread style urls', function() {
        const url = LightNovelUrl.parse('https://www.lightnovel.cn/thread-987986-1-1.html');
        strictEqual(
            url.changePageIndex(2), 'https://www.lightnovel.cn/thread-987986-2-1.html'
        );
    });
});
