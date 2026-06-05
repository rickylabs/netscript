/**
 * Browser-facing interactive helpers for `@netscript/fresh`.
 *
 * This entrypoint is intentionally limited to package-owned interactive seams.
 * Route builders, server helpers, and copy-based UI registry code stay on
 * explicit subpaths.
 *
 * @module
 */

export {
  resolvedPromise,
  usePromise,
} from './hooks/use-promise.ts';
