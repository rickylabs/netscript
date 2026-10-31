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
  /** Called after the native watch is open. */
  readonly onReady?: () => void | Promise<void>;
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
  private readonly onReady?: () => void | Promise<void>;

  constructor(options: NativeStrategyOptions) {
    this.paths = options.paths;
    this.allowedEvents = new Set(options.events ?? ['create']);
    this.signal = options.signal;
    this.onReady = options.onReady;
  }

  /** Start watching and yield file events. */
  async *watch(): AsyncIterable<WatchEvent> {
    if (this.signal?.aborted) return;
    const watcher = Deno.watchFs([...this.paths], { recursive: true });

    const close = () => watcher.close();
    this.signal?.addEventListener('abort', close, { once: true });

    try {
      await this.onReady?.();
      for await (const event of this.mapEvents(watcher)) {
        yield event;
      }
    } catch (error: unknown) {
      if (this.signal?.aborted) {
        return; // Clean shutdown
      }
      throw error;
    } finally {
      this.signal?.removeEventListener('abort', close);
      watcher.close();
    }
  }

  /** Map raw `Deno.FsEvent` to {@linkcode WatchEvent}, filtering by allowed kinds. */
  private async *mapEvents(
    watcher: Deno.FsWatcher,
  ): AsyncGenerator<WatchEvent> {
    try {
      for await (const fsEvent of watcher) {
        // Losing a root invalidates its OS watch even if the directory is recreated immediately.
        if (fsEvent.kind === 'remove' && fsEvent.paths.some((path) => this.paths.includes(path))) {
          throw new Deno.errors.NotFound('A watched root was removed.');
        }
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
