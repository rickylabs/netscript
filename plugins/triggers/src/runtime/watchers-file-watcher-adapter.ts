import { createWatcher, type WatcherOptions, type WatchEvent } from '@netscript/watchers';
import type {
  FileWatchDefinition,
  FileWatchLifecycle,
  FileWatchTriggerPayload,
  TriggerEvent,
  TriggerEventId,
  TriggerId,
} from '@netscript/plugin-triggers-core/domain';
import type { FileWatcherHandle, FileWatcherPort } from '@netscript/plugin-triggers-core/ports';

type WatcherInstance = Readonly<{
  watch(): AsyncIterable<WatchEvent>;
  stop(): void;
}>;

type FileWatchHandler = (event: TriggerEvent<'file-watch'>) => Promise<void>;

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

export type WatchersFileWatcherAdapterOptions = Readonly<{
  now?: () => Date;
  watcherFactory?: (options: WatcherOptions) => WatcherInstance;
  onError?: (error: unknown, handle: FileWatcherHandle) => void | Promise<void>;
}>;

/** File-watch adapter that wraps the standalone `@netscript/watchers` primitive. */
export class WatchersFileWatcherAdapter implements FileWatcherPort {
  readonly #records = new Map<string, WatchersFileWatcherRecord>();
  readonly #now: () => Date;
  readonly #watcherFactory: (options: WatcherOptions) => WatcherInstance;
  readonly #onError?: (error: unknown, handle: FileWatcherHandle) => void | Promise<void>;
  #sequence = 0;

  constructor(options: WatchersFileWatcherAdapterOptions = {}) {
    this.#now = options.now ?? (() => new Date());
    this.#watcherFactory = options.watcherFactory ?? createWatcher;
    this.#onError = options.onError;
  }

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

  list(): Promise<readonly FileWatcherHandle[]> {
    return Promise.resolve([...this.#records.values()].map(stripRuntime));
  }

  get(id: TriggerId): Promise<FileWatcherHandle | undefined> {
    const record = this.#records.get(id);
    return Promise.resolve(record === undefined ? undefined : stripRuntime(record));
  }

  pause(id: TriggerId): Promise<boolean> {
    return Promise.resolve(this.#setPaused(id, true));
  }

  resume(id: TriggerId): Promise<boolean> {
    return Promise.resolve(this.#setPaused(id, false));
  }

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

  async #dispatch(record: WatchersFileWatcherRecord, event: WatchEvent): Promise<void> {
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
    event: WatchEvent,
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
