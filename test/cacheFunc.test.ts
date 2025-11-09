/// <reference types="jest" />

import { cacheFunction, GlobalCache } from "../src/modules/cache";

describe("cacheFunction", () => {
    beforeEach(() => {
        GlobalCache.clearAll();
    });

    test("caches the function result", () => {
        let runCount = 0;
        const fn = (x: number) => {
            runCount++;
            return x * 2;
        };

        const cachedFn = cacheFunction(fn, "50ms");

        expect(cachedFn(5)).toBe(10);
        expect(runCount).toBe(1);

        expect(cachedFn(5)).toBe(10);
        expect(runCount).toBe(1);

        expect(cachedFn(3)).toBe(6);
        expect(runCount).toBe(2);
    });

    test("expires cache after TTL", async () => {
        let runCount = 0;
        const fn = (x: number) => {
            runCount++;
            return x * 2;
        };

        const cachedFn = cacheFunction(fn, "30ms");

        expect(cachedFn(4)).toBe(8);
        expect(runCount).toBe(1);

        expect(cachedFn(4)).toBe(8);
        expect(runCount).toBe(1);

        await new Promise(r => setTimeout(r, 40));

        expect(cachedFn(4)).toBe(8);
        expect(runCount).toBe(2);
    });

    test("works with multiple arguments", () => {
        let runCount = 0;
        const fn = (a: number, b: number) => {
            runCount++;
            return a + b;
        };

        const cachedFn = cacheFunction(fn, "100ms");

        expect(cachedFn(1, 2)).toBe(3);
        expect(runCount).toBe(1);
        expect(cachedFn(1, 2)).toBe(3);
        expect(runCount).toBe(1);

        expect(cachedFn(2, 3)).toBe(5);
        expect(runCount).toBe(2);
    });
});