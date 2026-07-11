/** Wait for a delay while rejecting promptly when `signal` aborts. */
export function abortableDelay(delayMs: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  if (delayMs <= 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(done, delayMs);
    function cleanup(): void {
      signal.removeEventListener('abort', aborted);
    }
    function done(): void {
      cleanup();
      resolve();
    }
    function aborted(): void {
      clearTimeout(timeout);
      cleanup();
      reject(signal.reason);
    }
    signal.addEventListener('abort', aborted, { once: true });
  });
}
