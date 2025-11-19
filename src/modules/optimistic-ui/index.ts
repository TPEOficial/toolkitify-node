export const useOptimistic = {
    async promise<T>(
        fn: () => Promise<T>,
        {
            optimisticUpdate,
            rollback,
            onSuccess,
            onLoading,
        }: {
            optimisticUpdate?: () => void;
            rollback?: (error: unknown) => void;
            onSuccess?: (result: T) => void;
            onLoading?: () => void;
        }
    ): Promise<void> {
        try {
            optimisticUpdate?.();
            onLoading?.();
            const result = await fn();
            onSuccess?.(result);
        } catch (error) {
            rollback?.(error);
            console.error("[Toolkitify] Optimistic action failed:", error);
        }
    },
    sync<T>(
        fn: () => T,
        {
            optimisticUpdate,
            rollback,
            onSuccess,
        }: {
            optimisticUpdate?: () => void;
            rollback?: (error: unknown) => void;
            onSuccess?: (result: T) => void;
        }
    ): void {
        try {
            optimisticUpdate?.();
            const result = fn();
            onSuccess?.(result);
        } catch (error) {
            rollback?.(error);
            console.error("[Toolkitify] Optimistic sync action failed:", error);
        }
    }
};