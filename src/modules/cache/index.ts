import { parseTime } from "../../utils/basics";
import { HumanTimeString } from "../../types/primitives";

type StorageType = "memory" | "localStorage" | "sessionStorage" | "cookies";

interface CacheOptions {
    ttl?: number | HumanTimeString;
    maxUses?: number;
    storage?: StorageType;
    logs?: LogsCache;
}

type LogsCache = "none" | "usage";

interface CacheItem<T = any> {
    value: T;
    createdAt: number;
    uses: number;
    ttl?: number;
    maxUses?: number;
}

export class Cache {
    private memoryStore: Record<string, CacheItem> = {};
    private listeners: Record<string, ((info: any) => void)[]> = {};

    constructor(private defaultOptions: CacheOptions = { ttl: 60000, maxUses: Infinity, storage: "memory" }) { }

    private isClient() {
        return typeof window !== "undefined";
    };

    private getStorage(storage?: StorageType): StorageType {
        return storage || this.defaultOptions.storage || "memory";
    };

    private serialize(item: CacheItem) {
        return JSON.stringify(item);
    };

    private deserialize<T>(data: string): CacheItem<T> | null {
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    };

    private logUsage(key: string) {
        if (this.defaultOptions.logs !== "usage") return;
        const box = "\x1b[1m\x1b[107m\x1b[30m Cache \x1b[0m";
        console.log(`\x1b[107m\x1b[30m${box} ${key}\x1b[0m`);
    };

    private cookieSet(key: string, value: string, ttl?: number) {
        if (!this.isClient()) return;
        let expires = "";
        if (ttl) {
            const date = new Date(Date.now() + ttl);
            expires = `; expires=${date.toUTCString()}`;
        }
        document.cookie = `${key}=${encodeURIComponent(value)}${expires}; path=/`;
    };

    private cookieGet(key: string) {
        if (!this.isClient()) return null;
        const match = document.cookie.match(new RegExp("(^| )" + key + "=([^;]+)"));
        return match ? decodeURIComponent(match[2]) : null;
    };

    private cookieRemove(key: string) {
        if (!this.isClient()) return;
        document.cookie = `${key}=; Max-Age=0; path=/`;
    };

    private getStorageKey(key: string) {
        return `toolkitify:${key}`;
    };

    private getItemFromStorage<T>(key: string, storage: StorageType): CacheItem<T> | null {
        const storageKey = this.getStorageKey(key);

        if (storage === "memory") return this.memoryStore[key] || null;
        if (!this.isClient()) return null;

        let data: string | null = null;

        if (storage === "localStorage") data = localStorage.getItem(storageKey);
        if (storage === "sessionStorage") data = sessionStorage.getItem(storageKey);
        if (storage === "cookies") data = this.cookieGet(storageKey);

        if (!data) return null;

        return this.deserialize<T>(data);
    };

    private setItemToStorage<T>(key: string, item: CacheItem<T>, storage: StorageType) {
        if (storage === "memory") {
            this.memoryStore[key] = item;
            return;
        }
        if (!this.isClient()) return;

        const storageKey = this.getStorageKey(key);
        const serialized = this.serialize(item);

        if (storage === "localStorage") localStorage.setItem(storageKey, serialized);
        if (storage === "sessionStorage") sessionStorage.setItem(storageKey, serialized);
        if (storage === "cookies") this.cookieSet(storageKey, serialized, item.ttl);
    };

    private removeItemFromStorage(key: string, storage: StorageType) {
        const storageKey = this.getStorageKey(key);

        if (storage === "memory") delete this.memoryStore[key];
        if (!this.isClient()) return;

        if (storage === "localStorage") localStorage.removeItem(storageKey);
        if (storage === "sessionStorage") sessionStorage.removeItem(storageKey);
        if (storage === "cookies") this.cookieRemove(storageKey);
    };

    private emit(event: string, info: any) {
        const handlers = this.listeners[event];
        if (!handlers) return;
        handlers.forEach(h => h(info));
    };

    set<T>(key: string, value: T, options?: CacheOptions) {
        const config = { ...this.defaultOptions, ...options };
        const item: CacheItem<T> = {
            value,
            createdAt: Date.now(),
            uses: 0,
            ttl: config.ttl ? parseTime(config.ttl) : undefined,
            maxUses: config.maxUses
        };
        const storage = this.getStorage(config.storage);
        this.setItemToStorage(key, item, storage);
        this.emit("set", { key, storage });
    };

    get<T>(key: string, options?: CacheOptions): T | null {
        const config = { ...this.defaultOptions, ...options };
        const storage = this.getStorage(config.storage);

        const item = this.getItemFromStorage<T>(key, storage);
        if (!item) return null;

        if (item.ttl && Date.now() - item.createdAt > item.ttl) {
            this.removeItemFromStorage(key, storage);
            this.emit("expire", { key, storage });
            return null;
        }

        item.uses += 1;
        if (item.maxUses && item.uses >= item.maxUses) {
            this.removeItemFromStorage(key, storage);
            this.emit("delete", { key, storage });
        }
        else this.setItemToStorage(key, item, storage);

        this.emit("get", { key, storage });
        this.logUsage(key);
        
        return item.value;
    };

    reset(key: string, storage?: StorageType) {
        const st = this.getStorage(storage);
        this.removeItemFromStorage(key, st);
        this.emit("delete", { key, storage: st });
    };

    clearAll(storage?: StorageType) {
        const st = this.getStorage(storage);
        if (st === "memory") {
            Object.keys(this.memoryStore).forEach(k => this.emit("delete", { key: k, storage: st }));
            this.memoryStore = {};
            this.emit("clear", { storage: st });
            return;
        }
        if (!this.isClient()) return;

        if (st === "localStorage") {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) this.emit("delete", { key, storage: st });
            }
            localStorage.clear();
        }
        if (st === "sessionStorage") {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key) this.emit("delete", { key, storage: st });
            }
            sessionStorage.clear();
        }
        if (st === "cookies") {
            document.cookie.split(";").forEach(c => {
                const eqPos = c.indexOf("=");
                const key = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
                this.cookieRemove(key);
                this.emit("delete", { key, storage: st });
            });
        }

        this.emit("clear", { storage: st });
    };

    getAll(storage?: StorageType) {
        const st = this.getStorage(storage);
        if (st === "memory") return { ...this.memoryStore };
        if (!this.isClient()) return {};

        const store: Record<string, CacheItem> = {};

        if (st === "localStorage") {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const item = this.deserialize(localStorage.getItem(key) || "");
                    if (item) store[key] = item;
                }
            }
        }

        if (st === "sessionStorage") {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key) {
                    const item = this.deserialize(sessionStorage.getItem(key) || "");
                    if (item) store[key] = item;
                }
            }
        }

        if (st === "cookies") {
            document.cookie.split(";").forEach(c => {
                const eqPos = c.indexOf("=");
                const key = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
                const val = this.cookieGet(key);
                if (val) {
                    const item = this.deserialize(val);
                    if (item) store[key] = item;
                }
            });
        }

        return store;
    };

    addEventListener(event: string, handler: (info: any) => void) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(handler);
    };
};

export const GlobalCache = new Cache({ ttl: 60000, maxUses: Infinity, storage: "memory" });

export function cacheFunction<T extends (...args: any[]) => any>(
    fn: T,
    options: CacheOptions = { ttl: "30s" }
) {
    return (...args: Parameters<T>): ReturnType<T> => {
        const key = `${fn.name}:${JSON.stringify(args)}`;
        const cached = GlobalCache.get<ReturnType<T>>(key, options);
        if (cached !== null) return cached;
        const result = fn(...args);
        GlobalCache.set(key, result, options);
        return result;
    };
};