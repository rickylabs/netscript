/**
 * Root entry for `@netscript/fresh`.
 *
 * Exposes the cross-cutting page-loader cache helpers. Every other capability
 * lives on an explicit subpath: `./builders`, `./route`, `./form`, `./defer`,
 * `./query`, `./server`, `./streams`, `./interactive`, `./vite`, `./error`,
 * `./desktop`, and `./testing`.
 *
 * @module
 */
export {
  type CachedListEntryLike,
  type CacheEntryLike,
  hasAllCacheEntries,
  minCachedAt,
  projectCachedItemFromList,
} from './src/application/cache-entries/mod.ts';
