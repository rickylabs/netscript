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
  watch(
    definition: FileWatchDefinition<string, never, never>,
    handler: (event: TriggerEvent<'file-watch'>) => Promise<void>,
  ): Promise<FileWatcherHandle>;
  unwatch(id: TriggerId): Promise<boolean>;
  list(): Promise<readonly FileWatcherHandle[]>;
  get(id: TriggerId): Promise<FileWatcherHandle | undefined>;
  pause(id: TriggerId): Promise<boolean>;
  resume(id: TriggerId): Promise<boolean>;
  stop(): Promise<void>;
}
