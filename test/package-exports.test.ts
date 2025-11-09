/// <reference types="jest" />

const packageJson = require("../package.json");

describe("Package exports configuration", () => {
    it("should have correct main export configuration", () => {
        expect(packageJson.exports).toBeDefined();
        expect(packageJson.exports["."]).toBeDefined();
        expect(packageJson.exports["."].require).toBe("./dist/cjs/index.cjs");
        expect(packageJson.exports["."].import).toBe("./dist/esm/index.js");
        expect(packageJson.exports["."].types).toBe("./dist/types/index.d.ts");
    });

    it("should have correct client-only module export configuration", () => {
        expect(packageJson.exports["./client-only"]).toBeDefined();
        expect(packageJson.exports["./client-only"].require).toBe("./dist/cjs/modules/client-only/index.cjs");
        expect(packageJson.exports["./client-only"].import).toBe("./dist/esm/modules/client-only/index.js");
        expect(packageJson.exports["./client-only"].types).toBe("./dist/types/modules/client-only/index.d.ts");
    });

    it("should have correct server-only module export configuration", () => {
        expect(packageJson.exports["./server-only"]).toBeDefined();
        expect(packageJson.exports["./server-only"].require).toBe("./dist/cjs/modules/server-only/index.cjs");
        expect(packageJson.exports["./server-only"].import).toBe("./dist/esm/modules/server-only/index.js");
        expect(packageJson.exports["./server-only"].types).toBe("./dist/types/modules/server-only/index.d.ts");
    });

    it("should have wildcard export for additional modules", () => {
        expect(packageJson.exports["./*"]).toBeDefined();
        expect(packageJson.exports["./*"].require).toBe("./dist/cjs/**/*.cjs");
        expect(packageJson.exports["./*"].import).toBe("./dist/esm/**/*.js");
    });

    it("should have correct main entry points", () => {
        expect(packageJson.main).toBe("dist/cjs/index.js");
        expect(packageJson.module).toBe("dist/esm/index.js");
        expect(packageJson.types).toBe("dist/types/index.d.ts");
    });

    it("should have correct build scripts", () => {
        expect(packageJson.scripts.build).toBe("npm run clean && npm run build:cjs && npm run build:esm && node ./scripts/rename.js");
        expect(packageJson.scripts["build:cjs"]).toBe("tsc -p tsconfig.cjs.json && tsc-alias -p tsconfig.cjs.json");
        expect(packageJson.scripts["build:esm"]).toBe("tsc -p tsconfig.esm.json && tsc-alias -p tsconfig.esm.json");
    });
});
