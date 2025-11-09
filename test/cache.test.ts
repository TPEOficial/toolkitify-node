/// <reference types="jest" />

import { Cache, GlobalCache } from "../src/modules/cache";

describe("Cache", () => {
    let cache: Cache;

    beforeEach(() => {
        cache = new Cache({ ttl: 1000, maxUses: 3, storage: "memory", logs: "usage" });
        cache.clearAll();
    });

    test("set and get value", () => {
        cache.set("key1", "value1");
        expect(cache.get("key1")).toBe("value1");
    });

    test("returns null for missing key", () => {
        expect(cache.get("missing")).toBeNull();
    });

    test("respects ttl expiration", async () => {
        cache.set("key2", "value2", { ttl: 50 });
        expect(cache.get("key2")).toBe("value2");
        await new Promise(r => setTimeout(r, 60));
        expect(cache.get("key2")).toBeNull();
    });

    test("respects maxUses", () => {
        cache.set("key3", "value3", { maxUses: 2 });
        expect(cache.get("key3")).toBe("value3");
        expect(cache.get("key3")).toBe("value3");
        expect(cache.get("key3")).toBeNull();
    });

    test("reset removes key", () => {
        cache.set("key4", "value4");
        expect(cache.get("key4")).toBe("value4");
        cache.reset("key4");
        expect(cache.get("key4")).toBeNull();
    });

    test("getAll returns all items", () => {
        cache.set("a", 1);
        cache.set("b", 2);
        const all = cache.getAll();
        expect(all).toHaveProperty("a");
        expect(all).toHaveProperty("b");
        expect(all["a"].value).toBe(1);
        expect(all["b"].value).toBe(2);
    });

    test("clearAll removes all items", () => {
        cache.set("a", 1);
        cache.set("b", 2);
        cache.clearAll();
        expect(cache.getAll()).toEqual({});
    });

    test("GlobalCache works as singleton", () => {
        GlobalCache.set("singleton", "yes");
        expect(GlobalCache.get("singleton")).toBe("yes");
    });
});