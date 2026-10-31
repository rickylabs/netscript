import { AsyncLocalStorage } from 'node:async_hooks';
import { delay } from '@std/async';
import { createWatcher } from '@netscript/watchers';
import type { WatcherOptions as UpstreamWatcherOptions } from '@netscript/watchers';
import type {
  FileWatchDefinition,
  FileWatchLifecycle,
  FileWatchTriggerPayload,
  TriggerEvent,
  TriggerEventId,
  TriggerId,
} from '../domain/mod.ts';
import { FILE_WATCH_STATES } from '../ports/mod.ts';
import type {
  FileWatcherHandle,
  FileWatcherPort,
  FileWatchState,
  FileWatchStatusEvent,
} from '../ports/mod.ts';

const [WATCHING, UNAVAILABLE] = FILE_WATCH_STATES;
const INITIAL_RETRY_DELAY_MS = 250;
const MAX_RETRY_DELAY_MS = 30_000;

/** Minimal file metadata emitted by a runtime watcher. */
export type RuntimeWatchFileInfo = Readonly<{
  size?: number;
  modifiedAt?: Date | null;
}>;

/** Minimal file-watch event consumed by the runtime adapter. */
export type RuntimeWatchEvent = Readonly<{
  path: string;
  kind: string;
  timestamp: Date;
  fileInfo?: RuntimeWatchFileInfo | null;
  contentHash?: string | null;
}>;

/** Minimal watcher options consumed by the runtime adapter. */
export type RuntimeWatcherOptions = Readonly<{
  paths: readonly string[];
  patterns?: readonly string[];
  events?: readonly string[];
  debounceMs?: number;
  stabilityThreshold?: Readonly<{
    checkIntervalMs?: number;
    stableChecks?: number;
    timeoutMs?: number;
  }>;
  onReady?: () => void | Promise<void>;
  signal?: AbortSignal;
}>;

/** Minimal watcher primitive consumed by the file-watch adapter. */
export type WatcherInstance = Readonly<{
  watch(): AsyncIterable<RuntimeWatchEvent>;
  stop(): void;
}>;

/** Handler invoked when a file-watch trigger observes a matching event. */
export type FileWatchHandler = (event: TriggerEvent<'file-watch'>) => Promise<void>;

/** Identifies live adapter callbacks without treating later descendants as reentrant. */
type WatchCallbackScope = { active: boolean };

type WatchersFileWatcherRecord =
  & Omit<FileWatcherHandle, 'paused'>
  & {
    paused: boolean;
    definition: FileWatchDefinition<string, never, never>;
    watcher?: WatcherInstance;
    controller: AbortController;
    ignored: readonly RegExp[];
    handler: FileWatchHandler;
    state?: FileWatchState;
    task: Promise<void>;
  };

/** Options for constructing a file-watch trigger adapter. */
export type WatchersFileWatcherAdapterOptions = Readonly<{
  now?: () => Date;
  watcherFactory?: (options: RuntimeWatcherOptions) => WatcherInstance;
  onError?: (error: unknown, handle: FileWatcherHandle) => void | Promise<void>;
  /** Observe initial readiness, unavailability, and recovery without invoking file handlers. */
  onStatusChange?: (event: FileWatchStatusEvent) => void | Promise<void>;
  /** Retry delay doubles until capped; both values must be positive and finite. */
  retry?: Readonly<{ initialDelayMs?: number; maxDelayMs?: number }>;
}>;

/** File-watch adapter that wraps the standalone `@netscript/watchers` primitive. */
export class WatchersFileWatcherAdapter implements FileWatcherPort {
  readonly #records = new Map<string, WatchersFileWatcherRecord>();
  readonly #now: () => Date;
  readonly #watcherFactory: (options: RuntimeWatcherOptions) => WatcherInstance;
  readonly #onError?: (error: unknown, handle: FileWatcherHandle) => void | Promise<void>;
  readonly #onStatusChange?: WatchersFileWatcherAdapterOptions['onStatusChange'];
  readonly #initialDelayMs: number;
  readonly #maxDelayMs: number;
  readonly #tasks = new Set<Promise<void>>();
  readonly #callbackScope = new AsyncLocalStorage<WatchCallbackScope>();
  #sequence = 0;

  /** Create a file-watch adapter with optional watcher and clock injection. */
  constructor(options: WatchersFileWatcherAdapterOptions = {}) {
    this.#now = options.now ?? (() => new Date());
    this.#watcherFactory = options.watcherFactory ??
      ((watcherOptions) => createWatcher(watcherOptions as UpstreamWatcherOptions));
    this.#onError = options.onError;
    this.#onStatusChange = options.onStatusChange;
    this.#initialDelayMs = options.retry?.initialDelayMs ?? INITIAL_RETRY_DELAY_MS;
    this.#maxDelayMs = options.retry?.maxDelayMs ?? MAX_RETRY_DELAY_MS;
    if (
      !Number.isFinite(this.#initialDelayMs) || this.#initialDelayMs <= 0 ||
      !Number.isFinite(this.#maxDelayMs) || this.#maxDelayMs < this.#initialDelayMs
    ) {
      throw new RangeError('Watch retry delays must be positive, finite, and ordered.');
    }
  }

  /** Register a file-watch definition and return its runtime handle. */
  async watch(
    definition: FileWatchDefinition<string, never, never>,
    handler: FileWatchHandler,
  ): Promise<FileWatcherHandle> {
    await this.unwatch(definition.id);
    const controller = new AbortController();
    const handle: FileWatcherHandle = {
      id: definition.id,
      paths: definition.paths,
      patterns: definition.patterns,
      paused: false,
    };
    const record: WatchersFileWatcherRecord = {
      ...handle,
      definition,
      controller,
      ignored: compileIgnoredPatterns(definition.ignored ?? []),
      handler,
      task: Promise.resolve(),
    };
    // A concurrent registration may have appeared while the old task drained.
    const previous = this.#records.get(definition.id);
    previous?.controller.abort();
    previous?.watcher?.stop();
    this.#records.set(definition.id, record);
    record.task = this.#run(record);
    this.#tasks.add(record.task);
    void record.task.finally(() => {
      this.#tasks.delete(record.task);
      if (this.#tasks.size === 0) this.#callbackScope.disable();
    });
    return handle;
  }

  /** Cancel a watch; callers outside adapter callbacks also await its task. */
  async unwatch(id: TriggerId): Promise<boolean> {
    const record = this.#records.get(id);
    if (record === undefined) {
      return false;
    }
    record.controller.abort();
    record.watcher?.stop();
    this.#records.delete(id);
    if (!this.#callbackScope.getStore()?.active) await record.task;
    return true;
  }

  /** List handles for every active file-watch trigger. */
  list(): Promise<readonly FileWatcherHandle[]> {
    return Promise.resolve([...this.#records.values()].map(stripRuntime));
  }

  /** Resolve a file-watch trigger handle by id. */
  get(id: TriggerId): Promise<FileWatcherHandle | undefined> {
    const record = this.#records.get(id);
    return Promise.resolve(record === undefined ? undefined : stripRuntime(record));
  }

  /** Pause a file-watch trigger without removing it. */
  pause(id: TriggerId): Promise<boolean> {
    return Promise.resolve(this.#setPaused(id, true));
  }

  /** Resume a paused file-watch trigger. */
  resume(id: TriggerId): Promise<boolean> {
    return Promise.resolve(this.#setPaused(id, false));
  }

  /** Cancel all watches; external callers drain tasks, while callbacks never self-await. */
  async stop(): Promise<void> {
    const records = [...this.#records.values()];
    this.#records.clear();
    for (const record of records) {
      record.controller.abort();
      record.watcher?.stop();
    }
    if (!this.#callbackScope.getStore()?.active) await Promise.all(this.#tasks);
  }

  async #run(record: WatchersFileWatcherRecord): Promise<void> {
    let retryDelayMs = this.#initialDelayMs;
    await this.#reportStatus(record, UNAVAILABLE);
    while (this.#isCurrent(record)) {
      try {
        record.watcher = this.#watcherFactory({
          paths: record.paths,
          patterns: record.patterns,
          events: record.definition.on,
          debounceMs: record.definition.debounceMs,
          stabilityThreshold: record.definition.stabilityThreshold,
          signal: record.controller.signal,
          onReady: async () => {
            if (!this.#isCurrent(record)) return;
            retryDelayMs = this.#initialDelayMs;
            await this.#reportStatus(record, WATCHING);
          },
        });
        for await (const event of record.watcher.watch()) {
          if (!this.#isCurrent(record)) break;
          if (record.paused || isIgnored(event.path, record.ignored)) continue;
          await this.#dispatch(record, event);
        }
        if (this.#isCurrent(record)) throw new Error('File watcher ended unexpectedly.');
      } catch (error) {
        if (this.#isCurrent(record)) {
          await this.#reportStatus(record, UNAVAILABLE);
          await this.#reportError(error, stripRuntime(record));
        }
      } finally {
        record.watcher?.stop();
        record.watcher = undefined;
      }
      if (!this.#isCurrent(record)) return;
      await delay(retryDelayMs, { signal: record.controller.signal }).catch(() => {});
      retryDelayMs = Math.min(retryDelayMs * 2, this.#maxDelayMs);
    }
  }

  #isCurrent(record: WatchersFileWatcherRecord): boolean {
    return !record.controller.signal.aborted && this.#records.get(record.id) === record;
  }

  async #reportStatus(record: WatchersFileWatcherRecord, state: FileWatchState): Promise<void> {
    if (!this.#isCurrent(record) || record.state === state) return;
    record.state = state;
    try {
      await this.#invokeCallback(() =>
        this.#onStatusChange?.({
          triggerId: record.id,
          state,
          occurredAt: this.#now().toISOString(),
        })
      );
    } catch {
      // Diagnostics cannot interrupt a watch or its recovery.
    }
  }

  async #dispatch(record: WatchersFileWatcherRecord, event: RuntimeWatchEvent): Promise<void> {
    try {
      await this.#invokeCallback(() => record.handler(this.#eventFor(record, event)));
    } catch (error) {
      await this.#reportError(error, stripRuntime(record));
    }
  }

  async #reportError(error: unknown, handle: FileWatcherHandle): Promise<void> {
    try {
      await this.#invokeCallback(() => this.#onError?.(error, handle));
    } catch {
      // Watcher callbacks are isolated from both handler and error-hook failures.
    }
  }

  async #invokeCallback(callback: () => void | Promise<void>): Promise<void> {
    const scope: WatchCallbackScope = { active: true };
    try {
      await this.#callbackScope.run(scope, callback);
    } finally {
      // A timer spawned by a finished callback is an external caller when it later runs.
      scope.active = false;
    }
  }

  #setPaused(id: TriggerId, paused: boolean): boolean {
    const record = this.#records.get(id);
    if (record === undefined) {
      return false;
    }
    record.paused = paused;
    return true;
  }

  #eventFor(
    record: WatchersFileWatcherRecord,
    event: RuntimeWatchEvent,
  ): TriggerEvent<'file-watch', FileWatchTriggerPayload> {
    this.#sequence += 1;
    const detectedAt = event.timestamp.toISOString();
    return {
      id: `file_watch_${this.#sequence}` as TriggerEventId,
      triggerId: record.id,
      kind: 'file-watch',
      status: 'pending',
      payload: {
        path: event.path,
        kind: event.kind as FileWatchLifecycle,
        size: event.fileInfo?.size,
        modifiedAt: event.fileInfo?.modifiedAt?.toISOString(),
        stableChecks: record.definition.stabilityThreshold?.stableChecks,
      },
      attempt: 0,
      detectedAt,
      updatedAt: this.#now().toISOString(),
      metadata: event.contentHash === null ? undefined : { contentHash: event.contentHash },
    };
  }
}

function stripRuntime(record: WatchersFileWatcherRecord): FileWatcherHandle {
  return {
    id: record.id,
    paths: record.paths,
    patterns: record.patterns,
    paused: record.paused,
  };
}

function compileIgnoredPatterns(patterns: readonly string[]): readonly RegExp[] {
  return patterns.map((pattern) => globToRegExp(pattern));
}

function isIgnored(path: string, ignored: readonly RegExp[]): boolean {
  if (ignored.length === 0) {
    return false;
  }
  const normalized = path.replaceAll('\\', '/');
  const basename = normalized.split('/').at(-1) ?? normalized;
  return ignored.some((pattern) => pattern.test(normalized) || pattern.test(basename));
}

function globToRegExp(pattern: string): RegExp {
  const normalized = pattern.replaceAll('\\', '/');
  let source = '';
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];
    if (char === '*' && next === '*') {
      source += '.*';
      index += 1;
    } else if (char === '*') {
      source += '[^/]*';
    } else if (char === '?') {
      source += '[^/]';
    } else {
      source += escapeRegExp(char);
    }
  }
  return new RegExp(`^${source}$`, Deno.build.os === 'windows' ? 'i' : '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}
