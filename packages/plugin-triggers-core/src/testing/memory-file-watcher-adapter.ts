import type {
  FileWatchDefinition,
  FileWatchLifecycle,
  FileWatchTriggerPayload,
  TriggerEvent,
  TriggerEventId,
  TriggerId,
} from '../domain/mod.ts';
import type { FileWatcherHandle, FileWatcherPort } from '../ports/mod.ts';

/** Handler invoked by the in-memory file watcher adapter. */
export type FileWatchHandler = (event: TriggerEvent<'file-watch'>) => Promise<void>;
type FileWatchRecord =
  & FileWatcherHandle
  & Readonly<{
    definition: FileWatchDefinition<string, never, never>;
    handler: FileWatchHandler;
  }>;

/** In-memory file watcher adapter for file-watch trigger tests. */
export class MemoryFileWatcherAdapter implements FileWatcherPort {
  readonly #records = new Map<string, FileWatchRecord>();
  readonly #now: () => Date;
  #sequence = 0;

  /** Create an in-memory file watcher with an optional clock hook. */
  constructor(options: Readonly<{ now?: () => Date }> = {}) {
    this.#now = options.now ?? (() => new Date());
  }

  /** Register a file-watch definition and handler. */
  watch(
    definition: FileWatchDefinition<string, never, never>,
    handler: FileWatchHandler,
  ): Promise<FileWatcherHandle> {
    const record: FileWatchRecord = {
      id: definition.id,
      paths: definition.paths,
      patterns: definition.patterns,
      paused: false,
      definition,
      handler,
    };
    this.#records.set(definition.id, record);
    return Promise.resolve(stripInternals(record));
  }

  /** Remove a file watcher by trigger id. */
  unwatch(id: TriggerId): Promise<boolean> {
    return Promise.resolve(this.#records.delete(id));
  }

  /** List active file watchers. */
  list(): Promise<readonly FileWatcherHandle[]> {
    return Promise.resolve([...this.#records.values()].map(stripInternals));
  }

  /** Get an active file watcher by trigger id. */
  get(id: TriggerId): Promise<FileWatcherHandle | undefined> {
    const record = this.#records.get(id);
    return Promise.resolve(record === undefined ? undefined : stripInternals(record));
  }

  /** Pause an active file watcher. */
  pause(id: TriggerId): Promise<boolean> {
    return Promise.resolve(this.#setPaused(id, true));
  }

  /** Resume an active file watcher. */
  resume(id: TriggerId): Promise<boolean> {
    return Promise.resolve(this.#setPaused(id, false));
  }

  /** Stop all active file watchers. */
  stop(): Promise<void> {
    this.#records.clear();
    return Promise.resolve();
  }

  /** Emit a synthetic file-watch lifecycle event. */
  async emit(
    id: TriggerId,
    payload: Readonly<{
      path: string;
      kind: FileWatchLifecycle;
      size?: number;
      modifiedAt?: string;
      stableChecks?: number;
    }>,
  ): Promise<boolean> {
    const record = this.#records.get(id);
    if (record === undefined || record.paused) {
      return false;
    }
    await record.handler(this.#eventFor(record, payload));
    return true;
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
    record: FileWatchRecord,
    payload: FileWatchTriggerPayload,
  ): TriggerEvent<'file-watch', FileWatchTriggerPayload> {
    const now = this.#now().toISOString();
    this.#sequence += 1;
    return {
      id: `file_watch_${this.#sequence}` as TriggerEventId,
      triggerId: record.id,
      kind: 'file-watch',
      status: 'pending',
      payload,
      attempt: 0,
      detectedAt: now,
      updatedAt: now,
    };
  }
}

function stripInternals(record: FileWatchRecord): FileWatcherHandle {
  return {
    id: record.id,
    paths: record.paths,
    patterns: record.patterns,
    paused: record.paused,
  };
}
