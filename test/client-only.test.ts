/// <reference types="jest" />

describe("client-only module", () => {
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

    it("should throw error when imported on server side (no window/document)", () => {
        // Ensure window and document are undefined (server environment).
        (global as any).window = undefined;
        (global as any).document = undefined;

        expect(() => {
            require("../src/modules/client-only/index");
        }).toThrow("[Toolkitify] Do not import this file on the server side.");
    });

    it("should throw error when window is undefined but document exists", () => {
        // Set up server-like environment with document but no window.
        (global as any).window = undefined;
        (global as any).document = {};

        expect(() => {
            require("../src/modules/client-only/index");
        }).toThrow("[Toolkitify] Do not import this file on the server side.");
    });

    it("should throw error when document is undefined but window exists", () => {
        // Set up server-like environment with window but no document.
        (global as any).window = {};
        (global as any).document = undefined;

        expect(() => {
            require("../src/modules/client-only/index");
        }).toThrow("[Toolkitify] Do not import this file on the server side.");
    });

    it("should not throw error when imported in client environment", () => {
        // Set up client environment with both window and document.
        (global as any).window = mockWindow;
        (global as any).document = mockWindow.document;

        expect(() => {
            require("../src/modules/client-only/index");
        }).not.toThrow();
    });

    it("should handle case where window is null", () => {
        // Set up environment with null window.
        (global as any).window = null;
        (global as any).document = {};

        expect(() => {
            require("../src/modules/client-only/index");
        }).toThrow("[Toolkitify] Do not import this file on the server side.");
    });

    it("should handle case where document is null", () => {
        // Set up environment with null document.
        (global as any).window = {};
        (global as any).document = null;

        expect(() => {
            require("../src/modules/client-only/index");
        }).toThrow("[Toolkitify] Do not import this file on the server side.");
    });
});
