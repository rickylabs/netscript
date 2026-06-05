import { type CachedEntry, isCacheEntryStale as isSdkCacheEntryStale } from '@netscript/sdk/cache';

export type CacheEntryLike<T> = CachedEntry<T>;

interface ListCacheEntryLike<TItem> {
  data: { items: TItem[] };
  cachedAt: number;
}

export const isCacheEntryStale = isSdkCacheEntryStale;

export function hasAllCacheEntries(
  entries: ReadonlyArray<CacheEntryLike<unknown> | null | undefined>,
): boolean {
  return entries.every((entry) => !!entry);
}

export function minCachedAt(
  entries: ReadonlyArray<CacheEntryLike<unknown> | null | undefined>,
): number | undefined {
  const ready = entries.filter((entry): entry is CacheEntryLike<unknown> =>
    entry !== null && entry !== undefined
  );
  if (ready.length === 0) return undefined;
  return Math.min(...ready.map((entry) => entry.cachedAt));
}

export function projectCachedItemFromList<TItem>(
  listEntry: ListCacheEntryLike<TItem> | null | undefined,
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
