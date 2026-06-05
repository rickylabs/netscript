/**
 * Shared public types for `@netscript/kv`.
 *
 * These contracts intentionally mirror the semantics of Deno KV while staying
 * package-owned so the adapter surface can remain stable across Redis,
 * in-memory, and future non-Deno backends.
 *
 * @module
 */

/**
 * Portable key format for all KV adapters.
 *
 * This shape is intentionally compatible with `Deno.KvKey`.
 */
export type KvKey = readonly Deno.KvKeyPart[];

/**
 * Key-value entry returned from `get()` and `list()`.
 */
export interface KvEntry<T = unknown> {
  /** The key of the entry */
  key: KvKey;
  /** The value stored at this key */
  value: T;
  /** Version stamp for optimistic concurrency */
  versionstamp: string | null;
}

/**
 * Event emitted when an observed key changes.
 */
export interface WatchEvent<T = unknown> {
  /** The key that changed */
  key: KvKey;
  /** The new value (null if deleted) */
  value: T | null;
  /** Previous value before the change (if available) */
  previousValue?: T | null;
  /** Type of change */
  type: 'set' | 'delete';
  /** Timestamp of the change */
  timestamp: Date;
  /** Version stamp after the change */
  versionstamp: string | null;
}

/**
 * Options for `KvStore.set()`.
 */
export interface KvSetOptions {
  /** Time-to-live in milliseconds */
  expireIn?: number;
}

/**
 * Options for `KvStore.list()`.
 */
export interface KvListOptions {
  /** Key prefix to filter by */
  prefix: KvKey;
  /** Maximum number of entries to return */
  limit?: number;
  /** Start key (exclusive) for pagination */
  start?: KvKey;
  /** End key (exclusive) for range queries */
  end?: KvKey;
  /** Reverse order */
  reverse?: boolean;
  /** Consistency level */
  consistency?: 'strong' | 'eventual';
}

/**
 * Options for `WatchableKv.watch()`.
 */
export interface WatchOptions {
  /** Abort signal for cleanup */
  signal?: AbortSignal;
  /** Debounce rapid changes (ms) */
  debounce?: number;
  /** Raw mode - emit raw Deno.Kv entries without transformation */
  raw?: boolean;
}

/**
 * Options for `WatchableKv.watchPrefix()`.
 */
export interface WatchPrefixOptions extends WatchOptions {
  /** Polling interval for discovering new keys (ms) - default 1000 */
  pollInterval?: number;
  /** Skip emitting initial state - only emit changes after connection (default: false) */
  skipInitial?: boolean;
}

/**
 * Version check used by atomic compare-and-swap operations.
 */
export interface AtomicCheck {
  /** Key to check */
  key: KvKey;
  /** Expected versionstamp (null means key should not exist) */
  versionstamp: string | null;
}

/**
 * Result returned from an atomic operation.
 */
export interface AtomicResult {
  /** Whether the operation was successful */
  ok: boolean;
  /** New versionstamp if successful */
  versionstamp?: string;
}
