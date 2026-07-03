import type { McpBackoffConfig } from '../../ports/mcp-transport.ts';

const DEFAULT_INITIAL_DELAY_MS = 100;
const DEFAULT_MAX_DELAY_MS = 5_000;
const DEFAULT_FACTOR = 2;
const DEFAULT_MAX_ATTEMPTS = 5;

/** Resolve a retry delay for a one-based reconnect attempt. */
export function retryDelayMs(config: McpBackoffConfig | undefined, attempt: number): number {
  const initial = config?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const max = config?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const factor = config?.factor ?? DEFAULT_FACTOR;
  return Math.min(max, initial * factor ** Math.max(0, attempt - 1));
}

/** Resolve the maximum reconnect attempts. */
export function maxReconnectAttempts(config: McpBackoffConfig | undefined): number {
  return config?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
}

/** Wait for the given delay while respecting cancellation. */
export function abortableDelay(delayMs: number, signal: AbortSignal): Promise<void> {
  if (delayMs <= 0) {
    signal.throwIfAborted();
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(done, delayMs);
    function done(): void {
      signal.removeEventListener('abort', aborted);
      resolve();
    }
    function aborted(): void {
      clearTimeout(timeout);
      signal.removeEventListener('abort', aborted);
      reject(signal.reason);
    }
    signal.addEventListener('abort', aborted, { once: true });
    if (signal.aborted) {
      aborted();
    }
  });
}
