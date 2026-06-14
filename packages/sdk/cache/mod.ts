/**
 * `@netscript/sdk/cache` server-side cache primitives.
 *
 * Import this subpath from loaders, services, background jobs, or other
 * server-side code that is allowed to touch Deno KV. It exports the `CacheQuery`
 * SWR engine, the KV-backed `KvCacheStore`, cache key helpers, cached-entry
 * helpers, and the cache-provider registration seam.
 *
 * Importing this module registers the shared `cacheQuery` provider so
 * `@netscript/sdk/query` factories can execute cache-aware methods without
 * additional setup. Browser bundles should prefer query-client helpers and
 * avoid importing this server-only module.
 *
 * @module
 */

import { setCacheProvider } from '../src/cache/cache-provider.ts';
import { cacheQuery } from '../src/cache/cache-query.ts';

// Auto-register: any server-side code that imports @netscript/sdk/cache
// gets the KV-backed CacheQuery wired as the global cache provider.
setCacheProvider(cacheQuery);

export { CacheQuery, cacheQuery } from '../src/cache/cache-query.ts';
export { KvCacheStore } from '../src/cache/kv-cache-store.ts';
export type { CachedEntry, CacheEntry } from '../src/ports/cache-entry.ts';
export { isCacheEntryStale, toCachedEntry } from '../src/ports/cache-entry.ts';
export type { CacheQueryOptions, QueryParams } from '../src/ports/query-options.ts';
export type { QueryKey, QueryKeyPart } from '../src/ports/query-key.ts';
export { createActionQueryKey, serializeQueryKeyInput } from '../src/ports/query-key.ts';

// Re-export the provider API for manual registration and testing.
export {
  type CacheProvider,
  getCacheProvider,
  hasCacheProvider,
  resetCacheProvider,
  setCacheProvider,
} from '../src/cache/cache-provider.ts';
