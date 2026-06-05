/**
 * Cache-entry helpers for page loaders and partial orchestration.
 *
 * @module
 */

import {
  hasAllCacheEntries as hasAllCacheEntriesImpl,
  minCachedAt as minCachedAtImpl,
  projectCachedItemFromList as projectCachedItemFromListImpl,
} from './cache-entry.ts';

/**
 * Minimal cached-entry shape consumed by the public helpers.
 */
export interface CacheEntryLike<T> {
  /** Cached payload. */
  readonly data: T;
  /** Unix epoch timestamp in milliseconds. */
  readonly cachedAt: number;
}

/**
 * Cached list-entry shape used when projecting a single item from a list.
 */
export interface CachedListEntryLike<TItem> extends CacheEntryLike<{ items: TItem[] }> {}

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
