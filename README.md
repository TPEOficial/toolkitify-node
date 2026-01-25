<div align="center">
  <h1>Toolkitify for Node.JS</h1>
  <h3>Everything you need for your project</h3>
  <img src="https://img.shields.io/badge/TypeScript-purple?style=for-the-badge&logo=typescript&logoColor=white"/> 
  <a href="https://github.com/TPEOficial"> <img alt="GitHub" src="https://img.shields.io/badge/GitHub-purple?style=for-the-badge&logo=github&logoColor=white"/></a>
  <a href="https://ko-fi.com/fjrg2007"> <img alt="Kofi" src="https://img.shields.io/badge/Ko--fi-purple?style=for-the-badge&logo=ko-fi&logoColor=white"></a>
  <br />
  <br />
  <a href="#">Quickstart</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://tpe.li/dsc">Discord</a>
  <hr />
</div>

## Modules

**Toolkitify** provides different modules depending on the required use.

| Module                                | Description                                                                | Status         |
| ------------------------------------- | -------------------------------------------------------------------------- | -------------- |
| Cache (`cache`)                       | Advanced caching system for functions                                      | 🟢 Active      |
| Client Only (`client-only`)           | Client-side only code directive                                            | 🟢 Active      |
| Feature Flags (`feature-flags`)       | Advanced feature flags system                                              | 🟢 Active      |
| Logger (`logger`)                     | Advanced logging system                                                    | 🟢 Active      |
| Network (`network`)                   | Secure client IP extraction with proxy support                             | 🟢 Active      |
| Optimistic UI (`optimistic-ui`)       | Optimistic UI System                                                       | 🟢 Active      |
| Rate Limit (`rate-limit`)             | Advanced Rate Limit System                                                 | 🟢 Active      |
| Server Only (`server-only`)           | Server-side only code directive                                            | 🟢 Active      |

## Modules Usage Examples

<details>
  <summary><strong>Cache (`cache`)</strong></summary>

```ts
import { Cache, cacheFunction, GlobalCache } from "toolkitify/cache";

// Create a cache instance.
const cache = new Cache({ ttl: "30s", maxUses: 3, storage: "memory", logs: "usage" });

// Set a value.
cache.set("myKey", "Hello World!");

// Get a value
console.log(cache.get("myKey")); // "Hello World!".

// Reset a specific key.
cache.reset("myKey");

// Get all cache items.
console.log(cache.getAll());

// Using the singleton GlobalCache.
GlobalCache.set("singletonKey", 123);
console.log(GlobalCache.get("singletonKey")); // 123.

// Caching a function.

function expensiveCalculation(x: number) {
  console.log("Calculating...");
  return x * 2;
};

// Auto-cache result for 30 seconds.
const cachedCalc = cacheFunction(expensiveCalculation, { ttl: "30s" });

console.log(cachedCalc(5)); // "Calculating..." and returns 10.
console.log(cachedCalc(5)); // Returns 10 without recalculating.
```

</details>

<details>
  <summary><strong>Optimistic UI (`optimistic-ui`)</strong></summary>

```ts
import { useOptimistic } from "toolkitify/optimistic-ui";

// With an asynchronous function.

let value = 0;

await useOptimistic.promise(
    async () => {
        await new Promise((r) => setTimeout(r, 50));
        value += 2;
        return value;
    },
    {
        optimisticUpdate: () => {
            value += 1;
        },
        rollback: () => {
            value = 0;
        },
        onSuccess: (result) => {
            value = result;
        }
    }
);

// With a synchronous function.

let value = 0;

useOptimistic.sync(
    () => {
        value += 2;
        return value;
    },
    {
        optimisticUpdate: () => {
            value += 1;
        },
        rollback: () => {
            value = 0;
        },
        onSuccess: (result) => {
            value = result;
        }
    }
);
```

</details>

<details>
  <summary><strong>Client Only (`client-only`)</strong></summary>

```ts
import "toolkitify/client-only";

// Run code only on the client/browser.
console.log("This code runs only in the browser, not in Node/SSR");

// Wrap a block.
document.body.style.backgroundColor = "red";
```

</details>

<details>
  <summary><strong>Feature Flags (`feature-flags`)</strong></summary>

```ts
import { flags, FeatureFlags } "toolkitify/feature-flags";

// Load some static and dynamic flags.
flags.load({
  NEW_UI: true,                                  // static flag.
  BETA_FEATURE: false,                           // static disabled.
  USER_SPECIFIC_FEATURE: (ctx: { userId: number; }) => ctx.userId === 42 // dynamic.
});

// Access flags statically.
console.log(flags.isEnabled("NEW_UI"));         // true.
console.log(flags.isEnabled("BETA_FEATURE"));   // false.

// Access dynamic flag with context.
console.log(flags.isEnabled("USER_SPECIFIC_FEATURE", { userId: 42 })); // true.
console.log(flags.isEnabled("USER_SPECIFIC_FEATURE", { userId: 7 }));  // false.

// Update flags dynamically.
flags.set("BETA_FEATURE", true);
console.log(flags.isEnabled("BETA_FEATURE"));   // true.

// Get raw value (boolean or function).
const raw = flags.get("USER_SPECIFIC_FEATURE");
console.log(typeof raw); // function.

// Create a typed instance for full TS autocomplete.
type MyFlags = {
  NEW_UI: boolean;
  BETA_FEATURE: boolean;
  USER_SPECIFIC_FEATURE: (ctx: { userId: number; }) => boolean;
};

const typedFlags = new FeatureFlags<MyFlags, { userId: number; }>();
typedFlags.load({
  NEW_UI: true,
  BETA_FEATURE: false,
  USER_SPECIFIC_FEATURE: ctx => ctx.userId % 2 === 0
});

console.log(typedFlags.isEnabled("USER_SPECIFIC_FEATURE", { userId: 2 })); // true.
console.log(typedFlags.isEnabled("USER_SPECIFIC_FEATURE", { userId: 3 })); // false.
```

</details>

<details>
  <summary><strong>Logger (`logger`)</strong></summary>

```ts
import { Logger } from "toolkitify/logger";

const logger = new Logger({
  level: "DEBUG",    // Minimum log level.
  frequency: 1,      // Default log every 1 message.
  maxUses: Infinity  // Default unlimited uses.
});

// Normal logs.
logger.debug("Debug message");          // Will be shown.
logger.info("Info message");            // Will be shown.

// Logs with frequency: only log every 3 calls.
for (let i = 1; i <= 6; i++) {
  logger.info("Freq message", { frequency: 3 });
  // Will only be shown on iterations 3 and 6.
}

// Logs with color.
logger.warn("Warning in red", { color: "red" });      // Will be shown in red.
logger.info("Info in green", { color: "green" });    // Will be shown in green.

// Logs with global maxUses.
const limitedLogger = new Logger({ maxUses: 2 });

limitedLogger.info("Limited message"); // Will log.
limitedLogger.info("Limited message"); // Will log.
limitedLogger.info("Limited message"); // Will not log, maxUses reached.

// Logs with maxUses for a specific message.
limitedLogger.info("Single-use message", { maxUses: 1 }); // Will log.
limitedLogger.info("Single-use message", { maxUses: 1 }); // Will not log.
```

</details>

<details> 
  <summary><strong>Rate Limit (`rate-limit`)</strong></summary>

```ts
import { createRateLimit } from "toolkitify/rate-limit";

// Create a rate limiter for IP addresses: max 5 requests per 10 seconds.
const ratelimitIp = createRateLimit(5, "10s", "ip");

async function handleRequest(ip: string) {
    const { success, limit, remaining, reset } = await ratelimitIp.limit(ip);

    if (!success) {
        console.log(`Rate limit exceeded. Try again after ${new Date(reset).toLocaleTimeString()}`);
        return;
    }

    console.log(`Request allowed. Remaining: ${remaining}/${limit}`);
    // Proceed with your request logic here
}

// Example usage
handleRequest("192.168.0.1");
handleRequest("192.168.0.1");
handleRequest("192.168.0.1");
```
</details>

<details>
  <summary><strong>Network (`network`)</strong></summary>

```ts
import { Network } from "toolkitify/network";

// Create a network instance configured for your proxy.
const network = new Network({ proxy: "cloudflare" });

// Express/Node.js middleware example.
app.use((req, res, next) => {
    // Get full result with metadata.
    const result = network.getClientIP(req);
    console.log(result.ip);      // "203.0.113.50"
    console.log(result.source);  // "header" | "x-forwarded-for" | "direct"
    console.log(result.header);  // "cf-connecting-ip"
    console.log(result.trusted); // true (proprietary headers are trusted)

    // Or just get the IP.
    const ip = network.extractIP(req);

    next();
});

// Multiple proxy layers (CDN -> Load Balancer).
const multiProxy = new Network({
    proxy: ["cloudflare", "aws"],
    trustedProxies: ["10.0.0.0/8", "172.16.0.0/12"]
});

// IP validation utilities.
network.isLocal("127.0.0.1");       // true
network.isLocal("::1");             // true
network.isLocal("localhost");       // true

network.isPrivate("192.168.1.1");   // true
network.isPrivate("10.0.0.5");      // true
network.isPrivate("8.8.8.8");       // false

network.isInRange("192.168.1.50", "192.168.1.0/24"); // true
network.normalize("::ffff:192.168.1.1");             // "192.168.1.1"

// Supported proxies: cloudflare, aws, vercel, fastly, akamai,
// nginx, gcp, azure, fly, render, railway, heroku.
```
</details>

<details>
  <summary><strong>Server Only (`server-only`)</strong></summary>

```ts
import "toolkitify/server-only";

// Run code only on the server/Node.
console.log("This code runs only in Node/SSR, not in the browser");

// Access filesystem.
const fs = require("fs");
console.log(fs.readdirSync("."));
```

</details>