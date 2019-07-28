import { strictEqual, ok } from "assert";
import { matchUrl, LightNovelUrl } from './lightnovel';

describe('lightnovel.ts', function() {
    describe('match', function() {
        it('url: www.lightnovel.cn', function() {
            ok(matchUrl('https://www.lightnovel.cn/thread-986212-1-1.html'));
        });

        it('url: www.lightnovel.us', function() {
            ok(matchUrl('https://www.lightnovel.us/thread-986212-1-1.html'));
        });

        it('url: lightnovel.cn', function() {
            ok(matchUrl('https://lightnovel.cn/thread-986212-1-1.html'));
        });

        it('url: lightnovel.us', function() {
            ok(matchUrl('https://lightnovel.us/thread-986212-1-1.html'));
        });
    })

    it('should can parse thread style urls', function() {
        const url = LightNovelUrl.parse('https://www.lightnovel.cn/thread-987986-1-1.html');
        strictEqual(
            url.changePageIndex(2), 'https://www.lightnovel.cn/thread-987986-2-1.html'
        );
    });
});
