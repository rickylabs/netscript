/**
 * `@netscript/sdk/collections` — TanStack DB collections with SDK integration.
 *
 * This subpath provides factory functions for creating TanStack DB collections
 * backed by TanStack Query, using the SDK's typed service clients. Collections
 * support live queries, optimistic mutations, and cross-collection joins.
 *
 * @module
 */

export { createQueryCollection, type QueryCollectionOptions } from './create-query-collection.ts';
