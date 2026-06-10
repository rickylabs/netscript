/**
 * Polling Watch Strategy
 *
 * Stat-based polling fallback for environments where native file watching is unreliable,
 * such as network drives (SMB/CIFS/NFS), Docker volumes, or WSL cross-filesystem mounts.
 *
 * Periodically walks the watch directories using {@linkcode walk} from `@std/fs`
 * and compares against a snapshot of previously seen files to detect changes.
 *
 * @module
 */

import { delay } from '@std/async';
import { walk } from '@std/fs';
import { globToRegExp } from '@std/path';
import type { EventKind, FileInfo, WatchEvent, WatchStrategyHandler } from '../types.ts';
import { AccessFailureTracker, safeStat } from '../fs.ts';

/** Snapshot entry for a single file's last-seen state. */
interface FileSnapshot {
  readonly size: number;
  readonly mtime: number;
}

/** Options for creating a {@linkcode PollingStrategy}. */
export interface PollingStrategyOptions {
  /** Directories to watch. */
  readonly paths: readonly string[];
  /** Glob patterns for filtering files. @default ['*'] */
  readonly patterns?: readonly string[];
  /** Which event kinds to yield. @default ['create'] */
  readonly events?: readonly EventKind[];
  /** Poll interval in milliseconds (minimum 500). @default 5000 */
  readonly pollIntervalMs?: number;
  /**
   * Number of consecutive poll failures per directory before throwing.
   * Prevents silent infinite loops when access is permanently denied.
   * @default 3
   */
  readonly maxConsecutiveFailures?: number;
  /** Abort signal for graceful shutdown. */
  readonly signal?: AbortSignal;
}

/**
 * Watch strategy that uses periodic `stat()` polling via `@std/fs/walk`.
 *
 * @example
 * ```ts
 * import { createWatcher } from '@netscript/watchers';
 *
 * const strategy = new PollingStrategy({
 *   paths: ['//fileserver/share/incoming'],
 *   patterns: ['*.csv'],
 *   pollIntervalMs: 3000,
 * });
 * for await (const event of strategy.watch()) {
 *   console.log(event.kind, event.path);
 * }
 * ```
 */
/** @internal Prefer `createWatcher({ forcePolling: true })` from the root module. */
export class PollingStrategy implements WatchStrategyHandler {
  private readonly paths: readonly string[];
  private readonly matchers: RegExp[];
  private readonly allowedEvents: ReadonlySet<EventKind>;
  private readonly pollIntervalMs: number;
  private readonly signal?: AbortSignal;
  private readonly snapshot = new Map<string, FileSnapshot>();
  private readonly failureTracker: AccessFailureTracker;

  constructor(options: PollingStrategyOptions) {
    this.paths = options.paths;
    this.allowedEvents = new Set(options.events ?? ['create']);
    this.pollIntervalMs = Math.max(options.pollIntervalMs ?? 5000, 500);
    this.signal = options.signal;

    this.failureTracker = new AccessFailureTracker({
      maxConsecutiveFailures: options.maxConsecutiveFailures ?? 3,
      onPersistentFailure: (path, count) => {
        console.error(
          `[watchers] Directory permanently inaccessible after ${count} consecutive failures: ${path}`,
        );
      },
    });

    const patterns = options.patterns ?? ['*'];
    const caseInsensitive = Deno.build.os === 'windows';
    this.matchers = patterns.map((p) =>
      globToRegExp(p, { extended: true, globstar: true, caseInsensitive })
    );
  }

  /** Start polling and yield file events. */
  async *watch(): AsyncIterable<WatchEvent> {
    // Initial snapshot (no events emitted for the first scan)
    await this.buildSnapshot();

    while (!this.signal?.aborted) {
      await delay(this.pollIntervalMs, { signal: this.signal }).catch(() => {});
      if (this.signal?.aborted) break;

      yield* this.poll();
    }
  }

  /** Run a single poll cycle, yielding any detected changes. */
  private async *poll(): AsyncGenerator<WatchEvent> {
    const currentFiles = new Map<string, FileSnapshot>();

    for (const root of this.paths) {
      try {
        for await (
          const entry of walk(root as string, {
            includeDirs: false,
            followSymlinks: false,
          })
        ) {
          if (!this.matchesGlob(entry.name)) continue;

          const stat = await safeStat(entry.path);
          if (!stat) continue;

          const snapshot: FileSnapshot = {
            size: stat.size,
            mtime: stat.modifiedAt?.getTime() ?? 0,
          };
          currentFiles.set(entry.path, snapshot);

          const previous = this.snapshot.get(entry.path);
          if (!previous) {
            if (this.allowedEvents.has('create')) {
              yield this.createEvent(entry.path, 'create', stat);
            }
          } else if (previous.size !== snapshot.size || previous.mtime !== snapshot.mtime) {
            if (this.allowedEvents.has('modify')) {
              yield this.createEvent(entry.path, 'modify', stat);
            }
          }
        }
        this.failureTracker.recordSuccess(root as string);
      } catch (error: unknown) {
        if (
          error instanceof Deno.errors.NotFound ||
          error instanceof Deno.errors.PermissionDenied
        ) {
          const persistent = this.failureTracker.recordFailure(root as string);
          if (persistent) {
            throw new Deno.errors.PermissionDenied(
              `Polling aborted: directory permanently inaccessible: ${root}`,
            );
          }
          continue;
        }
        throw error;
      }
    }

    // Detect removals
    if (this.allowedEvents.has('remove')) {
      for (const path of this.snapshot.keys()) {
        if (!currentFiles.has(path)) {
          yield this.createEvent(path, 'remove', null);
        }
      }
    }

    // Update snapshot
    this.snapshot.clear();
    for (const [path, snap] of currentFiles) {
      this.snapshot.set(path, snap);
    }
  }

  /** Build the initial snapshot without emitting events. */
  private async buildSnapshot(): Promise<void> {
    for (const root of this.paths) {
      try {
        for await (
          const entry of walk(root as string, {
            includeDirs: false,
            followSymlinks: false,
          })
        ) {
          if (!this.matchesGlob(entry.name)) continue;

          const stat = await safeStat(entry.path);
          if (!stat) continue;

          this.snapshot.set(entry.path, {
            size: stat.size,
            mtime: stat.modifiedAt?.getTime() ?? 0,
          });
        }
      } catch (error: unknown) {
        // Directory may not exist yet — will be picked up on next poll
        if (
          error instanceof Deno.errors.NotFound ||
          error instanceof Deno.errors.PermissionDenied
        ) {
          this.failureTracker.recordFailure(root as string);
          continue;
        }
        throw error;
      }
    }
  }

  /** Check if a filename matches any of the configured glob patterns. */
  private matchesGlob(filename: string): boolean {
    return this.matchers.some((re) => re.test(filename));
  }

  /** Create a {@linkcode WatchEvent} from a path and kind. */
  private createEvent(path: string, kind: EventKind, fileInfo: FileInfo | null): WatchEvent {
    return { path, kind, contentHash: null, fileInfo, timestamp: new Date() };
  }
}
