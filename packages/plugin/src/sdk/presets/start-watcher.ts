import { createWatcherHandle } from '../discovery/watcher.ts';
import type { WatcherHandle } from '../discovery/watcher.ts';

/** Start a no-op alpha watcher for plugin SDK discovery. */
export function startWatcher(): WatcherHandle {
  return createWatcherHandle();
}
