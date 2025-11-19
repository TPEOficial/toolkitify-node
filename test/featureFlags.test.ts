/// <reference types="jest" />

import { flags, FeatureFlags } from "../src/modules/feature-flags";

describe("FeatureFlags", () => {
    beforeEach(() => {
        // Reset singleton before each test.
        flags.load({});
    });

    test("static flags are returned correctly", () => {
        flags.load({
            STATIC_FEATURE: true,
            DISABLED_FEATURE: false
        });

        expect(flags.isEnabled("STATIC_FEATURE")).toBe(true);
        expect(flags.isEnabled("DISABLED_FEATURE")).toBe(false);
    });

    test("dynamic flags work with context", () => {
        flags.load({
            DYNAMIC_FEATURE: (ctx: { userId: number; }) => ctx.userId === 1
        });

        expect(flags.isEnabled("DYNAMIC_FEATURE", { userId: 1 })).toBe(true);
        expect(flags.isEnabled("DYNAMIC_FEATURE", { userId: 2 })).toBe(false);
    });

    test("updating flags works correctly", () => {
        flags.set("TOGGLE_FEATURE", true);
        expect(flags.isEnabled("TOGGLE_FEATURE")).toBe(true);

        flags.set("TOGGLE_FEATURE", false);
        expect(flags.isEnabled("TOGGLE_FEATURE")).toBe(false);
    });

    test("getAll returns all loaded flags with correct state", () => {
        flags.load({
            FLAG_ONE: true,
            FLAG_TWO: (ctx: { userId: number; }) => ctx.userId === 1
        });

        const allFlags = flags.getAll();
        expect(allFlags.FLAG_ONE).toBe(true);
        expect(typeof allFlags.FLAG_TWO).toBe("function");
    });

    test("get returns the raw flag value", () => {
        const dynamicFn = (ctx: { userId: number; }) => ctx.userId === 1;
        flags.load({
            RAW_FLAG: dynamicFn
        });

        const raw = flags.get("RAW_FLAG");
        expect(raw).toBe(dynamicFn);
    });

    test("undefined flags return false in isEnabled", () => {
        expect(flags.isEnabled("UNKNOWN_FLAG")).toBe(false);
    });

    test("typed FeatureFlags works with generics", () => {
        type MyFlags = { NEW_UI: boolean; BETA: (ctx: { userId: number; }) => boolean; };
        const typedFlags = new FeatureFlags<MyFlags, { userId: number; }>();

        typedFlags.load({
            NEW_UI: true,
            BETA: ctx => ctx.userId === 42
        });

        expect(typedFlags.isEnabled("NEW_UI")).toBe(true);
        expect(typedFlags.isEnabled("BETA", { userId: 42 })).toBe(true);
        expect(typedFlags.isEnabled("BETA", { userId: 1 })).toBe(false);
    });
});