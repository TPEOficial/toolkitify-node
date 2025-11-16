/// <reference types="jest" />

import { Logger } from "../src/modules/logger";

describe("Logger", () => {
    let logger: Logger;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        logger = new Logger({
            level: "DEBUG",
            asyncFlush: false
        });
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    test("should log messages at or above the set level", () => {
        logger.debug("Debug message");
        logger.info("Info message");
        logger.warn("Warn message");
        logger.error("Error message");

        expect(consoleSpy).toHaveBeenCalledTimes(4);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Debug message"));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Info message"));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Warn message"));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Error message"));
    });

    test("should respect message frequency", () => {
        for (let i = 1; i <= 5; i++) {
            logger.info("Freq message", { frequency: 3 });
        }

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Freq message"));
    });

    test("should apply color codes if provided", () => {
        logger.info("Colored message", { color: "red" }); // Red
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("\x1b[31m"));
    });

    test("should not log messages below current level", () => {
        const warnLogger = new Logger({
            level: "WARN",
            asyncFlush: false
        });

        warnLogger.debug("Debug below level");
        warnLogger.info("Info below level");
        warnLogger.warn("Warn at level");
        warnLogger.error("Error above level");

        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Warn at level"));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Error above level"));
    });

    test("should track frequency independently per message", () => {
        for (let i = 1; i <= 6; i++) {
            logger.info("Msg A", { frequency: 2 });
            logger.info("Msg B", { frequency: 3 });
        }

        expect(consoleSpy).toHaveBeenCalledTimes(5);
    });

    // ✅ NEW TEST: maxUses
    test("should respect maxUses per message", () => {
        const maxLogger = new Logger({ maxUses: 2, asyncFlush: false });

        // default maxUses = 2, frequency = 1
        maxLogger.info("Limited message");
        maxLogger.info("Limited message");
        maxLogger.info("Limited message"); // should not log

        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Limited message"));

        // maxUses per log option overrides global
        maxLogger.info("Single use message", { maxUses: 1 });
        maxLogger.info("Single use message", { maxUses: 1 }); // should not log

        expect(consoleSpy).toHaveBeenCalledTimes(3);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Single use message"));
    });
});
