/**
 * Event queue behind `RedisKvAdapter.watch()`.
 *
 * The pub/sub handler pushes events at any time, including while the
 * consumer is between batches. A batch request drains what is already queued
 * before it waits, and the optional debounce window belongs to the request
 * that opened it, so no event is held back for a later message or dropped by
 * a timer of an earlier batch.
 *
 * @module
 */

import { delay } from '@std/async';

/**
 * Single-consumer queue that hands out events in batches.
 */
export class WatchBatchQueue<T> {
  #events: T[] = [];
  #wake: (() => void) | null = null;

  /**
   * Queue one event and wake a waiting batch request.
   *
   * @param event - Event to queue.
   */
  push(event: T): void {
    this.#events.push(event);
    const wake = this.#wake;
    this.#wake = null;
    wake?.();
  }

  /**
   * Take the next batch.
   *
   * Returns immediately when events are already queued; otherwise waits for
   * the first one. With `debounceMs`, events arriving within that window after
   * the first are coalesced into the same batch.
   *
   * @param debounceMs - Coalescing window in milliseconds.
   * @param signal - Aborting ends a pending wait or debounce window at once.
   * @returns Every queued event, oldest first; empty when aborted.
   */
  async next(debounceMs?: number, signal?: AbortSignal): Promise<T[]> {
    if (this.#events.length === 0) {
      await this.#arrival(signal);
    }
    if (debounceMs && this.#events.length > 0 && !signal?.aborted) {
      await delay(debounceMs, { signal }).catch((error: unknown) => {
        // Aborted mid-window: the stream is ending, not failing.
        if (!signal?.aborted) throw error;
      });
    }
    return signal?.aborted ? [] : this.#events.splice(0);
  }

  #arrival(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const onAbort = (): void => {
        this.#wake = null;
        resolve();
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      this.#wake = () => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      };
    });
  }
}
