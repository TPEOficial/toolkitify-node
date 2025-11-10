/// <reference types="jest" />

import { Cache, GlobalCache } from "../src/modules/cache";

describe("Cache system", () => {
    let cache: Cache;

    beforeEach(() => {
        cache = new Cache({ ttl: 200, maxUses: 5, storage: "memory", logs: "usage" });
        cache.clearAll();
    });

    test("stores and retrieves strings", () => {
        cache.set("user", "alice");
        expect(cache.get("user")).toBe("alice");
    });

    test("stores and retrieves numbers", () => {
        cache.set("age", 23);
        expect(cache.get("age")).toBe(23);
    });

    test("returns null when key does not exist", () => {
        expect(cache.get("unknown-key")).toBeNull();
    });

    test("expires item after ttl in milliseconds", async () => {
        cache.set("temp", "data", { ttl: 40 });
        expect(cache.get("temp")).toBe("data");
        await new Promise(r => setTimeout(r, 55));
        expect(cache.get("temp")).toBeNull();
    });

    test("maxUses removes after reaching limit", () => {
        cache.set("session", "token", { maxUses: 2 });
        expect(cache.get("session")).toBe("token");
        expect(cache.get("session")).toBe("token");
        expect(cache.get("session")).toBeNull();
    });

    test("reset deletes an existing key", () => {
        cache.set("toDelete", "x");
        expect(cache.get("toDelete")).toBe("x");
        cache.reset("toDelete");
        expect(cache.get("toDelete")).toBeNull();
    });

    test("getAll retrieves all stored items", () => {
        cache.set("one", 1);
        cache.set("two", 2);
        const values = cache.getAll();
        expect(values).toHaveProperty("one");
        expect(values).toHaveProperty("two");
    });

    test("clearAll removes every item", () => {
        cache.set("x", 100);
        cache.set("y", 200);
        cache.clearAll();
        expect(cache.getAll()).toEqual({});
    });

    test("singleton GlobalCache shares the same store", () => {
        GlobalCache.set("shared", "ok");
        expect(GlobalCache.get("shared")).toBe("ok");
    });

    // 🔔 Event listeners tests.
    test("fires set event", () => {
        let fired = false;
        cache.addEventListener("set", () => fired = true);
        cache.set("ev1", "hello");
        cache.get("ev1");
        expect(fired).toBe(true);
    });

    test("fires get event", () => {
        let calls = 0;
        cache.addEventListener("get", () => calls++);
        cache.set("ev2", "world");
        cache.get("ev2");
        cache.get("ev2");
        expect(calls).toBe(2);
    });

    test("fires expire event", async () => {
        let expired = false;
        cache.addEventListener("expire", () => expired = true);
        cache.set("ev3", "bye", { ttl: 30 });
        await new Promise(r => setTimeout(r, 45));
        cache.get("ev3");
        expect(expired).toBe(true);
    });

    test("fires delete event when maxUses reached", () => {
        let removed = false;
        cache.addEventListener("delete", () => removed = true);
        cache.set("ev4", "abc", { maxUses: 1 });
        cache.get("ev4");
        cache.get("ev4");
        expect(removed).toBe(true);
    });

    test("fires clear event", () => {
        let cleared = false;
        cache.addEventListener("clear", () => cleared = true);
        cache.set("ev5", 123);
        cache.clearAll();
        expect(cleared).toBe(true);
    });

    test("fires delete event on reset", () => {
        let deleted = false;
        cache.addEventListener("delete", () => deleted = true);
        cache.set("ev6", "ok");
        cache.reset("ev6");
        expect(deleted).toBe(true);
    });
});