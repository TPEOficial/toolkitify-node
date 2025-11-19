type FlagValue<Ctx = any> = boolean | ((ctx: Ctx) => boolean);
type FlagsObject<Ctx = any> = Record<string, FlagValue<Ctx>>;

export class FeatureFlags<T extends FlagsObject<Ctx> = FlagsObject, Ctx = any> {
    private flags: Partial<T> = {};

    constructor(initialFlags?: T) {
        if (initialFlags) this.flags = { ...initialFlags };
    };

    // Load or update flags dynamically.
    public load(flags: Partial<T>) {
        this.flags = { ...this.flags, ...flags };
    };

    // Set or update a single flag.
    public set<K extends keyof T>(key: K, value: T[K]) {
        this.flags[key] = value;
    };

    // Get the raw flag (boolean or function).
    public get<K extends keyof T>(key: K): T[K] | undefined {
        return this.flags[key];
    };

    // Check if flag is enabled, optional context.
    public isEnabled<K extends keyof T>(key: K, ctx?: Ctx): boolean {
        const flag = this.flags[key];
        if (flag === undefined) return false;
        if (typeof flag === "function") return flag(ctx!);
        return !!flag;
    };

    // Get all flags.
    public getAll(): Partial<T> {
        return { ...this.flags };
    };
};

// Singleton instance
export const flags = new FeatureFlags();