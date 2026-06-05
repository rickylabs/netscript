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
  type ErrorDisplayProps,
  type ErrorPrimitives,
} from './components/ErrorDisplay.tsx';
export {
  errorHandler,
  extractData,
  extractErrorData,
  hasError,
  type ErrorData,
  type ErrorType,
  type LoaderResult,
} from './error/handler.ts';
export {
  DeferComponent,
  DeferPage,
  DEFER_POLICY,
  DEFER_STALE_MS,
  DETAIL_FORCE_REFRESH_POLICY,
  resolveDetailDeferConfig,
} from './defer/mod.ts';
export {
  hasAllCacheEntries,
  minCachedAt,
  projectCachedItemFromList,
} from './utils/mod.ts';
