/**
 * @netscript/watchers public surface.
 *
 * @module
 */

export type {
  EventKind,
  FileInfo,
  KnownEventKind,
  KnownWatchStrategy,
  StabilityOptions,
  WatcherOptions,
  WatchEvent,
  WatchFilter,
  WatchStrategy,
  WatchStrategyHandler,
} from '../types.ts';

export { createWatcher, FileWatcher } from '../file-watcher.ts';

export type { NativeStrategy, NativeStrategyOptions } from '../strategies/native.ts';
export type { PollingStrategy, PollingStrategyOptions } from '../strategies/polling.ts';
export type { HybridStrategy, HybridStrategyOptions } from '../strategies/hybrid.ts';

export { StabilityFilter } from '../filters/stability.ts';
export { GlobFilter } from '../filters/glob.ts';
export { computeContentHash, DedupFilter, type DedupFilterOptions } from '../filters/dedup.ts';

export { AccessFailureTracker, safeReadFile, safeStat } from '../fs.ts';
