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

/**
 * Minimal interface that the query-factory layer needs from the cache engine.
 * Matches the public surface of {@link CacheQuery} without importing it.
 */
export interface CacheProvider {
  query<TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<TData>;
  prefetch<TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<void>;
  getCachedData<TData>(queryKey: QueryKey): Promise<TData | null>;
  getCachedEntry<TData>(queryKey: QueryKey): Promise<CachedEntry<TData> | null>;
  invalidateQueries(prefix: QueryKey): Promise<void>;
}

let _provider: CacheProvider | null = null;

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
  _provider = provider;
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
        'Call setCacheProvider(cacheQuery) during server bootstrap. ' +
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
