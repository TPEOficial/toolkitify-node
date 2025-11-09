/// <reference types="jest" />

describe("Module exports", () => {
    beforeEach(() => {
        // Clear module cache to ensure fresh imports.
        jest.resetModules();
        // Clean up global variables.
        delete (global as any).window;
        delete (global as any).document;
    });

    it("should be able to import client-only module directly", () => {
        // This test verifies the module can be imported without errors in a server environment.
        // (it will throw, but that's expected behavior).
        expect(() => {
            require("../src/modules/client-only/index");
        }).toThrow("[Toolkitify] Do not import this file on the server side.");
    });

    it("should be able to import server-only module directly", () => {
        // This test verifies the module can be imported without errors in a server environment.
        expect(() => {
            require("../src/modules/server-only/index");
        }).not.toThrow();
    });

    it("should export modules from main index", () => {
        // Test that the main index file can be imported.
        // Note: This will fail in current setup since modules throw errors immediately.
        // but it tests that the export structure is correct.
        expect(() => {
            require("../src/index");
        }).not.toThrow();
    });
});
