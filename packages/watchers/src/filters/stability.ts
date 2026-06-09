/**
 * Stability Filter
 *
 * Ensures files are fully written before emitting events. Critical for SFTP/SCP
 * transfers where files arrive incrementally over seconds or minutes.
 *
 * Repeatedly stats the file at configurable intervals. Only emits once the
 * file size remains unchanged for a consecutive number of checks.
 *
 * Uses {@linkcode delay} from `@std/async` for interruptible waiting.
 *
 * @module
 */

import { delay } from '@std/async';
import type { StabilityOptions, WatchEvent, WatchFilter } from '../types.ts';
import { safeStat } from '../fs.ts';

/** Resolved stability options with defaults applied. */
interface ResolvedStabilityOptions {
  readonly checkIntervalMs: number;
  readonly stableChecks: number;
}

const DEFAULTS: ResolvedStabilityOptions = {
  checkIntervalMs: 1000,
  stableChecks: 3,
};

/**
 * Filter that waits for file writes to complete before yielding events.
 *
 * When a file event arrives, the filter repeatedly stats the file. Once
 * the file size stops changing for {@linkcode StabilityOptions.stableChecks}
 * consecutive checks, the event is yielded with updated file info.
 *
 * @example
 * ```ts
 * import { StabilityFilter } from '@netscript/watchers';
 *
 * const filter = new StabilityFilter({
 *   checkIntervalMs: 2000,
 *   stableChecks: 3,
 * });
 * ```
 */
export class StabilityFilter implements WatchFilter {
  private readonly options: ResolvedStabilityOptions;
  private readonly signal?: AbortSignal;

  /**
   * Create a stability filter.
   *
   * @param options - Optional stability threshold settings.
   * @param signal - Optional abort signal used while waiting.
   */
  constructor(options?: StabilityOptions, signal?: AbortSignal) {
    this.options = {
      checkIntervalMs: options?.checkIntervalMs ?? DEFAULTS.checkIntervalMs,
      stableChecks: options?.stableChecks ?? DEFAULTS.stableChecks,
    };
    this.signal = signal;
  }

  /** Apply the stability filter to an event stream. */
  async *apply(events: AsyncIterable<WatchEvent>): AsyncIterable<WatchEvent> {
    for await (const event of events) {
      // Remove events have no file to check stability for
      if (event.kind === 'remove') {
        yield event;
        continue;
      }

      const stableInfo = await this.waitForStability(event.path);
      if (!stableInfo) continue; // File disappeared or abort signaled

      yield {
        ...event,
        fileInfo: stableInfo,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Wait for a file to stop growing.
   *
   * @param filePath - Absolute path to the file to monitor.
   * @returns Updated file info once stable, or `null` if the file
   *          was removed or the abort signal fired.
   */
  async waitForStability(filePath: string): Promise<WatchEvent['fileInfo']> {
    let lastSize = -1;
    let stableCount = 0;

    while (stableCount < this.options.stableChecks) {
      if (this.signal?.aborted) return null;

      const info = await safeStat(filePath);
      if (!info) return null; // File removed or inaccessible

      if (info.size === lastSize) {
        stableCount++;
      } else {
        stableCount = 0;
        lastSize = info.size;
      }

      if (stableCount < this.options.stableChecks) {
        await delay(this.options.checkIntervalMs, { signal: this.signal }).catch(() => {});
      }
    }

    // Return final file info (one last stat to confirm)
    return await safeStat(filePath);
  }
}
