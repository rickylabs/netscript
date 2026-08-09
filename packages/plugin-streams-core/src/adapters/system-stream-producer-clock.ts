import type { StreamProducerClockPort } from '../ports/stream-producer-clock-port.ts';

/** System timer adapter used by producer backoff. */
export class SystemStreamProducerClock implements StreamProducerClockPort {
  /** Sleep until the delay elapses or the signal aborts. */
  sleep(delayMs: number, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<void> {
    if (options.signal?.aborted) {
      return Promise.reject(options.signal.reason ?? new DOMException('Aborted', 'AbortError'));
    }
    return new Promise((resolve, reject) => {
      const signal = options.signal;
      const finish = (): void => {
        signal?.removeEventListener('abort', abort);
        resolve();
      };
      const timer = setTimeout(finish, delayMs);
      const abort = (): void => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
      };
      signal?.addEventListener('abort', abort, { once: true });
    });
  }
}
