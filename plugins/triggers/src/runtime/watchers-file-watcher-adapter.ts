import { createWatcher } from '@netscript/watchers';
import type { WatcherOptions as UpstreamWatcherOptions } from '@netscript/watchers';
import type {
  FileWatchDefinition,
  FileWatchLifecycle,
  FileWatchTriggerPayload,
  TriggerEvent,
  TriggerEventId,
  TriggerId,
} from '@netscript/plugin-triggers-core/domain';
import type { FileWatcherHandle, FileWatcherPort } from '@netscript/plugin-triggers-core/ports';

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
  signal?: AbortSignal;
}>;

/** Minimal watcher primitive consumed by the file-watch adapter. */
export type WatcherInstance = Readonly<{
  watch(): AsyncIterable<RuntimeWatchEvent>;
  stop(): void;
}>;

/** Handler invoked when a file-watch trigger observes a matching event. */
export type FileWatchHandler = (event: TriggerEvent<'file-watch'>) => Promise<void>;

type WatchersFileWatcherRecord =
  & FileWatcherHandle
  & Readonly<{
    definition: FileWatchDefinition<string, never, never>;
    watcher: WatcherInstance;
    controller: AbortController;
    ignored: readonly RegExp[];
    handler: FileWatchHandler;
    task: Promise<void>;
  }>;

/** Options for constructing a file-watch trigger adapter. */
export type WatchersFileWatcherAdapterOptions = Readonly<{
  now?: () => Date;
  watcherFactory?: (options: RuntimeWatcherOptions) => WatcherInstance;
  onError?: (error: unknown, handle: FileWatcherHandle) => void | Promise<void>;
}>;

/** File-watch adapter that wraps the standalone `@netscript/watchers` primitive. */
export class WatchersFileWatcherAdapter implements FileWatcherPort {
  readonly #records = new Map<string, WatchersFileWatcherRecord>();
  readonly #now: () => Date;
  readonly #watcherFactory: (options: RuntimeWatcherOptions) => WatcherInstance;
  readonly #onError?: (error: unknown, handle: FileWatcherHandle) => void | Promise<void>;
  #sequence = 0;

  /** Create a file-watch adapter with optional watcher and clock injection. */
  constructor(options: WatchersFileWatcherAdapterOptions = {}) {
    this.#now = options.now ?? (() => new Date());
    this.#watcherFactory = options.watcherFactory ??
      ((watcherOptions) => createWatcher(watcherOptions as UpstreamWatcherOptions));
    this.#onError = options.onError;
  }

  /** Register a file-watch definition and return its runtime handle. */
  async watch(
    definition: FileWatchDefinition<string, never, never>,
    handler: FileWatchHandler,
  ): Promise<FileWatcherHandle> {
    await this.unwatch(definition.id);
    const controller = new AbortController();
    const watcher = this.#watcherFactory({
      paths: definition.paths,
      patterns: definition.patterns,
      events: definition.on,
      debounceMs: definition.debounceMs,
      stabilityThreshold: definition.stabilityThreshold,
      signal: controller.signal,
    });
    const handle: FileWatcherHandle = {
      id: definition.id,
      paths: definition.paths,
      patterns: definition.patterns,
      paused: false,
    };
    const record: WatchersFileWatcherRecord = {
      ...handle,
      definition,
      watcher,
      controller,
      ignored: compileIgnoredPatterns(definition.ignored ?? []),
      handler,
      task: Promise.resolve(),
    };
    const runningRecord = {
      ...record,
      task: this.#run(record),
    };
    this.#records.set(definition.id, runningRecord);
    return handle;
  }

  /** Remove a file-watch trigger if it exists. */
  unwatch(id: TriggerId): Promise<boolean> {
    const record = this.#records.get(id);
    if (record === undefined) {
      return Promise.resolve(false);
    }
    record.controller.abort();
    record.watcher.stop();
    this.#records.delete(id);
    return Promise.resolve(true);
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

  /** Stop all active file-watch triggers and await their tasks. */
  async stop(): Promise<void> {
    const records = [...this.#records.values()];
    this.#records.clear();
    for (const record of records) {
      record.controller.abort();
      record.watcher.stop();
    }
    await Promise.all(records.map((record) => record.task));
  }

  async #run(record: WatchersFileWatcherRecord): Promise<void> {
    try {
      for await (const event of record.watcher.watch()) {
        const current = this.#records.get(record.id);
        if (current === undefined || current.paused || isIgnored(event.path, current.ignored)) {
          continue;
        }
        await this.#dispatch(current, event);
      }
    } catch (error) {
      if (!record.controller.signal.aborted) {
        await this.#reportError(error, stripRuntime(record));
      }
    }
  }

  async #dispatch(record: WatchersFileWatcherRecord, event: RuntimeWatchEvent): Promise<void> {
    try {
      await record.handler(this.#eventFor(record, event));
    } catch (error) {
      await this.#reportError(error, stripRuntime(record));
    }
  }

  async #reportError(error: unknown, handle: FileWatcherHandle): Promise<void> {
    try {
      await this.#onError?.(error, handle);
    } catch {
      // Watcher callbacks are isolated from both handler and error-hook failures.
    }
  }

  #setPaused(id: TriggerId, paused: boolean): boolean {
    const record = this.#records.get(id);
    if (record === undefined) {
      return false;
    }
    this.#records.set(id, { ...record, paused });
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
