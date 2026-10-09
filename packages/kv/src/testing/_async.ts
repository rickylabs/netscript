/**
 * Bounded-wait helpers shared by the KV contract harnesses.
 *
 * @module
 */

/**
 * Time allowed for a write to reach an already-subscribed watcher.
 *
 * Covers the pub/sub hop of networked adapters; in-process adapters deliver
 * synchronously and are unaffected by the margin.
 */
export const DELIVERY_SETTLE_MS = 100;

/**
 * Upper bound for a single expected watch delivery before the contract fails.
 */
export const DELIVERY_TIMEOUT_MS = 2_000;

/**
 * Resolve after `ms` milliseconds.
 *
 * @param ms - Delay in milliseconds.
 * @returns A promise that resolves once the delay elapses.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Race an operation against a deadline and reject when the deadline wins.
 *
 * @param operation - Operation to await.
 * @param timeoutMs - Deadline in milliseconds.
 * @param label - Description used in the timeout error.
 * @returns The operation result.
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`${label} did not complete within ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([operation, deadline]);
  } finally {
    clearTimeout(timeout);
  }
}
