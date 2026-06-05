/**
 * CacheStore Interface
 *
 * The SDK's narrowed view of what it needs from a key-value store.
 * This is intentionally smaller than the full `WatchableKv` or `KvStore`
 * surface from `@netscript/kv` — it documents exactly which operations
 * the cache layer uses and nothing more.
 *
 * Design rationale:
 * - `CacheQuery` depends on this abstraction, not on `@netscript/kv` directly (DI)
 * - Unit tests can inject a lightweight mock without importing the full KV package
 * - The interface is stable even if the underlying KV adapter evolves
 *
 * @module
 */

/**
 * Cache key used by the SDK cache layer.
 *
 * This directly mirrors Deno's native KV key contract rather than depending on
 * a sibling package alias.
 */
export type CacheKey = Deno.KvKey;

/**
 * A single cache entry returned by {@link CacheStore.get}.
 *
 * The `value` field is `T | null` to distinguish "key exists with value"
 * from "key does not exist" (where the entire result's `value` is `null`).
 */
export interface CacheStoreEntry<T> {
  /** The stored value, or `null` if the key does not exist. */
  value: T | null;
}

/**
 * Minimal key-value contract consumed by the SDK cache layer.
 *
 * Implementors:
 * - {@link KvCacheStore} — production adapter bridging to `@netscript/kv`
 * - Test doubles — in-memory Map-backed stores for unit tests
 *
 * All keys use Deno's native {@link Deno.KvKey} type, ensuring type-safe key
 * construction without local casts or sibling-package aliases.
 */
export interface CacheStore {
  /**
   * Retrieve a value by key.
   *
   * @param key - Composite key segments
   * @returns Entry with the value or `{ value: null }` on cache miss
   */
  get<T>(key: CacheKey): Promise<CacheStoreEntry<T>>;

  /**
   * Store a value with optional TTL.
   *
   * @param key     - Composite key segments
   * @param value   - Payload to cache (must be structured-clone-safe)
   * @param options - Optional `expireIn` in milliseconds
   */
  set(key: CacheKey, value: unknown, options?: { expireIn?: number }): Promise<void>;

  /**
   * Remove a single key from the store.
   *
   * @param key - Composite key segments
   */
  delete(key: CacheKey): Promise<void>;

  /**
   * Iterate over all keys that share a common prefix.
   *
   * Used by `CacheQuery.invalidateQueries()` to bulk-delete entries
   * matching a query-key prefix.
   *
   * @param options - Must include `prefix` (the key segments to match)
   * @returns Async iterable of objects containing the matched `key`
   */
  list(options: { prefix: CacheKey }): AsyncIterable<{ key: CacheKey }>;

  /**
   * Release resources held by this store.
   *
   * For the production `KvCacheStore` this is a no-op (the shared
   * `@netscript/kv` singleton manages its own lifecycle). Test doubles
   * can use this to reset state.
   */
  close(): Promise<void>;
}
