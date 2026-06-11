/**
 * Cache primitives for the NetScript SDK.
 *
 * **Server-only module.** Importing this module automatically registers the
 * KV-backed cache engine as the SDK's cache provider so that query-factory
 * and composite-query cache methods work out of the box.
 *
 * @module
 */

import { setCacheProvider } from '../src/cache/cache-provider.ts';
import { cacheQuery } from '../src/cache/cache-query.ts';

// Auto-register: any server-side code that imports @netscript/sdk/cache
// gets the KV-backed CacheQuery wired as the global cache provider.
setCacheProvider(cacheQuery);

export { CacheQuery, cacheQuery } from '../src/cache/cache-query.ts';
export type { CachedEntry, CacheEntry } from '../src/interfaces/cache-entry.ts';
export { isCacheEntryStale, toCachedEntry } from '../src/interfaces/cache-entry.ts';
export type { CacheQueryOptions, QueryParams } from '../src/interfaces/query-options.ts';
export type { QueryKey, QueryKeyPart } from '../src/interfaces/query-key.ts';
export { createActionQueryKey, serializeQueryKeyInput } from '../src/interfaces/query-key.ts';

// Re-export the provider API for manual registration and testing.
export {
  type CacheProvider,
  getCacheProvider,
  hasCacheProvider,
  resetCacheProvider,
  setCacheProvider,
} from '../src/cache/cache-provider.ts';
