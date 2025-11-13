/// <reference types="jest" />

import { useOptimistic } from "../src/modules/optimistic-ui";

describe("useOptimistic", () => {
    describe("sync", () => {
        it("applies optimistic update and success callback", () => {
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

            expect(value).toBe(3); // 0 + 1 (optimistic) + 2 (fn) = 3.
        });

        it("rolls back if sync function throws", () => {
            let value = 0;

            useOptimistic.sync(
                () => {
                    throw new Error("fail");
                },
                {
                    optimisticUpdate: () => {
                        value = 1;
                    },
                    rollback: () => {
                        value = 0;
                    },
                    onSuccess: () => {
                        value = 999;
                    }
                }
            );

            expect(value).toBe(0);
        });
    });

    describe("promise", () => {
        it("applies optimistic update, success callback on resolve", async () => {
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

            expect(value).toBe(3); // 0 + 1 (optimistic) + 2 (fn) = 3
        });

        it("rolls back if promise rejects", async () => {
            let value = 0;

            await useOptimistic.promise(
                async () => {
                    await new Promise((_, r) => setTimeout(r, 50));
                    throw new Error("fail");
                },
                {
                    optimisticUpdate: () => {
                        value = 1;
                    },
                    rollback: () => {
                        value = 0;
                    },
                    onSuccess: (result) => {
                        value = result;
                    }
                }
            );

            expect(value).toBe(0);
        });
    });
});