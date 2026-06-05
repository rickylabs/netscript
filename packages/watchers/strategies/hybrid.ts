/**
 * Hybrid Watch Strategy
 *
 * Starts with the {@linkcode NativeStrategy} for fast, OS-level detection.
 * If the native watcher throws an error (e.g. on network paths), falls back
 * to the {@linkcode PollingStrategy} with a warning log.
 *
 * This is the default strategy when `forcePolling` is `false` and no network
 * paths are detected.
 *
 * @module
 */

import type { EventKind, WatchEvent, WatchStrategyHandler } from '../types.ts';
import { NativeStrategy } from './native.ts';
import { PollingStrategy } from './polling.ts';

/** Options for creating a {@linkcode HybridStrategy}. */
export interface HybridStrategyOptions {
  /** Directories to watch. */
  readonly paths: readonly string[];
  /** Glob patterns for filtering files. @default ['*'] */
  readonly patterns?: readonly string[];
  /** Which event kinds to yield. @default ['create'] */
  readonly events?: readonly EventKind[];
  /** Polling interval fallback in milliseconds. @default 5000 */
  readonly pollIntervalMs?: number;
  /** Abort signal for graceful shutdown. */
  readonly signal?: AbortSignal;
}

/**
 * Watch strategy that tries native OS watching first, falling back to polling on error.
 *
 * Once a fallback occurs, the strategy does **not** switch back to native
 * (requires a restart). This prevents flapping between strategies.
 *
 * @example
 * ```ts
 * import { createWatcher } from '@netscript/watchers';
 *
 * const strategy = new HybridStrategy({
 *   paths: ['./data/incoming'],
 *   patterns: ['*.csv'],
 * });
 * for await (const event of strategy.watch()) {
 *   console.log(event.kind, event.path);
 * }
 * ```
 */
/** @internal Prefer `createWatcher()` from the root module. */
export class HybridStrategy implements WatchStrategyHandler {
  private readonly options: HybridStrategyOptions;

  constructor(options: HybridStrategyOptions) {
    this.options = options;
  }

  /** Start watching with native strategy, falling back to polling on error. */
  async *watch(): AsyncIterable<WatchEvent> {
    const native = new NativeStrategy({
      paths: this.options.paths,
      events: this.options.events,
      signal: this.options.signal,
    });

    try {
      for await (const event of native.watch()) {
        yield event;
      }
    } catch (error: unknown) {
      // AbortError is a clean shutdown — don't fall back
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      console.warn(
        `[watchers] Native strategy failed, falling back to polling:`,
        error instanceof Error ? error.message : error,
      );

      const polling = new PollingStrategy({
        paths: this.options.paths,
        patterns: this.options.patterns,
        events: this.options.events,
        pollIntervalMs: this.options.pollIntervalMs,
        signal: this.options.signal,
      });

      yield* polling.watch();
    }
  }
}
