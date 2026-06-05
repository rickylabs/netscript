/**
 * Deduplication Filter
 *
 * Skips events for files whose content has already been processed,
 * using SHA-256 content hashing via `crypto.subtle.digest()`.
 *
 * Uses an in-memory `Map` with time-based eviction for hash tracking.
 * For cross-restart deduplication, the trigger-level middleware uses KV persistence.
 *
 * @module
 */

import type { WatchEvent, WatchFilter } from '../types.ts';
import { safeReadFile } from '../fs.ts';

/**
 * Compute a SHA-256 hex digest of a file's content.
 *
 * Reads the full file via `Deno.readFile()` and hashes with `crypto.subtle`.
 *
 * @param filePath - Absolute path to the file.
 * @returns Hex-encoded SHA-256 hash string, or `null` if the file is missing/inaccessible.
 */
export async function computeContentHash(filePath: string): Promise<string | null> {
  const content = await safeReadFile(filePath);
  if (!content) return null;

  const hashBuffer = await crypto.subtle.digest('SHA-256', content);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Options for creating a {@linkcode DedupFilter}. */
export interface DedupFilterOptions {
  /** Deduplication window in milliseconds. Hashes older than this are evicted. @default 60000 */
  readonly windowMs?: number;
}

/**
 * Filter that skips events for files with previously-seen content hashes.
 *
 * Uses an in-memory {@linkcode Map} for hash tracking with time-based eviction.
 * For cross-restart deduplication, the trigger-level middleware uses KV persistence.
 *
 * @example
 * ```ts
 * import { DedupFilter } from '@netscript/watchers';
 *
 * const filter = new DedupFilter({ windowMs: 300_000 });
 * ```
 */
export class DedupFilter implements WatchFilter {
  private readonly windowMs: number;
  private readonly seen = new Map<string, number>();

  constructor(options?: DedupFilterOptions) {
    this.windowMs = options?.windowMs ?? 60_000;
  }

  /** Apply the dedup filter to an event stream. */
  async *apply(events: AsyncIterable<WatchEvent>): AsyncIterable<WatchEvent> {
    for await (const event of events) {
      // Remove events and events without hashable content pass through
      if (event.kind === 'remove') {
        yield event;
        continue;
      }

      const hash = await this.hashFile(event.path);
      if (!hash) {
        yield event;
        continue;
      }

      // Evict expired entries
      this.evictExpired();

      if (this.seen.has(hash)) {
        continue; // Duplicate — skip
      }

      this.seen.set(hash, Date.now());

      yield {
        ...event,
        contentHash: hash,
      };
    }
  }

  /** Compute content hash, returning null if file was removed or is inaccessible. */
  private hashFile(filePath: string): Promise<string | null> {
    return computeContentHash(filePath);
  }

  /** Remove entries older than the dedup window. */
  private evictExpired(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [hash, timestamp] of this.seen) {
      if (timestamp < cutoff) {
        this.seen.delete(hash);
      }
    }
  }

  /** Clear all tracked hashes. */
  clear(): void {
    this.seen.clear();
  }
}
