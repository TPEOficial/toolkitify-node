import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

const modules = [
    "cache",
    "client-only",
    "feature-flags",
    "logger",
    "network",
    "optimistic-ui",
    "rate-limit",
    "server-only"
];

const entries: Record<string, string> = {
    index: resolve(__dirname, "src/index.ts")
};

for (const mod of modules) {
    entries[`modules/${mod}/index`] = resolve(__dirname, `src/modules/${mod}/index.ts`);
}

export default defineConfig({
    build: {
        lib: {
            entry: entries
        },
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            external: ["path", "fs", "crypto"],
            output: [
                {
                    format: "es",
                    entryFileNames: "esm/[name].js",
                    chunkFileNames: "esm/_shared/[name]-[hash].js"
                },
                {
                    format: "cjs",
                    entryFileNames: "cjs/[name].cjs",
                    chunkFileNames: "cjs/_shared/[name]-[hash].cjs"
                }
            ]
        },
        target: "ES2020",
        minify: false
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src")
        }
    },
    plugins: [
        dts({
            outDir: "dist/types",
            include: ["src/**/*"],
            exclude: ["**/*.test.ts", "**/*.spec.ts"],
            insertTypesEntry: true
        })
    ]
});
