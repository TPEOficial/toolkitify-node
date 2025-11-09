/// <reference types="jest" />

describe("server-only module", () => {
    // Mock window and document for client environment.
    const mockWindow = {
        document: {}
    };

    beforeEach(() => {
        // Clear all mocks before each test.
        jest.clearAllMocks();
        // Clear module cache to ensure fresh imports.
        jest.resetModules();
    });

    afterEach(() => {
        // Restore original globals after each test.
        delete (global as any).window;
        delete (global as any).document;
    });

    it("should not throw error when imported on server side (no window/document)", () => {
        // Ensure window and document are undefined (server environment).
        (global as any).window = undefined;
        (global as any).document = undefined;

        expect(() => {
            require("../src/modules/server-only/index");
        }).not.toThrow();
    });

    it("should throw error when window exists but document is undefined", () => {
        // Set up client-like environment with window but no document.
        (global as any).window = {};
        (global as any).document = undefined;

        expect(() => {
            require("../src/modules/server-only/index");
        }).toThrow("[Toolkitify] Do not import this file on the client side.");
    });

    it("should throw error when document exists but window is undefined", () => {
        // Set up client-like environment with document but no window.
        (global as any).window = undefined;
        (global as any).document = {};

        expect(() => {
            require("../src/modules/server-only/index");
        }).toThrow("[Toolkitify] Do not import this file on the client side.");
    });

    it("should throw error when imported in client environment", () => {
        // Set up client environment with both window and document.
        (global as any).window = mockWindow;
        (global as any).document = mockWindow.document;

        expect(() => {
            require("../src/modules/server-only/index");
        }).toThrow("[Toolkitify] Do not import this file on the client side.");
    });

    it("should handle case where window is null", () => {
        // Set up environment with null window.
        (global as any).window = null;
        (global as any).document = {};

        expect(() => {
            require("../src/modules/server-only/index");
        }).toThrow("[Toolkitify] Do not import this file on the client side.");
    });

    it("should handle case where document is null", () => {
        // Set up environment with null document.
        (global as any).window = {};
        (global as any).document = null;

        expect(() => {
            require("../src/modules/server-only/index");
        }).toThrow("[Toolkitify] Do not import this file on the client side.");
    });

    it("should handle case where both window and document are null", () => {
        // Set up environment with both null (should be considered server environment).
        (global as any).window = null;
        (global as any).document = null;

        expect(() => {
            require("../src/modules/server-only/index");
        }).not.toThrow();
    });

    it("should work correctly when both window and document are undefined", () => {
        // Set up pure server environment.
        (global as any).window = undefined;
        (global as any).document = undefined;

        expect(() => {
            require("../src/modules/server-only/index");
        }).not.toThrow();
    });
});
