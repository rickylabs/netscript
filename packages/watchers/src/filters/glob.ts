/**
 * Glob Filter
 *
 * Filters watch events by matching filenames against glob patterns
 * using {@linkcode globToRegExp} from `@std/path`.
 *
 * Case sensitivity is automatically adjusted for Windows.
 *
 * @module
 */

import { basename, globToRegExp } from '@std/path';
import type { WatchEvent, WatchFilter } from '../types.ts';

/**
 * Filter that yields only events whose filenames match at least one glob pattern.
 *
 * @example
 * ```ts
 * import { GlobFilter } from '@netscript/watchers';
 *
 * const filter = new GlobFilter(['*.csv', 'sales_*.xlsx']);
 * // Only events for .csv files and sales_*.xlsx will pass through.
 * ```
 */
export class GlobFilter implements WatchFilter {
  private readonly regexps: RegExp[];

  /**
   * Create a glob filter from filename patterns.
   *
   * @param patterns - Glob patterns to match against filenames.
   *                   Examples: `'*.csv'`, `'sales_*.xlsx'`, `'**\/*.json'`
   */
  constructor(patterns: readonly string[]) {
    const caseInsensitive = Deno.build.os === 'windows';
    this.regexps = patterns.map((p) =>
      globToRegExp(p, { extended: true, globstar: true, caseInsensitive })
    );
  }

  /** Apply the glob filter to an event stream. */
  async *apply(events: AsyncIterable<WatchEvent>): AsyncIterable<WatchEvent> {
    for await (const event of events) {
      // Remove events should always pass through (the file is already gone)
      if (event.kind === 'remove' || this.matches(event.path)) {
        yield event;
      }
    }
  }

  /** Check if a file path matches any of the configured glob patterns. */
  matches(filePath: string): boolean {
    const filename = basename(filePath);
    return this.regexps.some((re) => re.test(filename));
  }
}
