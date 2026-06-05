/**
 * KvStore Interface
 *
 * Base key-value store interface compatible with Fedify's KvStore.
 * Provides the foundation for all KV adapters.
 *
 * @module
 */

import type {
  AtomicCheck,
  AtomicResult,
  KvEntry,
  KvKey,
  KvListOptions,
  KvSetOptions,
} from './common.ts';

/**
 * Base key-value storage contract.
 *
 * All adapters implement this interface so NetScript packages can remain
 * backend-agnostic.
 *
 * @example
 * ```ts
 * const store: KvStore = new DenoKvAdapter();
 *
 * // Basic operations
 * await store.set(['users', '123'], { name: 'Alice' });
 * const user = await store.get(['users', '123']);
 * await store.delete(['users', '123']);
 *
 * // List by prefix
 * for await (const entry of store.list({ prefix: ['users'] })) {
 *   console.log(entry.key, entry.value);
 * }
 *
 * // With explicit resource management (Deno 2.3+):
 * await using store = new DenoKvAdapter();
 * await store.set(['key'], 'value');
 * // Automatically closed when scope exits
 * ```
 */
export interface KvStore extends AsyncDisposable {
  /**
   * Get a value by key.
   *
   * @param key - The key to retrieve
   * @returns The value if found, undefined otherwise
   *
   * @example
   * ```ts
   * const user = await store.get<User>(['users', '123']);
   * if (user) {
   *   console.log(user.name);
   * }
   * ```
   */
  get<T = unknown>(key: KvKey): Promise<KvEntry<T> | null>;

  /**
   * Set a value with optional TTL.
   *
   * @param key - The key to set
   * @param value - The value to store
   * @param options - Optional settings (TTL, etc.)
   *
   * @example
   * ```ts
   * // Set permanently
   * await store.set(['users', '123'], { name: 'Alice' });
   *
   * // Set with 1 hour TTL
   * await store.set(['sessions', 'abc'], { userId: '123' }, { expireIn: 3600000 });
   * ```
   */
  set(key: KvKey, value: unknown, options?: KvSetOptions): Promise<void>;

  /**
   * Delete a key.
   *
   * @param key - The key to delete
   *
   * @example
   * ```ts
   * await store.delete(['users', '123']);
   * ```
   */
  delete(key: KvKey): Promise<void>;

  /**
   * Check if a key exists.
   *
   * @param key - The key to check
   * @returns True if the key exists, false otherwise
   */
  has(key: KvKey): Promise<boolean>;

  /**
   * List entries by prefix.
   *
   * @param options - List options including prefix, limit, etc.
   * @returns Async iterable of KV entries
   *
   * @example
   * ```ts
   * // List all users
   * for await (const entry of store.list<User>({ prefix: ['users'] })) {
   *   console.log(entry.key, entry.value);
   * }
   *
   * // List with limit
   * for await (const entry of store.list({ prefix: ['users'], limit: 10 })) {
   *   console.log(entry.key, entry.value);
   * }
   * ```
   */
  list<T = unknown>(options: KvListOptions): AsyncIterable<KvEntry<T>>;

  /**
   * Batch-read multiple keys in a single round-trip.
   *
   * Adapters that support native batch reads (e.g. Redis `MGET`) should
   * implement this for optimal performance. When not implemented, callers
   * should fall back to `Promise.all(keys.map(k => store.get(k)))`.
   *
   * The returned array preserves the order of the input `keys` — index `i`
   * of the result corresponds to `keys[i]`. Entries that do not exist are
   * returned as `null`.
   *
   * @param keys - Array of keys to retrieve
   * @returns Array of entries (or `null` for missing keys), same length and order as `keys`
   *
   * @example
   * ```ts
   * const entries = await store.getMany<User>([
   *   ['users', '1'],
   *   ['users', '2'],
   *   ['users', '3'],
   * ]);
   * // entries[0] → KvEntry<User> | null  (for key ['users', '1'])
   * // entries[1] → KvEntry<User> | null  (for key ['users', '2'])
   * // entries[2] → KvEntry<User> | null  (for key ['users', '3'])
   * ```
   */
  getMany?<T = unknown>(keys: KvKey[]): Promise<(KvEntry<T> | null)[]>;

  /**
   * Atomic compare-and-swap operation.
   *
   * Ensures that a set of mutations only occurs if all checks pass.
   * This is useful for implementing optimistic concurrency control.
   *
   * @param checks - Array of version checks that must pass
   * @param mutations - Array of mutations to apply if all checks pass
   * @returns Result indicating success and new versionstamp
   *
   * @example
   * ```ts
   * const entry = await store.get(['counters', 'visits']);
   * const result = await store.atomic(
   *   [{ key: ['counters', 'visits'], versionstamp: entry?.versionstamp ?? null }],
   *   [{ type: 'set', key: ['counters', 'visits'], value: (entry?.value ?? 0) + 1 }]
   * );
   * if (!result.ok) {
   *   // Concurrent modification detected, retry
   * }
   * ```
   */
  atomic?(
    checks: AtomicCheck[],
    mutations: AtomicMutation[],
  ): Promise<AtomicResult>;

  /**
   * Close the KV store connection.
   * Should be called when the store is no longer needed.
   */
  close(): Promise<void>;

  /** Alias for {@linkcode close} — enables the `await using` pattern. */
  [Symbol.asyncDispose](): Promise<void>;
}

/**
 * Atomic mutation operations supported by `KvStore.atomic()`.
 */
export type AtomicMutation =
  | { type: 'set'; key: KvKey; value: unknown; expireIn?: number }
  | { type: 'delete'; key: KvKey }
  | { type: 'sum'; key: KvKey; value: bigint }
  | { type: 'min'; key: KvKey; value: bigint }
  | { type: 'max'; key: KvKey; value: bigint };
