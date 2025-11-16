export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

type Color = "green" | "red" | "yellow" | "blue" | "magenta" | "cyan" | "white" | `#${string}`;

export interface LoggerOptions {
    level?: LogLevel;
    frequency?: number;
    maxUses?: number;
}

export interface LogOptions {
    frequency?: number;
    color?: Color;
    maxUses?: number;
}

export class Logger {
    private level: LogLevel;
    private defaultFrequency: number;
    private defaultMaxUses: number;
    private counters: Map<string, { count: number; uses: number }> = new Map();
    private static levels: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR"];
    private buffer: string[] = [];
    private flushInterval: number = 50;
    private flushTimer: NodeJS.Timeout | null = null;
    private asyncFlush: boolean;

    constructor(options: LoggerOptions & { flushInterval?: number; asyncFlush?: boolean; } = {}) {
        this.level = options.level ?? "INFO";
        this.defaultFrequency = options.frequency ?? 1;
        this.defaultMaxUses = options.maxUses ?? Infinity;
        this.asyncFlush = options.asyncFlush ?? true;

        if (this.asyncFlush) {
            this.flushInterval = options.flushInterval ?? 50;
            this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
        }
    };

    private shouldLog(level: LogLevel) {
        return Logger.levels.indexOf(level) >= Logger.levels.indexOf(this.level);
    };

    private format(level: LogLevel, message: string, color?: string) {
        const now = new Date().toISOString();
        const formatted = `[${now}] [${level}] ${message}`;
        const ansiColors: Record<string, string> = {
            red: "31", green: "32", yellow: "33",
            blue: "34", magenta: "35", cyan: "36", white: "37"
        };
        return color && ansiColors[color] ? `\x1b[${ansiColors[color]}m${formatted}\x1b[0m` : formatted;
    };

    private flush() {
        if (this.buffer.length === 0) return;
        console.log(this.buffer.join("\n"));
        this.buffer.length = 0;
    };

    private enqueue(text: string) {
        this.buffer.push(`[Toolkitify] ${text}`);
        if (!this.asyncFlush) this.flush();
    };

    private log(level: LogLevel, message: string, options: LogOptions = {}) {
        if (!this.shouldLog(level)) return;

        const freq = options.frequency ?? this.defaultFrequency;
        const maxUses = options.maxUses ?? this.defaultMaxUses;
        const key = `${level}:${message}`;

        const entry = this.counters.get(key) ?? { count: 0, uses: 0 };
        entry.count++;

        if (entry.count % freq !== 0 || entry.uses >= maxUses) {
            this.counters.set(key, entry);
            return;
        }

        entry.uses++;
        this.counters.set(key, entry);

        this.enqueue(this.format(level, message, options.color));
    };

    debug(message: string, options?: LogOptions): void {
        this.log("DEBUG", message, options);
    };

    info(message: string, options?: LogOptions): void {
        this.log("INFO", message, options);
    };

    warn(message: string, options?: LogOptions): void {
        this.log("WARN", message, options);
    };

    error(message: string, options?: LogOptions): void {
        this.log("ERROR", message, options);
    };

    stop() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        this.flush();
    };
};