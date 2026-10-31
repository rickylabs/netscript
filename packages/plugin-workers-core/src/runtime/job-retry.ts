import { jobRetryDelay, type JobRetryPolicy } from '../domain/job-retry-policy.ts';
import type { JobRunnerClock } from '../ports/job-runner-clock.ts';
import { WebPlatformJobRunnerClock } from '../adapters/web-platform-job-runner-clock.ts';

/** Execute one initial job attempt and its bounded, cancellable retries. */
export async function executeJobWithRetry<T extends { readonly success: boolean }>(
  execute: () => Promise<T>,
  policy: JobRetryPolicy,
  options: Readonly<{
    signal: AbortSignal;
    clock?: JobRunnerClock;
    /** Observe an attempt immediately before its handler is invoked. */
    onAttempt?: (attempt: number) => void;
  }>,
): Promise<T & { readonly attempts: number }> {
  const clock = options.clock ?? new WebPlatformJobRunnerClock();
  for (let attempt = 0;; attempt++) {
    options.signal.throwIfAborted();
    try {
      options.onAttempt?.(attempt + 1);
      const result = await execute();
      options.signal.throwIfAborted();
      if (result.success || attempt === policy.maxRetries) {
        return { ...result, attempts: attempt + 1 };
      }
    } catch (error) {
      options.signal.throwIfAborted();
      if (isJobAbort(error) || attempt === policy.maxRetries) throw error;
    }
    await waitForRetry(clock, jobRetryDelay(policy, attempt + 1), options.signal);
  }
}

/** Recognize terminal timeout, shutdown and explicit cancellation causes. */
export function isJobAbort(error: unknown): boolean {
  return error instanceof Error &&
    ['TimeoutError', 'ShutdownError', 'AbortError'].includes(error.name);
}

function waitForRetry(clock: JobRunnerClock, delayMs: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const onAbort = (): void => {
      dispose();
      signal.removeEventListener('abort', onAbort);
      reject(signal.reason);
    };
    const dispose = clock.schedule(delayMs, () => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    });
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
}
