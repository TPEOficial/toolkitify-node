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

    constructor(options: LoggerOptions = {}) {
        this.level = options.level ?? "INFO";
        this.defaultFrequency = options.frequency ?? 1;
        this.defaultMaxUses = options.maxUses ?? Infinity;
    };

    private shouldLog(level: LogLevel): boolean {
        return Logger.levels.indexOf(level) >= Logger.levels.indexOf(this.level);
    };

    private format(level: LogLevel, message: string, color?: string): string {
        const now = new Date().toISOString();
        const formatted = `[${now}] [${level}] ${message}`;
        const ansiColors: Record<string, string> = {
            red: "31",
            green: "32",
            yellow: "33",
            blue: "34",
            magenta: "35",
            cyan: "36",
            white: "37"
        };
        if (color && ansiColors[color]) return `\x1b[${ansiColors[color]}m${formatted}\x1b[0m`;
        return formatted;
    };

    private write(text: string): void {
        console.log(`[Toolkitify] ${text}`);
    };

    private log(level: LogLevel, message: string, options: LogOptions = {}): void {
        if (!this.shouldLog(level)) return;

        const freq = options.frequency ?? this.defaultFrequency;
        const maxUses = options.maxUses ?? this.defaultMaxUses;
        const key = `${level}:${message}`;

        const entry = this.counters.get(key) ?? { count: 0, uses: 0 };
        entry.count++;

        if (entry.count % freq !== 0) {
            this.counters.set(key, entry);
            return;
        }

        if (entry.uses >= maxUses) {
            this.counters.set(key, entry);
            return;
        }

        entry.uses++;
        this.counters.set(key, entry);

        const formatted = this.format(level, message, options.color);
        this.write(formatted);
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
};