import type { FileWatchDefinition, TriggerEvent, TriggerId } from '../domain/mod.ts';

/**
 * File-watch availability states reported independently of trigger delivery.
 * @example
 * ```ts
 * import { FILE_WATCH_STATES } from '@netscript/plugin-triggers-core/ports';
 * console.log(FILE_WATCH_STATES.includes('watching'));
 * ```
 */
export const FILE_WATCH_STATES: readonly ['watching', 'unavailable'] = ['watching', 'unavailable'];

/**
 * Availability of one file-watch source.
 * @example
 * ```ts
 * import type { FileWatchState } from '@netscript/plugin-triggers-core/ports';
 * const state: FileWatchState = 'unavailable';
 * ```
 */
export type FileWatchState = typeof FILE_WATCH_STATES[number];

/**
 * Observable watch readiness, failure, or recovery transition.
 * @example
 * ```ts
 * import type { FileWatchStatusEvent } from '@netscript/plugin-triggers-core/ports';
 * declare const event: FileWatchStatusEvent;
 * console.log(event.triggerId, event.state);
 * ```
 */
export type FileWatchStatusEvent = Readonly<{
  /** Trigger that owns this watch. */
  triggerId: TriggerId;
  /** Whether watch resources are acquired. */
  state: FileWatchState;
  /** Transition time as an ISO timestamp. */
  occurredAt: string;
}>;

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
