/**
 * KvCacheStore Adapter
 *
 * Production implementation of {@link CacheStore} that delegates every
 * operation to the shared `@netscript/kv` singleton obtained via `getKv()`.
 *
 * This is the bridge between the SDK cache layer and the unified KV runtime.
 * Whichever backend `@netscript/kv` selects (Redis/Garnet, Deno KV, Memory)
 * is transparently used for all SDK cache operations.
 *
 * Key design decisions:
 * - Lazy initialization — the KV singleton is resolved on first use, not at
 *   construction time. This avoids startup-order issues when the adapter is
 *   created before the environment is fully wired.
 * - Shared init promise — concurrent callers that hit `resolve()` before the
 *   singleton is ready share a single `getKv()` call (no duplicate connections).
 * - No lifecycle ownership — `close()` does NOT close the shared KV instance.
 *   `@netscript/kv` manages its own lifecycle via `closeKv()`. The adapter
 *   simply drops its reference so a subsequent call would re-resolve.
 *
 * @module
 */

import type { WatchableKv } from '@netscript/kv';
import type { CacheKey, CacheStore, CacheStoreEntry } from '../ports/cache-store.ts';

/**
 * SDK cache store backed by the shared `@netscript/kv` singleton.
 *
 * This is the default (and typically only) `CacheStore` used in production.
 * For unit tests, inject a lightweight Map-backed double instead.
 *
 * @example
 * ```ts
 * import { KvCacheStore } from '@netscript/sdk';
 *
 * const store = new KvCacheStore();
 * await store.set(['cache_query', 'users', 'list'], payload, { expireIn: 60_000 });
 * const entry = await store.get(['cache_query', 'users', 'list']);
 * ```
 */
export class KvCacheStore implements CacheStore {
  /** Resolved singleton — cached after first successful `getKv()`. */
  private kv: WatchableKv | null = null;

  /** Shared init promise to deduplicate concurrent `resolve()` calls. */
  private initPromise: Promise<WatchableKv> | null = null;

  /**
   * Lazily resolve the shared `@netscript/kv` singleton.
   *
   * Multiple concurrent callers share the same promise so `getKv()` is
   * invoked at most once per adapter lifetime (unless `close()` resets it).
   */
  private async resolve(): Promise<WatchableKv> {
    if (this.kv) return this.kv;

    if (!this.initPromise) {
      // Dynamic import keeps @netscript/kv (and its transitive ioredis
      // dependency) out of the static module graph. Vite's client environment
      // would otherwise try to bundle the Redis adapter's Node-only imports.
      this.initPromise = import('@netscript/kv').then((mod) => mod.getKv());
    }

    this.kv = await this.initPromise;
    this.initPromise = null;
    return this.kv;
  }

  // ---------------------------------------------------------------------------
  // CacheStore implementation
  // ---------------------------------------------------------------------------

  /**
   * Retrieve a cached value by key.
   *
   * @param key - Composite cache key segments.
   * @returns Entry with the cached value or `null` on cache miss.
   */
  async get<T>(key: CacheKey): Promise<CacheStoreEntry<T>> {
    const store = await this.resolve();
    const entry = await store.get<T>(key);
    return { value: entry?.value ?? null };
  }

  /**
   * Store a cache value with an optional expiration window.
   *
   * @param key - Composite cache key segments.
   * @param value - Structured-clone-safe payload to store.
   * @param options - Optional expiration window in milliseconds.
   */
  async set(key: CacheKey, value: unknown, options?: { expireIn?: number }): Promise<void> {
    const store = await this.resolve();
    await store.set(key, value, options);
  }

  /**
   * Delete a single cache entry.
   *
   * @param key - Composite cache key segments.
   */
  async delete(key: CacheKey): Promise<void> {
    const store = await this.resolve();
    await store.delete(key);
  }

  /**
   * Iterate over all cache keys that share a common prefix.
   *
   * @param options - Prefix used to match cached entries.
   * @returns Async iterable of matched keys.
   */
  async *list(options: { prefix: CacheKey }): AsyncIterable<{ key: CacheKey }> {
    const store = await this.resolve();
    for await (const entry of store.list(options)) {
      yield { key: entry.key };
    }
  }

  /**
   * Drop local references to the shared KV singleton.
   */
  close(): Promise<void> {
    // Drop local references — do NOT close the shared singleton.
    // @netscript/kv manages the singleton lifecycle via closeKv().
    this.kv = null;
    this.initPromise = null;
    return Promise.resolve();
  }
}
