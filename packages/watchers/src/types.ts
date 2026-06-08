/**
 * @netscript/watchers — Core Types
 *
 * Type definitions for the file-watching subsystem.
 * These types are shared across strategies, filters, and the FileWatcher class.
 *
 * @module
 */

// ============================================================================
// ENUMS
// ============================================================================

/** Built-in file system event kinds that the watcher can detect. */
export type KnownEventKind = 'create' | 'modify' | 'remove';

/** File system event kind. New runtime kinds require doctrine review before use. */
export type EventKind = KnownEventKind | (string & {});

/** Built-in watch strategies for detecting file changes. */
export type KnownWatchStrategy = 'native' | 'polling' | 'hybrid';

/** Watch strategy identifier. Built-in factory values remain runtime validated. */
export type WatchStrategy = KnownWatchStrategy | (string & {});

// ============================================================================
// FILE INFO
// ============================================================================

/** Metadata about a watched file, built from {@linkcode Deno.FileInfo}. */
export interface FileInfo {
  /** File size in bytes. */
  readonly size: number;
  /** Last modification time (null if unavailable). */
  readonly modifiedAt: Date | null;
  /** File creation time (null if unavailable). */
  readonly createdAt: Date | null;
  /** Whether the path is a regular file. */
  readonly isFile: boolean;
  /** Whether the path is a symbolic link. */
  readonly isSymlink: boolean;
}

// ============================================================================
// WATCH EVENT
// ============================================================================

/**
 * A single file-system event yielded by a watcher strategy.
 *
 * This is the raw event before any trigger-level processing.
 * Strategies produce these; filters consume and re-yield them.
 */
export interface WatchEvent {
  /** Absolute path of the affected file. */
  readonly path: string;
  /** What happened to the file. */
  readonly kind: EventKind;
  /** SHA-256 hex digest of file content (null for remove events or when hashing is disabled). */
  readonly contentHash: string | null;
  /** File metadata at the time of detection (null for remove events). */
  readonly fileInfo: FileInfo | null;
  /** Timestamp when the event was detected. */
  readonly timestamp: Date;
}

// ============================================================================
// STABILITY OPTIONS
// ============================================================================

/**
 * Configuration for the stability filter.
 *
 * Ensures files are fully written (e.g. after SFTP transfer) before emitting events.
 * The filter repeatedly stats the file and only emits once the size stops changing
 * for {@linkcode stableChecks} consecutive checks.
 */
export interface StabilityOptions {
  /** Interval between size checks in milliseconds. @default 1000 */
  readonly checkIntervalMs?: number;
  /** Number of consecutive same-size checks required before considering the file stable. @default 3 */
  readonly stableChecks?: number;
}

// ============================================================================
// WATCHER OPTIONS
// ============================================================================

/**
 * Configuration for a {@linkcode FileWatcher} instance.
 *
 * Controls which directories to watch, which files to include,
 * and how events are filtered before being yielded.
 */
export interface WatcherOptions {
  /** Directories to watch (at least one required). */
  readonly paths: readonly string[];
  /** Glob patterns for filtering files. @default ['*'] */
  readonly patterns?: readonly string[];
  /** Which FS events to yield. @default ['create'] */
  readonly events?: readonly EventKind[];
  /** Per-file debounce in milliseconds. @default 2000 */
  readonly debounceMs?: number;
  /** Compute SHA-256 content hash for deduplication. @default true */
  readonly contentHash?: boolean;
  /** Scan existing files on startup and emit them as `create` events. @default false */
  readonly processExisting?: boolean;
  /** Force polling strategy instead of the native filesystem strategy. @default false */
  readonly forcePolling?: boolean;
  /** Polling interval in milliseconds for the polling strategy. Minimum 500. @default 5000 */
  readonly pollIntervalMs?: number;
  /** Skip files smaller than this size in bytes. @default 0 */
  readonly minFileSize?: number;
  /** Skip files older than this value in milliseconds (only applies during startup scan). */
  readonly maxFileAge?: number;
  /** File stability check configuration. When set, waits for files to stop growing. */
  readonly stabilityThreshold?: StabilityOptions;
  /** Abort signal for graceful shutdown. */
  readonly signal?: AbortSignal;
}

// ============================================================================
// STRATEGY INTERFACE
// ============================================================================

/**
 * A watch strategy produces raw file-system events as an async iterable.
 *
 * Implementations must respect the provided {@linkcode AbortSignal} for
 * clean shutdown and should yield events as soon as they are detected.
 */
export interface WatchStrategyHandler {
  /** Start watching and yield events. */
  watch(): AsyncIterable<WatchEvent>;
}

// ============================================================================
// FILTER INTERFACE
// ============================================================================

/**
 * A filter takes an async iterable of events and yields only those
 * that pass its criteria. Filters are composed in a pipeline by
 * the {@linkcode FileWatcher}.
 */
export interface WatchFilter {
  /** Apply this filter to the given event stream. */
  apply(events: AsyncIterable<WatchEvent>): AsyncIterable<WatchEvent>;
}
