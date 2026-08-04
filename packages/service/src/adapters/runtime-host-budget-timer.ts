/** Budget handle returned by the runtime-host timer adapter. */
export type RuntimeHostBudget = Readonly<{
  /** Resolves when the shared shutdown budget expires. */
  expired: Promise<void>;
  /** Cancels the pending timer after shutdown completes early. */
  cancel(): void;
}>;

/** Timer port consumed by the app-wide runtime host. */
export type RuntimeHostBudgetTimer = Readonly<{
  /** Starts one timer for the complete shutdown operation. */
  start(timeoutMs: number): RuntimeHostBudget;
}>;

/** System timer used by the public runtime-host composition root. */
export const systemRuntimeHostBudgetTimer: RuntimeHostBudgetTimer = Object.freeze({
  start(timeoutMs: number): RuntimeHostBudget {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const expired = new Promise<void>((resolve) => {
      timer = setTimeout(resolve, timeoutMs);
    });

    return Object.freeze({
      expired,
      cancel(): void {
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
    });
  },
});
