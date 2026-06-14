import { isCacheEntryStale as isSdkCacheEntryStale } from '@netscript/sdk/cache';

/** Cached-entry shape shared by page loaders and partial orchestration. */
export interface CacheEntryLike<T> {
  /** Cached payload. */
  readonly data: T;
  /** Unix epoch timestamp in milliseconds. */
  readonly cachedAt: number;
}

/** Cached list-entry shape used when projecting a single list item. */
export interface CachedListEntryLike<TItem> {
  /** Cached list payload. */
  data: { items: TItem[] };
  /** Unix epoch timestamp in milliseconds. */
  cachedAt: number;
}

/** Return whether an SDK cache entry is stale. */
export const isCacheEntryStale = isSdkCacheEntryStale;

/** Return `true` when every supplied entry is present. */
export function hasAllCacheEntries(
  entries: ReadonlyArray<CacheEntryLike<unknown> | null | undefined>,
): boolean {
  return entries.every((entry) => !!entry);
}

/** Return the oldest `cachedAt` timestamp across the supplied entries. */
export function minCachedAt(
  entries: ReadonlyArray<CacheEntryLike<unknown> | null | undefined>,
): number | undefined {
  const ready = entries.filter((entry): entry is CacheEntryLike<unknown> =>
    entry !== null && entry !== undefined
  );
  if (ready.length === 0) return undefined;
  return Math.min(...ready.map((entry) => entry.cachedAt));
}

/** Project a single cached item from a cached list while preserving its timestamp. */
export function projectCachedItemFromList<TItem>(
  listEntry: CachedListEntryLike<TItem> | null | undefined,
  predicate: (item: TItem) => boolean,
): CacheEntryLike<TItem> | undefined {
  if (!listEntry) return undefined;
  const matched = listEntry.data.items.find(predicate);
  if (!matched) return undefined;
  return {
    data: matched,
    cachedAt: listEntry.cachedAt,
  };
}
