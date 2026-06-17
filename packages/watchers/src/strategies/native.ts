/**
 * Native Watch Strategy
 *
 * Wraps `Deno.watchFs()` as an async iterable of {@linkcode WatchEvent}.
 * Uses OS-level file system notifications (inotify/FSEvents/ReadDirectoryChangesW)
 * for near-instant detection with minimal CPU overhead.
 *
 * **Limitation:** Does not work reliably on network drives (SMB/CIFS/NFS).
 * Use {@linkcode PollingStrategy} or set `forcePolling: true` for those paths.
 *
 * @module
 */

import { abortable } from '@std/async';
import type { EventKind, WatchEvent, WatchStrategyHandler } from '../types.ts';
import { safeStat } from '../fs.ts';

/** Maps `Deno.FsEvent.kind` to our simplified {@linkcode EventKind}. */
const EVENT_KIND_MAP: Record<string, EventKind | null> = {
  create: 'create',
  modify: 'modify',
  remove: 'remove',
  access: null,
  other: null,
};

/** Options for creating a {@linkcode NativeStrategy}. */
export interface NativeStrategyOptions {
  /** Directories to watch recursively. */
  readonly paths: readonly string[];
  /** Which event kinds to yield. @default ['create'] */
  readonly events?: readonly EventKind[];
  /** Abort signal for graceful shutdown. */
  readonly signal?: AbortSignal;
}

/**
 * Watch strategy that uses `Deno.watchFs()` for OS-level file notifications.
 *
 * @example
 * ```ts
 * import { createWatcher } from '@netscript/watchers';
 *
 * const strategy = new NativeStrategy({ paths: ['./incoming'] });
 * for await (const event of strategy.watch()) {
 *   console.log(event.kind, event.path);
 * }
 * ```
 */
/** @internal Prefer `createWatcher({ forcePolling: false })` from the root module. */
export class NativeStrategy implements WatchStrategyHandler {
  private readonly paths: readonly string[];
  private readonly allowedEvents: ReadonlySet<EventKind>;
  private readonly signal?: AbortSignal;

  constructor(options: NativeStrategyOptions) {
    this.paths = options.paths;
    this.allowedEvents = new Set(options.events ?? ['create']);
    this.signal = options.signal;
  }

  /** Start watching and yield file events. */
  async *watch(): AsyncIterable<WatchEvent> {
    const watcher = Deno.watchFs(this.paths as string[], { recursive: true });

    const source = this.mapEvents(watcher);
    const stream = this.signal ? abortable(source, this.signal) : source;

    try {
      for await (const event of stream) {
        yield event;
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return; // Clean shutdown
      }
      throw error;
    }
  }

  /** Map raw `Deno.FsEvent` to {@linkcode WatchEvent}, filtering by allowed kinds. */
  private async *mapEvents(
    watcher: Deno.FsWatcher,
  ): AsyncGenerator<WatchEvent> {
    try {
      for await (const fsEvent of watcher) {
        const kind = EVENT_KIND_MAP[fsEvent.kind];
        if (!kind || !this.allowedEvents.has(kind)) continue;

        for (const path of fsEvent.paths) {
          const fileInfo = kind !== 'remove' ? await safeStat(path) : null;

          // Skip directories — we only care about files
          if (fileInfo && !fileInfo.isFile) continue;

          yield {
            path,
            kind,
            contentHash: null, // Hashing is handled by the FileWatcher pipeline
            fileInfo,
            timestamp: new Date(),
          };
        }
      }
    } finally {
      watcher.close();
    }
  }
}
