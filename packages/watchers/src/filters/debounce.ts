/**
 * Debounce Filter
 *
 * Collapses rapid successive events for the same file path within a
 * configurable time window (`debounceMs`).
 *
 * When multiple events arrive for the same path within `debounceMs`,
 * intermediate events are suppressed and only the latest event for that
 * path is yielded once the quiet period elapses.
 *
 * @module
 */

import type { WatchEvent, WatchFilter } from '../types.ts';

/** Options for creating a {@linkcode DebounceFilter}. */
export interface DebounceFilterOptions {
  /** Debounce window in milliseconds per file path. */
  readonly debounceMs: number;
}

/**
 * Filter that suppresses rapid successive events for the same file path.
 *
 * @example
 * ```ts
 * import { DebounceFilter } from '@netscript/watchers';
 *
 * const filter = new DebounceFilter({ debounceMs: 500 });
 * ```
 */
export class DebounceFilter implements WatchFilter {
  private readonly debounceMs: number;
  private readonly signal?: AbortSignal;

  /**
   * Create a debounce filter.
   *
   * @param options - Debounce configuration object or duration in milliseconds.
   * @param signal - Optional abort signal for clean shutdown.
   */
  constructor(options: DebounceFilterOptions | number, signal?: AbortSignal) {
    this.debounceMs = typeof options === 'number' ? options : options.debounceMs;
    this.signal = signal;
  }

  /** Apply the debounce filter to an event stream. */
  async *apply(events: AsyncIterable<WatchEvent>): AsyncIterable<WatchEvent> {
    if (this.debounceMs <= 0) {
      for await (const event of events) {
        yield event;
      }
      return;
    }

    const queue: WatchEvent[] = [];
    let resolveNext: (() => void) | null = null;
    let upstreamDone = false;
    let upstreamError: unknown = null;

    const pending = new Map<string, { timer: number; event: WatchEvent }>();

    const notifyNext = () => {
      if (resolveNext) {
        const fn = resolveNext;
        resolveNext = null;
        fn();
      }
    };

    const pushToQueue = (evt: WatchEvent) => {
      queue.push(evt);
      notifyNext();
    };

    const clearAllTimers = () => {
      for (const entry of pending.values()) {
        clearTimeout(entry.timer);
      }
      pending.clear();
    };

    if (this.signal) {
      if (this.signal.aborted) {
        return;
      }
      const onAbort = () => {
        clearAllTimers();
        notifyNext();
      };
      this.signal.addEventListener('abort', onAbort, { once: true });
    }

    // Process upstream events in the background
    (async () => {
      try {
        for await (const event of events) {
          if (this.signal?.aborted) break;

          const existing = pending.get(event.path);
          if (existing) {
            clearTimeout(existing.timer);
          }

          const timer = setTimeout(() => {
            pending.delete(event.path);
            pushToQueue(event);
          }, this.debounceMs);

          pending.set(event.path, { timer, event });
        }
      } catch (err) {
        upstreamError = err;
      } finally {
        upstreamDone = true;
        if (!this.signal?.aborted) {
          for (const [_path, entry] of pending) {
            clearTimeout(entry.timer);
            pushToQueue(entry.event);
          }
          pending.clear();
        } else {
          clearAllTimers();
        }
        notifyNext();
      }
    })();

    try {
      while (true) {
        if (this.signal?.aborted) {
          clearAllTimers();
          break;
        }

        if (queue.length > 0) {
          yield queue.shift()!;
          continue;
        }

        if (upstreamDone) {
          if (upstreamError) {
            throw upstreamError;
          }
          if (queue.length > 0) {
            yield queue.shift()!;
            continue;
          }
          break;
        }

        await new Promise<void>((res) => {
          resolveNext = res;
        });
      }
    } finally {
      clearAllTimers();
    }
  }
}
