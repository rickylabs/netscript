import { delay } from '@std/async';

/** Keep terminal migration independent of foreground runtime availability. */
export async function runSagaRetentionCleanup(
  store: Readonly<{ cleanupRetention(): Promise<boolean> }>,
  signal: AbortSignal,
  sleep: (ms: number, signal: AbortSignal) => Promise<void> = (ms, signal) => delay(ms, { signal }),
  warn: (message: string, retryInMs: number) => void = (message, retryInMs) =>
    console.warn('[Sagas Retention] Sweep failed; retrying.', { message, retryInMs }),
): Promise<void> {
  let idleMs = 100;
  let failureMs = 100;
  while (!signal.aborted) {
    let waitMs: number;
    try {
      const backlog = await store.cleanupRetention();
      if (signal.aborted) return;
      failureMs = 100;
      if (backlog) {
        idleMs = 100;
        continue;
      }
      waitMs = idleMs;
      idleMs = Math.min(idleMs * 2, 30_000);
    } catch (cause) {
      if (signal.aborted) return;
      waitMs = failureMs;
      failureMs = Math.min(failureMs * 2, 30_000);
      warn(cause instanceof Error ? cause.message : String(cause), waitMs);
    }
    try {
      await sleep(waitMs, signal);
    } catch (cause) {
      if (!signal.aborted) throw cause;
    }
  }
}
