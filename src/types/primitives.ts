export type TimeUnit =
    | "ms" | "millisecond" | "milliseconds"
    | "s" | "sec" | "secs" | "second" | "seconds"
    | "m" | "min" | "mins" | "minute" | "minutes"
    | "h" | "hr" | "hrs" | "hour" | "hours"
    | "d" | "day" | "days"
    | "w" | "week" | "weeks"
    | "mo" | "month" | "months"
    | "y" | "yr" | "yrs" | "year" | "years";

export type HumanTimeString = `${number}${TimeUnit}`;