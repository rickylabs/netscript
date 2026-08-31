/**
 * `@netscript/sdk/cache` server-side cache primitives.
 *
 * Import this subpath from loaders, services, background jobs, or other
 * server-side code that is allowed to touch Deno KV. It exports the `CacheQuery`
 * SWR engine, the KV-backed `KvCacheStore`, cache key helpers, cached-entry
 * helpers, and the cache-provider registration seam.
 *
 * Importing this module is load-time pure. A custom server composition root
 * must explicitly call `setCacheProvider(cacheQuery)` before cache-aware query
 * methods execute. `defineFreshApp()` performs that registration for
 * NetScript-managed Fresh apps. Browser bundles should prefer query-client
 * helpers and avoid importing this server-only module.
 *
 * @module
 */

export { CacheQuery, cacheQuery } from './cache-query.ts';
export {
  CACHE_NAMESPACE_MAX_LENGTH,
  CacheEvents,
  normalizeCacheNamespace,
} from './cache-telemetry.ts';
export type {
  CacheSpanAttributes,
  CacheSpanName,
  CacheTelemetry,
  CacheTelemetryParent,
  CacheTelemetrySpan,
} from './cache-telemetry.ts';
export { KvCacheStore } from './kv-cache-store.ts';
export type { CachedEntry, CacheEntry } from '../ports/cache-entry.ts';
export type {
  CacheInvalidationReport,
  CacheInvalidationTopologyReport,
  CacheLookupReport,
  CacheProviderDescriptor,
  CacheReadTopologyReport,
  CacheTopologyOutcome,
  CacheTopologyTier,
  CacheWriteReport,
  CacheWriteTopologyReport,
} from '../ports/cache-topology.ts';
export { isCacheEntryStale, toCachedEntry } from '../ports/cache-entry.ts';
export type { CacheQueryOptions, QueryParams } from '../ports/query-options.ts';
export type { QueryKey, QueryKeyPart } from '../ports/query-key.ts';
export { createActionQueryKey, serializeQueryKeyInput } from '../ports/query-key.ts';

// Re-export the provider API for explicit server registration and testing.
export {
  type CacheProvider,
  getCacheProvider,
  hasCacheProvider,
  resetCacheProvider,
  setCacheProvider,
} from './cache-provider.ts';
