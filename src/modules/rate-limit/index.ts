import { parseTime } from "../../utils/basics";
import { HumanTimeString } from "../../types/primitives";

type RateLimitStorage = "memory" | "sessionStorage" | "localStorage" | "redis";

interface RateLimitOptions {
    limit: number;
    interval: number | HumanTimeString;
    blockDuration?: number | HumanTimeString;
    storage?: RateLimitStorage;
    key?: string;
    logs?: boolean;
    redisClient?: any;
}

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

export class RateLimiter {
    private memoryStore: Record<string, RateLimitRecord> = {};

    constructor(private defaultOptions: Partial<RateLimitOptions> = {}) { }

    private isClient() {
        return typeof window !== "undefined";
    };

    private log(msg: string) {
        if (this.defaultOptions.logs) console.log(`[RateLimiter] ${msg}`);
    };

    private storageKey(key: string) {
        return `toolkitify:ratelimit:${key}`;
    };

    private getClientRecord(key: string, intervalMs: number, storage: "localStorage" | "sessionStorage") {
        if (!this.isClient()) return { count: 0, resetAt: Date.now() + intervalMs };
        const skey = this.storageKey(key);
        const data = storage === "localStorage" ? localStorage.getItem(skey) : sessionStorage.getItem(skey);
        const now = Date.now();

        if (!data) {
            const record = { count: 0, resetAt: now + intervalMs };
            storage === "localStorage" ? localStorage.setItem(skey, JSON.stringify(record)) : sessionStorage.setItem(skey, JSON.stringify(record));
            return record;
        }

        const record: RateLimitRecord = JSON.parse(data);
        if (now > record.resetAt) {
            const newRecord = { count: 0, resetAt: now + intervalMs };
            storage === "localStorage" ? localStorage.setItem(skey, JSON.stringify(newRecord)) : sessionStorage.setItem(skey, JSON.stringify(newRecord));
            return newRecord;
        }

        return record;
    };

    private setClientRecord(key: string, record: RateLimitRecord, storage: "localStorage" | "sessionStorage") {
        if (!this.isClient()) return;
        const skey = this.storageKey(key);
        storage === "localStorage" ? localStorage.setItem(skey, JSON.stringify(record)) : sessionStorage.setItem(skey, JSON.stringify(record));
    };

    private getMemoryRecord(key: string, intervalMs: number) {
        const record = this.memoryStore[key];
        const now = Date.now();
        if (!record || now > record.resetAt) this.memoryStore[key] = { count: 0, resetAt: now + intervalMs };
        return this.memoryStore[key];
    };

    public async check(options: RateLimitOptions): Promise<RateLimitResult> {
        const config = { ...this.defaultOptions, ...options };
        const intervalMs = typeof config.interval === "number" ? config.interval : parseTime(config.interval as HumanTimeString);
        const blockMs = config.blockDuration ? (typeof config.blockDuration === "number" ? config.blockDuration : parseTime(config.blockDuration)) : intervalMs;
        const key = config.key || "default";
        const storage = config.storage || "memory";

        let currentCount = 0;
        let resetAt = Date.now() + intervalMs;

        switch (storage) {
            case "memory": {
                const record = this.getMemoryRecord(key, intervalMs);
                currentCount = record.count;
                resetAt = record.resetAt;
                break;
            }
            case "sessionStorage":
            case "localStorage": {
                if (!this.isClient()) throw new Error("Client-side rate limit can only run in browser");
                const record = this.getClientRecord(key, intervalMs, storage);
                currentCount = record.count;
                resetAt = record.resetAt;
                break;
            }
            case "redis": {
                if (!config.redisClient) throw new Error("Redis client not provided");
                const val = await config.redisClient.get(`@toolkitify/ratelimit/${key}`);
                if (val) {
                    const parsed = JSON.parse(val);
                    currentCount = parsed.count;
                    resetAt = parsed.resetAt;
                } else {
                    currentCount = 0;
                    resetAt = Date.now() + intervalMs;
                    await config.redisClient.set(`@toolkitify/ratelimit/${key}`, JSON.stringify({ count: currentCount, resetAt }), "PX", intervalMs);
                }
                break;
            }
        }

        if (currentCount >= config.limit) {
            this.log(`Rate limit exceeded for key: ${key}.`);

            return {
                success: false,
                limit: config.limit,
                remaining: 0,
                reset: resetAt
            };
        }

        currentCount++;
        const remaining = config.limit - currentCount;

        // Si esta llamada alcanza el límite, aplicar blockDuration para el próximo reset
        if (currentCount >= config.limit) {
            resetAt = Date.now() + blockMs;
        }

        switch (storage) {
            case "memory":
                this.memoryStore[key].count = currentCount;
                this.memoryStore[key].resetAt = resetAt;
                break;
            case "sessionStorage":
            case "localStorage": this.setClientRecord(key, { count: currentCount, resetAt }, storage); break;
            case "redis": await config.redisClient.set(`@toolkitify/ratelimit/${key}`, JSON.stringify({ count: currentCount, resetAt }), "PX", resetAt - Date.now()); break;
        }

        return {
            success: true,
            limit: config.limit,
            remaining,
            reset: resetAt
        };
    };
};

export function createRateLimit(
    limit: number,
    interval: number | HumanTimeString,
    keyPrefix: string,
    options: Partial<RateLimitOptions> = {}
) {
    const limiter = new RateLimiter({ logs: options.logs });
    const intervalMs = typeof interval === "number" ? interval : parseTime(interval);

    return {
        limit: async (value: string): Promise<RateLimitResult> => {
            const key = `${keyPrefix}:${value}`;
            return await limiter.check({
                storage: options.storage || "memory",
                ...options,
                limit,
                interval: intervalMs,
                key
            });
        }
    };
};