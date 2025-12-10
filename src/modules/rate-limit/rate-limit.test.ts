import { RateLimiter } from "./index";

describe("RateLimiter", () => {
    describe("blockDuration", () => {
        it("should block for blockDuration (1 minute) when limit is reached, not interval (10s)", async () => {
            const limiter = new RateLimiter();

            const options = {
                key: "test-block-duration",
                limit: 5,
                interval: 10000, // 10 seconds
                blockDuration: 60000, // 1 minute
                storage: "memory" as const
            };

            // Hacer 5 llamadas para alcanzar el límite
            for (let i = 0; i < 5; i++) {
                const result = await limiter.check(options);
                expect(result.success).toBe(true);
                expect(result.remaining).toBe(4 - i);
            }

            // La 6ta llamada debe estar bloqueada
            const blockedResult = await limiter.check(options);
            expect(blockedResult.success).toBe(false);
            expect(blockedResult.remaining).toBe(0);

            // El reset debe ser aproximadamente 1 minuto en el futuro, no 10 segundos
            const now = Date.now();
            const timeUntilReset = blockedResult.reset - now;

            // Debe ser mayor a 50 segundos (dando margen por tiempo de ejecución)
            expect(timeUntilReset).toBeGreaterThan(50000);
            // Y menor o igual a 60 segundos
            expect(timeUntilReset).toBeLessThanOrEqual(60000);

            console.log(`Time until reset: ${timeUntilReset}ms (should be ~60000ms)`);
        });

        it("should use interval as blockDuration when blockDuration is not specified", async () => {
            const limiter = new RateLimiter();

            const options = {
                key: "test-no-block-duration",
                limit: 3,
                interval: 5000, // 5 seconds
                storage: "memory" as const
            };

            // Hacer 3 llamadas para alcanzar el límite
            for (let i = 0; i < 3; i++) {
                await limiter.check(options);
            }

            // La 4ta llamada debe estar bloqueada
            const blockedResult = await limiter.check(options);
            expect(blockedResult.success).toBe(false);

            // El reset debe ser aproximadamente 5 segundos (el interval)
            const now = Date.now();
            const timeUntilReset = blockedResult.reset - now;

            expect(timeUntilReset).toBeGreaterThan(4000);
            expect(timeUntilReset).toBeLessThanOrEqual(5000);

            console.log(`Time until reset: ${timeUntilReset}ms (should be ~5000ms)`);
        });

        it("should remain blocked for the full blockDuration on subsequent calls", async () => {
            const limiter = new RateLimiter();

            const options = {
                key: "test-remain-blocked",
                limit: 2,
                interval: 1000, // 1 second
                blockDuration: 10000, // 10 seconds
                storage: "memory" as const
            };

            // Alcanzar el límite
            await limiter.check(options);
            await limiter.check(options);

            // Primera llamada bloqueada
            const firstBlocked = await limiter.check(options);
            expect(firstBlocked.success).toBe(false);
            const firstResetAt = firstBlocked.reset;

            // Esperar un poco
            await new Promise(resolve => setTimeout(resolve, 100));

            // Segunda llamada bloqueada - debe tener el mismo resetAt (no reiniciar el timer)
            const secondBlocked = await limiter.check(options);
            expect(secondBlocked.success).toBe(false);

            // El resetAt no debe haber cambiado (no debe reiniciar el bloqueo)
            expect(secondBlocked.reset).toBe(firstResetAt);

            console.log(`First reset: ${firstResetAt}, Second reset: ${secondBlocked.reset}`);
        });
    });
});
