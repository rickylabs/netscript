/**
 * @netscript/watchers — Reusable File-Watching Primitives
 *
 * Provides composable strategies, filters, and a pipeline-based
 * {@linkcode FileWatcher} for detecting file system changes across
 * local and network filesystems.
 *
 * @example Basic file watching
 * ```ts
 * import { createWatcher } from '@netscript/watchers';
 *
 * const watcher = createWatcher({
 *   paths: ['./incoming'],
 *   patterns: ['*.csv'],
 *   events: ['create'],
 *   stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 3 },
 * });
 *
 * for await (const event of watcher.watch()) {
 *   console.log(`${event.kind}: ${event.path}`);
 * }
 * ```
 *
 * @example Network drive with polling
 * ```ts
 * import { createWatcher } from '@netscript/watchers';
 *
 * const watcher = createWatcher({
 *   paths: ['//fileserver/erp-share/sales/incoming'],
 *   patterns: ['*.csv'],
 *   forcePolling: true,
 *   pollIntervalMs: 3000,
 * });
 * ```
 *
 * @module
 */

// ============================================================================
// TYPES
// ============================================================================

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
} from './types.ts';

// ============================================================================
// FILE WATCHER (primary API)
// ============================================================================

export { createWatcher, FileWatcher } from './file-watcher.ts';

// ============================================================================
// STRATEGY SUBPATHS
// ============================================================================

export type { NativeStrategy, NativeStrategyOptions } from './strategies/native.ts';
export type { PollingStrategy, PollingStrategyOptions } from './strategies/polling.ts';
export type { HybridStrategy, HybridStrategyOptions } from './strategies/hybrid.ts';

// ============================================================================
// FILTERS
// ============================================================================

export { StabilityFilter } from './filters/stability.ts';
export { GlobFilter } from './filters/glob.ts';
export { computeContentHash, DedupFilter, type DedupFilterOptions } from './filters/dedup.ts';

// ============================================================================
// FILESYSTEM UTILITIES
// ============================================================================

export { AccessFailureTracker, safeReadFile, safeStat } from './fs.ts';
