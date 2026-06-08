/** Watcher handle returned by SDK watch presets. */
export interface WatcherHandle {
  /** Stop the watcher and release any owned resources. */
  readonly stop: () => Promise<void>;
}

/** Create a no-op watcher handle for alpha SDK discovery. */
export function createWatcherHandle(): WatcherHandle {
  return { stop: () => Promise.resolve() };
}
