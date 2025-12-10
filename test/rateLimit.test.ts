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

describe("RateLimiter - blockDuration", () => {
    let limiter: RateLimiter;

    beforeEach(() => {
        limiter = new RateLimiter({ logs: false });
    });

    test("should block for blockDuration when limit is reached, not interval", async () => {
        const options = {
            key: "test-block-duration",
            limit: 5,
            interval: 10000, // 10 seconds
            blockDuration: 60000, // 1 minute
            storage: "memory" as const
        };

        for (let i = 0; i < 5; i++) {
            const result = await limiter.check(options);
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(4 - i);
        }

        const blockedResult = await limiter.check(options);
        expect(blockedResult.success).toBe(false);
        expect(blockedResult.remaining).toBe(0);

        const now = Date.now();
        const timeUntilReset = blockedResult.reset - now;

        expect(timeUntilReset).toBeGreaterThan(50000);
        expect(timeUntilReset).toBeLessThanOrEqual(60000);

        console.log(`Time until reset: ${timeUntilReset}ms (should be ~60000ms)`);
    });

    test("should use interval as blockDuration when blockDuration is not specified", async () => {
        const options = {
            key: "test-no-block-duration",
            limit: 3,
            interval: 5000, // 5 seconds
            storage: "memory" as const
        };

        for (let i = 0; i < 3; i++) {
            await limiter.check(options);
        }

        const blockedResult = await limiter.check(options);
        expect(blockedResult.success).toBe(false);

        const now = Date.now();
        const timeUntilReset = blockedResult.reset - now;

        expect(timeUntilReset).toBeGreaterThan(4000);
        expect(timeUntilReset).toBeLessThanOrEqual(5000);

        console.log(`Time until reset: ${timeUntilReset}ms (should be ~5000ms)`);
    });

    test("should remain blocked for the full blockDuration on subsequent calls", async () => {
        const options = {
            key: "test-remain-blocked",
            limit: 2,
            interval: 1000, // 1 second
            blockDuration: 10000, // 10 seconds
            storage: "memory" as const
        };

        await limiter.check(options);
        await limiter.check(options);

        const firstBlocked = await limiter.check(options);
        expect(firstBlocked.success).toBe(false);
        const firstResetAt = firstBlocked.reset;

        await new Promise(resolve => setTimeout(resolve, 100));

        const secondBlocked = await limiter.check(options);
        expect(secondBlocked.success).toBe(false);

        expect(secondBlocked.reset).toBe(firstResetAt);

        console.log(`First reset: ${firstResetAt}, Second reset: ${secondBlocked.reset}`);
    });
});