import { HumanTimeString } from "../types/primitives";

export function parseTime(value: number | HumanTimeString): number {
    if (typeof value === "number") return value;

    const regex = /^(\d+)([a-zA-Z]+)$/;
    const match = value.match(regex);
    if (!match) throw new Error(`Invalid time format: ${value}`);
    const [, numStr, unit] = match;
    const num = parseInt(numStr);
    switch (unit.toLowerCase()) {
        case "ms":
        case "millisecond":
        case "milliseconds": return num;
        case "s":
        case "sec":
        case "secs":
        case "second":
        case "seconds": return num * 1000;
        case "m":
        case "min":
        case "mins":
        case "minute":
        case "minutes": return num * 60_000;
        case "h":
        case "hr":
        case "hrs":
        case "hour":
        case "hours": return num * 3_600_000;
        case "d":
        case "day":
        case "days": return num * 86_400_000;
        case "w":
        case "week":
        case "weeks": return num * 604_800_000;
        case "mo":
        case "month":
        case "months": return num * 2_629_746_000;
        case "y":
        case "yr":
        case "yrs":
        case "year":
        case "years": return num * 31_556_952_000;
        default: throw new Error(`Unknown time unit: ${unit}`);
    };
};