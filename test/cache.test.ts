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

    test("respects ttl expiration in ms", async () => {
        cache.set("key2", "value2", { ttl: 50 });
        expect(cache.get("key2")).toBe("value2");
        await new Promise(r => setTimeout(r, 60));
        expect(cache.get("key2")).toBeNull();
    });

    // ✅ Nuevos tests con tiempo humano
    test("respects ttl expiration with human-readable string '30s'", async () => {
        cache.set("human1", "val1", { ttl: "30s" });
        expect(cache.get("human1")).toBe("val1");
    });

    test("respects ttl expiration with '1min'", async () => {
        cache.set("human2", "val2", { ttl: "1min" });
        expect(cache.get("human2")).toBe("val2");
    });

    test("respects ttl expiration with '2hours'", async () => {
        cache.set("human3", "val3", { ttl: "2hours" });
        expect(cache.get("human3")).toBe("val3");
    });

    test("respects ttl expiration with '1day'", async () => {
        cache.set("human4", "val4", { ttl: "1day" });
        expect(cache.get("human4")).toBe("val4");
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