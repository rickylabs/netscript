/**
 * Cache-entry helpers for page loaders and partial orchestration.
 *
 * @module
 */

import {
  type CachedListEntryLike,
  type CacheEntryLike,
  hasAllCacheEntries as hasAllCacheEntriesImpl,
  minCachedAt as minCachedAtImpl,
  projectCachedItemFromList as projectCachedItemFromListImpl,
} from './cache-entry.ts';

export type { CachedListEntryLike, CacheEntryLike };

/**
 * Return `true` when every supplied entry is present.
 */
export function hasAllCacheEntries(
  entries: ReadonlyArray<CacheEntryLike<unknown> | null | undefined>,
): boolean {
  return hasAllCacheEntriesImpl(entries);
}

/**
 * Return the oldest `cachedAt` timestamp across the supplied entries.
 */
export function minCachedAt(
  entries: ReadonlyArray<CacheEntryLike<unknown> | null | undefined>,
): number | undefined {
  return minCachedAtImpl(entries);
}

/**
 * Project a single cached item from a cached list response while preserving the list timestamp.
 */
export function projectCachedItemFromList<TItem>(
  listEntry: CachedListEntryLike<TItem> | null | undefined,
  predicate: (item: TItem) => boolean,
): CacheEntryLike<TItem> | undefined {
  return projectCachedItemFromListImpl(listEntry, predicate);
}
