/**
 * Internal cache-query implementation.
 *
 * @module
 */

import { KvCacheStore } from './kv-cache-store.ts';
import type { CachedEntry, CacheEntry } from '../interfaces/cache-entry.ts';
import { toCachedEntry } from '../interfaces/cache-entry.ts';
import type { CacheStore } from '../interfaces/cache-store.ts';
import type { QueryKey } from '../interfaces/query-key.ts';
import type { CacheQueryOptions } from '../interfaces/query-options.ts';

/** Root prefix for all SDK cache keys in the KV store. */
const CACHE_PREFIX = 'cache_query' as const;
const DEFAULT_STALE_TIME_MS = 60_000;
const DEFAULT_CACHE_TIME_MS = 300_000;

const inflightRequests = new Map<string, Promise<unknown>>();

function getInflightKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey);
}

function toCacheStoreKey(queryKey: QueryKey): Deno.KvKey {
  return [CACHE_PREFIX, ...queryKey.map((segment) => String(segment))];
}

/**
 * Query cache engine with stale-while-revalidate semantics.
 */
export class CacheQuery {
  private readonly store: CacheStore;

  /**
   * Create a cache-query engine.
   *
   * @param store - Optional custom cache store. Defaults to `KvCacheStore`.
   */
  constructor(store?: CacheStore) {
    this.store = store ?? new KvCacheStore();
  }

  /**
   * Execute a cache-aware query.
   *
   * @param queryKey - Canonical query key.
   * @param options - Cache policy and fetcher.
   * @returns Resolved query data.
   */
  async query<TData>(
    queryKey: QueryKey,
    options: CacheQueryOptions<TData>,
  ): Promise<TData> {
    const {
      staleTime = DEFAULT_STALE_TIME_MS,
      cacheTime = DEFAULT_CACHE_TIME_MS,
      revalidateOnStale = true,
      preferFreshOnStale = false,
      queryFn,
    } = options;

    const key = toCacheStoreKey(queryKey);
    const inflightKey = getInflightKey(queryKey);

    if (inflightRequests.has(inflightKey)) {
      return await inflightRequests.get(inflightKey)! as TData;
    }

    const cached = await this.store.get<CacheEntry<TData>>(key);

    if (cached.value) {
      const age = Date.now() - cached.value.timestamp;
      const isFresh = age < staleTime;
      const isExpired = age > cacheTime;

      if (isExpired) {
        return await this.fetchAndCache(queryFn, key, inflightKey, cacheTime);
      }

      if (isFresh) {
        return cached.value.data;
      }

      if (preferFreshOnStale) {
        return await this.fetchAndCache(queryFn, key, inflightKey, cacheTime);
      }

      if (revalidateOnStale) {
        this.revalidateInBackground(queryFn, key, cacheTime);
      }

      return cached.value.data;
    }

    return await this.fetchAndCache(queryFn, key, inflightKey, cacheTime);
  }

  /**
   * Execute the query function once, track the in-flight request, and persist
   * the resolved value into the cache store.
   */
  private async fetchAndCache<TData>(
    queryFn: () => Promise<TData>,
    cacheKey: Deno.KvKey,
    inflightKey: string,
    cacheTime: number,
  ): Promise<TData> {
    const promise = queryFn();
    inflightRequests.set(inflightKey, promise);

    try {
      const data = await promise;
      const entry: CacheEntry<TData> = {
        data,
        timestamp: Date.now(),
      };

      await this.store.set(cacheKey, entry, { expireIn: cacheTime });
      return data;
    } finally {
      inflightRequests.delete(inflightKey);
    }
  }

  /**
   * Refresh a stale cache entry without blocking the caller that consumed the
   * previous cached value.
   */
  private revalidateInBackground<TData>(
    queryFn: () => Promise<TData>,
    cacheKey: Deno.KvKey,
    cacheTime: number,
  ): void {
    void (async () => {
      try {
        const data = await queryFn();
        const entry: CacheEntry<TData> = {
          data,
          timestamp: Date.now(),
        };

        await this.store.set(cacheKey, entry, { expireIn: cacheTime });
      } catch {
        // Preserve stale-while-revalidate semantics without surfacing package-
        // level background refresh noise.
      }
    })();
  }

  /**
   * Invalidate a single query key.
   *
   * @param queryKey - Canonical query key.
   */
  async invalidate(queryKey: QueryKey): Promise<void> {
    await this.store.delete(toCacheStoreKey(queryKey));
  }

  /**
   * Invalidate all cached entries sharing a query-key prefix.
   *
   * @param queryKeyPrefix - Prefix to invalidate.
   */
  async invalidateQueries(queryKeyPrefix: QueryKey): Promise<void> {
    const prefix = toCacheStoreKey(queryKeyPrefix);
    const deletions: Promise<void>[] = [];

    for await (const entry of this.store.list({ prefix })) {
      deletions.push(this.store.delete(entry.key));
    }

    await Promise.all(deletions);
  }

  /**
   * Prefetch data using the standard cache-query path.
   *
   * @param queryKey - Canonical query key.
   * @param options - Cache policy and fetcher.
   */
  async prefetch<TData>(
    queryKey: QueryKey,
    options: CacheQueryOptions<TData>,
  ): Promise<void> {
    await this.query(queryKey, options).catch(() => undefined);
  }

  /**
   * Return cached data without fetching.
   *
   * @param queryKey - Canonical query key.
   * @returns Cached data or `null`.
   */
  async getCachedData<TData>(queryKey: QueryKey): Promise<TData | null> {
    const cached = await this.store.get<CacheEntry<TData>>(toCacheStoreKey(queryKey));
    return cached.value?.data ?? null;
  }

  /**
   * Return cached data together with its cache timestamp.
   *
   * @param queryKey - Canonical query key.
   * @returns Cached entry metadata or `null`.
   */
  async getCachedEntry<TData>(queryKey: QueryKey): Promise<CachedEntry<TData> | null> {
    const cached = await this.store.get<CacheEntry<TData>>(toCacheStoreKey(queryKey));
    return cached.value ? toCachedEntry(cached.value) : null;
  }

  /**
   * Set cached data directly.
   *
   * @param queryKey - Canonical query key.
   * @param data - Data to cache.
   * @param cacheTime - Cache retention in milliseconds.
   */
  async setCachedData<TData>(
    queryKey: QueryKey,
    data: TData,
    cacheTime = DEFAULT_CACHE_TIME_MS,
  ): Promise<void> {
    const entry: CacheEntry<TData> = {
      data,
      timestamp: Date.now(),
    };

    await this.store.set(toCacheStoreKey(queryKey), entry, { expireIn: cacheTime });
  }

  /**
   * Close the underlying cache store.
   */
  async close(): Promise<void> {
    await this.store.close();
  }
}

/**
 * Shared cache-query singleton.
 */
export const cacheQuery: CacheQuery = new CacheQuery();
