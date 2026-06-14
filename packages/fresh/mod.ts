/**
 * Root convenience entrypoint for commonly shared `@netscript/fresh` helpers.
 *
 * Prefer explicit subpaths such as `@netscript/fresh/builders`,
 * `@netscript/fresh/route`, `@netscript/fresh/form`, and
 * `@netscript/fresh/defer` for new package consumers. The root surface remains
 * intentionally curated so existing apps can keep importing the small set of
 * runtime helpers they already depend on.
 *
 * @module
 */

export {
  ErrorDisplay,
  type ErrorDisplayContent,
  type ErrorDisplayProps,
  type ErrorPrimitives,
} from './src/diagnostics/error/mod.ts';
export {
  type ErrorData,
  errorHandler,
  type ErrorType,
  extractData,
  extractErrorData,
  hasError,
  type LoaderResult,
} from './src/diagnostics/error/mod.ts';
export {
  type CachedListEntryLike,
  type CacheEntryLike,
  hasAllCacheEntries,
  minCachedAt,
  projectCachedItemFromList,
} from './src/application/cache-entries/mod.ts';
