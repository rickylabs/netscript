/**
 * Cache provider registry — dependency injection seam for the SDK.
 *
 * This module holds a module-scoped reference to the cache-query engine.
 * It contains **zero** server-only imports (no @netscript/kv, no
 * @netscript/logger, no node:async_hooks) so it is safe to import from
 * client-side code.
 *
 * Server bootstrap calls {@link setCacheProvider} once at startup to wire
 * the KV-backed cache engine. Client code never calls it — cache methods
 * on query factories will throw a clear error if invoked without a provider.
 *
 * @module
 */

import type { CachedEntry } from '../ports/cache-entry.ts';
import type { QueryKey } from '../ports/query-key.ts';
import type { CacheQueryOptions } from '../ports/query-options.ts';
import type { CacheProviderDescriptor } from '../ports/cache-topology.ts';

/**
 * Minimal interface that the query-factory layer needs from the cache engine.
 * Matches the public surface of {@link CacheQuery} without importing it.
 */
export interface CacheProvider {
  /** Stable provider identity and fallback tier for telemetry. */
  readonly descriptor: CacheProviderDescriptor;
  /** Execute a query through the registered cache engine. */
  query<TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<TData>;
  /** Prefetch a query through the registered cache engine. */
  prefetch<TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<void>;
  /** Read cached data for a query key without fetching. */
  getCachedData<TData>(queryKey: QueryKey): Promise<TData | null>;
  /** Read cached data and timestamp metadata for a query key. */
  getCachedEntry<TData>(queryKey: QueryKey): Promise<CachedEntry<TData> | null>;
  /** Invalidate all cached entries under a query-key prefix. */
  invalidateQueries(prefix: QueryKey): Promise<void>;
}

let _provider: CacheProvider | null = null;

function createProviderBoundary(provider: CacheProvider): CacheProvider {
  return {
    get descriptor(): CacheProviderDescriptor {
      return provider.descriptor;
    },
    query: <TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<TData> =>
      provider.query(queryKey, options),
    prefetch: <TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<void> =>
      provider.prefetch(queryKey, options),
    getCachedData: <TData>(queryKey: QueryKey): Promise<TData | null> =>
      provider.getCachedData(queryKey),
    getCachedEntry: <TData>(queryKey: QueryKey): Promise<CachedEntry<TData> | null> =>
      provider.getCachedEntry(queryKey),
    invalidateQueries: (prefix: QueryKey): Promise<void> => provider.invalidateQueries(prefix),
  };
}

/**
 * Register the cache engine. Call once during server bootstrap.
 *
 * @example
 * ```ts
 * import { cacheQuery } from '@netscript/sdk/cache';
 * import { setCacheProvider } from '@netscript/sdk/query';
 *
 * setCacheProvider(cacheQuery);
 * ```
 */
export function setCacheProvider(provider: CacheProvider): void {
  _provider = createProviderBoundary(provider);
}

/**
 * Retrieve the registered cache provider.
 *
 * @throws {Error} If called before {@link setCacheProvider}.
 */
export function getCacheProvider(): CacheProvider {
  if (!_provider) {
    throw new Error(
      '[NetScript SDK] Cache provider not initialized. ' +
        "Add `import '@netscript/sdk/cache';` to your server entrypoint to register it, " +
        'or call setCacheProvider(cacheQuery) during server bootstrap. ' +
        'If you see this in the browser, a server-only cache method ' +
        '(query, prefetch, getCachedData, getCachedEntry, invalidate) ' +
        'was called from client-side code — use queryOptions/mutationOptions/clientKey instead.',
    );
  }
  return _provider;
}

/**
 * Check whether a cache provider has been registered.
 */
export function hasCacheProvider(): boolean {
  return _provider !== null;
}

/**
 * Reset the cache provider. Primarily for testing.
 */
export function resetCacheProvider(): void {
  _provider = null;
}
