/**
 * `@netscript/sdk/collections` TanStack DB collection integration.
 *
 * This subpath creates query-backed collections from SDK query clients. The
 * public return type is the package-owned `QueryCollection<TItem>` port, which
 * exposes common collection reads, preloading, cleanup, and mutation helpers
 * without leaking TanStack DB internals.
 *
 * Use this subpath for repeated list/detail workflows that benefit from local
 * collection state. Use `@netscript/sdk/query-client` for lower-level TanStack
 * Query options and client key helpers.
 *
 * @module
 */

export {
  createQueryCollection,
  type QueryCollection,
  type QueryCollectionOptions,
  type QueryCollectionStatus,
  type QueryCollectionTransaction,
  type QueryCollectionUpdate,
  type QueryCollectionUpdateMany,
} from './create-query-collection.ts';
