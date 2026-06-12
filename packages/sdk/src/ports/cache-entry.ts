/**
 * Canonical cache entry contracts used across the SDK and Fresh integration.
 *
 * @module
 */

/**
 * Persisted cache payload stored by the SDK cache engine.
 *
 * @typeParam TData - Cached data payload type.
 */
export interface CacheEntry<TData> {
  /** Cached data payload. */
  data: TData;
  /** Unix timestamp in milliseconds when the payload was written. */
  timestamp: number;
}

/**
 * Public cache entry shape returned to framework consumers.
 *
 * @typeParam TData - Cached data payload type.
 */
export interface CachedEntry<TData> {
  /** Cached data payload. */
  data: TData;
  /** Unix timestamp in milliseconds when the payload was written. */
  cachedAt: number;
}

/**
 * Convert a persisted cache entry into the public cached-entry shape.
 *
 * @param entry - Persisted cache entry.
 * @returns Public cached entry.
 */
export function toCachedEntry<TData>(entry: CacheEntry<TData>): CachedEntry<TData> {
  return {
    data: entry.data,
    cachedAt: entry.timestamp,
  };
}

/**
 * Determine whether a cached entry is stale for a given freshness window.
 *
 * @param entry - Cached entry to evaluate.
 * @param staleTime - Freshness window in milliseconds.
 * @returns `true` when the entry is older than the freshness window.
 */
export function isCacheEntryStale(
  entry: CachedEntry<unknown>,
  staleTime: number | undefined,
): boolean {
  if (staleTime === undefined) {
    return false;
  }

  if (!Number.isFinite(staleTime)) {
    return false;
  }

  return (Date.now() - entry.cachedAt) > staleTime;
}
