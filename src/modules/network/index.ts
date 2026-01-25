/**
 * Supported proxy types with their proprietary headers.
 * These headers are set by the proxy and cannot be spoofed by clients.
 */
type ProxyType =
    | "cloudflare"
    | "aws"         // ALB, CloudFront, API Gateway
    | "vercel"
    | "fastly"
    | "akamai"
    | "nginx"       // When configured with X-Real-IP
    | "gcp"         // Google Cloud Load Balancer
    | "azure"
    | "fly"
    | "render"
    | "railway"
    | "heroku";

interface NetworkOptions {
    /**
     * The proxy type to prioritize when extracting the client IP.
     * If specified, the corresponding proprietary header will be checked first.
     */
    proxy?: ProxyType | ProxyType[];

    /**
     * List of trusted proxy IPs or CIDR ranges.
     * Used when parsing X-Forwarded-For to find the real client IP.
     * The rightmost IP not in this list is considered the client IP.
     * @example ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
     */
    trustedProxies?: string[];

    /**
     * Custom headers to check (in order of priority).
     * Useful for non-standard proxy configurations.
     * @example ["X-Custom-Client-IP", "X-Real-Client-IP"]
     */
    customHeaders?: string[];

    /**
     * Whether to use X-Forwarded-For as a fallback.
     * @default true
     */
    useXForwardedFor?: boolean;
}

interface ClientIPResult {
    /**
     * The detected client IP address.
     * Will be null if no valid IP could be determined.
     */
    ip: string | null;

    /**
     * The source from which the IP was obtained.
     */
    source: "direct" | "header" | "x-forwarded-for";

    /**
     * The specific header name that provided the IP (if applicable).
     */
    header?: string;

    /**
     * Whether the IP was obtained from a trusted/proprietary header.
     */
    trusted: boolean;
}

/**
 * Maps proxy types to their proprietary headers.
 * These headers are set by the proxy infrastructure and are not spoofable.
 */
const PROXY_HEADERS: Record<ProxyType, string[]> = {
    cloudflare: ["cf-connecting-ip", "cf-pseudo-ipv4"],
    aws: ["x-amzn-source-ip", "x-amz-cf-id"],
    vercel: ["x-vercel-forwarded-for", "x-real-ip"],
    fastly: ["fastly-client-ip"],
    akamai: ["true-client-ip", "akamai-origin-hop"],
    nginx: ["x-real-ip"],
    gcp: ["x-cloud-trace-context", "x-appengine-user-ip"],
    azure: ["x-azure-clientip", "x-client-ip"],
    fly: ["fly-client-ip"],
    render: ["x-render-origin-ip"],
    railway: ["x-railway-client-ip"],
    heroku: ["x-forwarded-for"]
};

/**
 * Common private/internal IP ranges in CIDR notation.
 */
const PRIVATE_RANGES = [
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
    "127.0.0.0/8",
    "::1/128",
    "fc00::/7",
    "fe80::/10"
];

/**
 * Parses an IP address from various formats.
 * Handles IPv4, IPv6, and IPv4-mapped IPv6 addresses.
 */
function normalizeIP(ip: string): string | null {
    if (!ip || typeof ip !== "string") return null;

    let normalized = ip.trim();

    // Handle IPv4-mapped IPv6 addresses (::ffff:192.168.1.1)
    if (normalized.startsWith("::ffff:")) normalized = normalized.slice(7);

    // Basic validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

    if (ipv4Regex.test(normalized)) {
        const octets = normalized.split(".").map(Number);
        if (octets.every(o => o >= 0 && o <= 255)) return normalized;
        return null;
    }

    if (ipv6Regex.test(normalized) || normalized === "::1") return normalized.toLowerCase();

    return null;
};

/**
 * Converts an IP address to a numeric value for CIDR comparison.
 */
function ipToNumber(ip: string): bigint | null {
    const normalized = normalizeIP(ip);
    if (!normalized) return null;

    // IPv4
    if (normalized.includes(".")) {
        const parts = normalized.split(".").map(Number);
        return BigInt((parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]);
    }

    // IPv6 - expand and convert
    let expanded = normalized;
    if (expanded.includes("::")) {
        const parts = expanded.split("::");
        const left = parts[0] ? parts[0].split(":") : [];
        const right = parts[1] ? parts[1].split(":") : [];
        const missing = 8 - left.length - right.length;
        const middle = Array(missing).fill("0");
        expanded = [...left, ...middle, ...right].join(":");
    }

    const segments = expanded.split(":");
    let result = BigInt(0);
    for (const segment of segments) {
        result = (result << BigInt(16)) + BigInt(parseInt(segment || "0", 16));
    }
    return result;
};

/**
 * Checks if an IP address is within a CIDR range.
 */
function isInCIDR(ip: string, cidr: string): boolean {
    const [range, prefixStr] = cidr.split("/");
    const prefix = parseInt(prefixStr, 10);

    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(range);

    if (ipNum === null || rangeNum === null) return false;

    const isIPv4 = ip.includes(".");
    const maxBits = isIPv4 ? 32 : 128;

    const mask = ((BigInt(1) << BigInt(maxBits)) - BigInt(1)) ^ ((BigInt(1) << BigInt(maxBits - prefix)) - BigInt(1));

    return (ipNum & mask) === (rangeNum & mask);
};

/**
 * Checks if an IP is in a list of trusted ranges.
 */
function isInTrustedRanges(ip: string, ranges: string[]): boolean {
    for (const range of ranges) {
        if (range.includes("/")) {
            if (isInCIDR(ip, range)) return true;
        } else {
            if (normalizeIP(ip) === normalizeIP(range)) return true;
        }
    }
    return false;
};

/**
 * Checks if an IP is a private/internal address.
 */
function isPrivateIP(ip: string): boolean {
    return isInTrustedRanges(ip, PRIVATE_RANGES);
};

/**
 * Checks if an IP is a localhost/loopback address.
 * Matches: 127.x.x.x, ::1, localhost
 */
function isLocalIP(ip: string): boolean {
    if (!ip || typeof ip !== "string") return false;

    const normalized = ip.trim().toLowerCase();

    // Check for "localhost" string
    if (normalized === "localhost") return true;

    // Check for IPv6 loopback
    if (normalized === "::1") return true;

    // Handle IPv4-mapped IPv6 loopback
    if (normalized === "::ffff:127.0.0.1") return true;

    // Check for IPv4 loopback range (127.0.0.0/8)
    const parsed = normalizeIP(ip);
    if (parsed && parsed.startsWith("127.")) return true;

    // Check for IPv6 loopback variations
    if (parsed === "::1") return true;

    return false;
};

/**
 * Extracts the header value from a request object.
 * Compatible with Express, Node.js http, and similar frameworks.
 */
function getHeader(req: any, name: string): string | undefined {
    const normalized = name.toLowerCase();

    // Express/Connect style
    if (typeof req.get === "function") return req.get(normalized);

    // Raw Node.js http.IncomingMessage
    if (req.headers && typeof req.headers === "object") return req.headers[normalized];

    // Web API Request (fetch-style)
    if (typeof req.headers?.get === "function") return req.headers.get(normalized) ?? undefined;

    return undefined;
};

/**
 * Gets the remote address from the socket/connection.
 */
function getRemoteAddress(req: any): string | null {
    const remoteAddr =
        req.socket?.remoteAddress ||
        req.connection?.remoteAddress ||
        req.ip ||
        req.remoteAddr;

    return normalizeIP(remoteAddr);
};

/**
 * Parses X-Forwarded-For header safely.
 * Returns the rightmost IP that is not in the trusted proxy list.
 */
function parseXForwardedFor(xff: string, trustedProxies: string[]): string | null {
    const ips = xff
        .split(",")
        .map(ip => ip.trim())
        .filter(Boolean);

    // Iterate from right to left (most recent proxy first)
    for (let i = ips.length - 1; i >= 0; i--) {
        const ip = normalizeIP(ips[i]);
        if (!ip) continue;

        // If this IP is not a trusted proxy, it's our client
        if (!isInTrustedRanges(ip, trustedProxies)) return ip;
    }

    // All IPs were trusted proxies, return the leftmost as fallback
    return normalizeIP(ips[0]) || null;
};

/**
 * Network utility class for secure client IP extraction and network-related operations.
 *
 * @example
 * // Basic usage with Cloudflare
 * const network = new Network({ proxy: "cloudflare" });
 * app.use((req, res, next) => {
 *     const { ip } = network.getClientIP(req);
 *     console.log(`Request from: ${ip}`);
 *     next();
 * });
 *
 * @example
 * // Multiple proxy layers (CDN -> Load Balancer)
 * const network = new Network({
 *     proxy: ["cloudflare", "aws"],
 *     trustedProxies: ["10.0.0.0/8"]
 * });
 *
 * @example
 * // With custom headers
 * const network = new Network({
 *     customHeaders: ["X-My-Real-IP"],
 *     useXForwardedFor: true
 * });
 */
export class Network {
    private defaultOptions: NetworkOptions;

    constructor(options: NetworkOptions = {}) {
        this.defaultOptions = {
            useXForwardedFor: true,
            ...options
        };
    };

    /**
     * Extracts the real client IP address from a request.
     *
     * Security considerations:
     * - Proprietary proxy headers (like CF-Connecting-IP) are prioritized as they cannot be spoofed
     * - X-Forwarded-For is parsed from right to left, trusting only configured proxy IPs
     * - Direct socket connection is used as ultimate fallback
     *
     * @param req - The incoming request object (Express, Node http, or similar)
     * @param overrideOptions - Options to override the instance defaults for this call
     * @returns The client IP result with metadata about the source
     *
     * @example
     * const result = network.getClientIP(req);
     * console.log(result.ip);      // "203.0.113.50"
     * console.log(result.source);  // "header"
     * console.log(result.trusted); // true
     */
    public getClientIP(req: any, overrideOptions: NetworkOptions = {}): ClientIPResult {
        const options = { ...this.defaultOptions, ...overrideOptions };
        const {
            proxy,
            trustedProxies = [],
            customHeaders = [],
            useXForwardedFor = true
        } = options;

        // Combine private ranges with user-specified trusted proxies
        const allTrustedProxies = [...PRIVATE_RANGES, ...trustedProxies];

        // 1. Check custom headers first (highest priority if specified)
        for (const header of customHeaders) {
            const value = getHeader(req, header);
            if (value) {
                const ip = normalizeIP(value.split(",")[0]);
                if (ip) {
                    return {
                        ip,
                        source: "header",
                        header,
                        trusted: false
                    };
                }
            }
        }

        // 2. Check proxy-specific proprietary headers
        const proxyList = proxy ? (Array.isArray(proxy) ? proxy : [proxy]) : [];

        for (const proxyType of proxyList) {
            const headers = PROXY_HEADERS[proxyType];
            if (!headers) continue;

            for (const header of headers) {
                const value = getHeader(req, header);
                if (value) {
                    const ip = normalizeIP(value.split(",")[0]);
                    if (ip) {
                        return {
                            ip,
                            source: "header",
                            header,
                            trusted: true
                        };
                    }
                }
            }
        }

        // 3. Check X-Forwarded-For (if enabled)
        if (useXForwardedFor) {
            const xff = getHeader(req, "x-forwarded-for");
            if (xff) {
                const ip = parseXForwardedFor(xff, allTrustedProxies);
                if (ip) {
                    return {
                        ip,
                        source: "x-forwarded-for",
                        header: "x-forwarded-for",
                        trusted: trustedProxies.length > 0
                    };
                }
            }

            // Also check X-Real-IP as common alternative
            const realIP = getHeader(req, "x-real-ip");
            if (realIP) {
                const ip = normalizeIP(realIP);
                if (ip) {
                    return {
                        ip,
                        source: "header",
                        header: "x-real-ip",
                        trusted: false
                    };
                }
            }
        }

        // 4. Fall back to direct connection
        const directIP = getRemoteAddress(req);
        return {
            ip: directIP,
            source: "direct",
            trusted: true
        };
    };

    /**
     * Simple helper that just returns the IP string or null.
     * Use this when you don't need the metadata.
     *
     * @example
     * const ip = network.extractIP(req);
     * if (ip) console.log(`Request from: ${ip}`);
     */
    public extractIP(req: any, overrideOptions: NetworkOptions = {}): string | null {
        return this.getClientIP(req, overrideOptions).ip;
    };

    /**
     * Checks if an IP address is private/internal.
     *
     * @example
     * network.isPrivate("192.168.1.1"); // true
     * network.isPrivate("8.8.8.8");     // false
     */
    public isPrivate(ip: string): boolean {
        return isPrivateIP(ip);
    };

    /**
     * Checks if an IP address is localhost/loopback.
     * Matches: 127.x.x.x, ::1, localhost
     *
     * @example
     * network.isLocal("127.0.0.1");   // true
     * network.isLocal("::1");         // true
     * network.isLocal("localhost");   // true
     * network.isLocal("192.168.1.1"); // false
     */
    public isLocal(ip: string): boolean {
        return isLocalIP(ip);
    };

    /**
     * Checks if an IP address is within a CIDR range.
     *
     * @example
     * network.isInRange("192.168.1.50", "192.168.1.0/24"); // true
     * network.isInRange("10.0.0.1", "192.168.0.0/16");     // false
     */
    public isInRange(ip: string, cidr: string): boolean {
        return isInCIDR(ip, cidr);
    };

    /**
     * Normalizes an IP address (handles IPv4-mapped IPv6, validation, etc).
     *
     * @example
     * network.normalize("::ffff:192.168.1.1"); // "192.168.1.1"
     * network.normalize("invalid");            // null
     */
    public normalize(ip: string): string | null {
        return normalizeIP(ip);
    };

    /**
     * Gets the current proxy configuration.
     */
    public getConfig(): NetworkOptions {
        return { ...this.defaultOptions };
    };

    /**
     * Updates the default options for future calls.
     *
     * @example
     * network.configure({ proxy: "aws" });
     */
    public configure(options: Partial<NetworkOptions>): void {
        this.defaultOptions = { ...this.defaultOptions, ...options };
    };
};

// Export a default instance
export const network = new Network();

// Standalone function for quick usage without instantiation
export function getClientIP(req: any, options: NetworkOptions = {}): ClientIPResult {
    return new Network(options).getClientIP(req);
};

export function extractClientIP(req: any, options: NetworkOptions = {}): string | null {
    return new Network(options).extractIP(req);
};

// Export types
export type { ProxyType, NetworkOptions, ClientIPResult };

// Export utilities for advanced usage
export { normalizeIP, isPrivateIP, isLocalIP, isInCIDR, PROXY_HEADERS, PRIVATE_RANGES };