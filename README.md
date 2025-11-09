<div align="center">
  <h1>Toolkitify for Node.JS</h1>
  <h3>Official Toolkitify library for Node.JS</h3>
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
| Rate Limiting (`rate-limiting`)       | Advanced Rate Limit System                                                 | 🔴 Not started |
| Server Only (`server-only`)           | Server-side only code directive                                            | 🟢 Active      |

## Modules Usage Examples

<details>
  <summary><strong>Cache (`cache`)</strong></summary>

```ts
import { Cache, GlobalCache } from "toolkitify";

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
```

</details>

<details>
  <summary><strong>Client Only (`client-only`)</strong></summary>

```ts
import "toolkitify/client-only";

// Run code only on the client/browser.
clientOnly(() => {
    console.log("This code runs only in the browser, not in Node/SSR");
});

// Wrap a block.
clientOnly(() => {
    document.body.style.backgroundColor = "red";
});
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