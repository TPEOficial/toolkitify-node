/// <reference types="jest" />

import { RateLimiter, createRateLimit } from "../src/modules/rate-limit";

describe("RateLimiter - memory", () => {
    let limiter: RateLimiter;

    beforeEach(() => {
        limiter = new RateLimiter({ logs: false });
    });

    test("allows under the limit", async () => {
        const key = "user1";
        const limit = 3;
        const interval = 1000; // 1s
        for (let i = 1; i <= limit; i++) {
            const res = await limiter.check({ limit, interval, key, storage: "memory" });
            expect(res.success).toBe(true);
            expect(res.remaining).toBe(limit - i);
        }
    });

    test("blocks over the limit", async () => {
        const key = "user2";
        const limit = 2;
        const interval = 500; // 0.5s

        await limiter.check({ limit, interval, key, storage: "memory" });
        await limiter.check({ limit, interval, key, storage: "memory" });
        const res = await limiter.check({ limit, interval, key, storage: "memory" });
        expect(res.success).toBe(false);
        expect(res.remaining).toBe(0);
    });

    test("resets after interval", async () => {
        const key = "user3";
        const limit = 1;
        const interval = 100; // 100ms

        await limiter.check({ limit, interval, key, storage: "memory" });
        await new Promise(r => setTimeout(r, 120));
        const res = await limiter.check({ limit, interval, key, storage: "memory" });
        expect(res.success).toBe(true);
    });
});

describe("createRateLimit factory", () => {
    test("limits by value", async () => {
        const limiterFunc = createRateLimit(2, "1s", "userId");
        const val = "USER123";

        const r1 = await limiterFunc.limit(val);
        expect(r1.success).toBe(true);

        const r2 = await limiterFunc.limit(val);
        expect(r2.success).toBe(true);

        const r3 = await limiterFunc.limit(val);
        expect(r3.success).toBe(false);
    });

    test("resets automatically", async () => {
        const limiterFunc = createRateLimit(2, 100, "userId");
        const val = "USER456";

        await limiterFunc.limit(val);
        await limiterFunc.limit(val);
        await new Promise(r => setTimeout(r, 120));
        const r = await limiterFunc.limit(val);
        expect(r.success).toBe(true);
    });
});