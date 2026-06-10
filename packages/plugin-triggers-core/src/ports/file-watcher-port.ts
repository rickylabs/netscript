import type { FileWatchDefinition, TriggerEvent, TriggerId } from '../domain/mod.ts';

/** File watcher handle returned by file watcher adapters. */
export type FileWatcherHandle = Readonly<{
  id: TriggerId;
  paths: readonly string[];
  patterns: readonly string[];
  paused: boolean;
}>;

/** File watcher boundary for file-watch trigger definitions. */
export interface FileWatcherPort {
  /** Start watching a file trigger definition and dispatch matching events. */
  watch(
    definition: FileWatchDefinition<string, never, never>,
    handler: (event: TriggerEvent<'file-watch'>) => Promise<void>,
  ): Promise<FileWatcherHandle>;
  /** Remove a watcher by trigger id. */
  unwatch(id: TriggerId): Promise<boolean>;
  /** List all active file watchers. */
  list(): Promise<readonly FileWatcherHandle[]>;
  /** Get an active file watcher by trigger id. */
  get(id: TriggerId): Promise<FileWatcherHandle | undefined>;
  /** Pause event dispatch for a watcher. */
  pause(id: TriggerId): Promise<boolean>;
  /** Resume event dispatch for a watcher. */
  resume(id: TriggerId): Promise<boolean>;
  /** Stop all file watcher resources. */
  stop(): Promise<void>;
}
