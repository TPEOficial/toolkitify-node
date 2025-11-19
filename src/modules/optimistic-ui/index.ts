export const useOptimistic = {
    async promise<T>(
        fn: () => Promise<T>,
        {
            optimisticUpdate,
            rollback,
            onSuccess,
            onLoading,
            finally: finallyFunc
        }: {
            optimisticUpdate?: () => void;
            rollback?: (error: unknown) => void;
            onSuccess?: (result: T) => void;
            onLoading?: () => void;
            finally?: () => void;
        }
    ): Promise<void> {
        try {
            optimisticUpdate?.();
            onLoading?.();
            const result = await fn();
            onSuccess?.(result);
            finallyFunc?.();
        } catch (error) {
            rollback?.(error);
            finallyFunc?.();
            console.error("[Toolkitify] Optimistic action failed:", error);
        } finally {
            finallyFunc?.();
        }
    },
    sync<T>(
        fn: () => T,
        {
            optimisticUpdate,
            rollback,
            onSuccess,
            finally: finallyFunc
        }: {
            optimisticUpdate?: () => void;
            rollback?: (error: unknown) => void;
            onSuccess?: (result: T) => void;
            finally?: () => void;
        }
    ): void {
        try {
            optimisticUpdate?.();
            const result = fn();
            onSuccess?.(result);
        } catch (error) {
            rollback?.(error);
            console.error("[Toolkitify] Optimistic sync action failed:", error);
        } finally {
            finallyFunc?.();
        }
    }
};