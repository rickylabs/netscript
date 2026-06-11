/**
 * SDK-typed TanStack DB collection factory.
 *
 * Wraps `@tanstack/db`'s `createCollection` with `@tanstack/query-db-collection`'s
 * `queryCollectionOptions` to produce collections that use the existing oRPC
 * service clients, with full type safety from contracts.
 *
 * @module
 */

import { createCollection } from '@tanstack/db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import type { QueryClient } from '@tanstack/query-core';
import type { QueryClientPort } from '../ports/query-client.ts';

/**
 * Options for `createQueryCollection`.
 */
export interface QueryCollectionOptions<TItem extends Record<string, unknown>> {
  /** Unique resource name (e.g., 'orders'). */
  resource: string;
  /** TanStack Query key for the collection's list query. */
  queryKey: readonly unknown[];
  /** Async function that fetches the list of items. */
  queryFn: () => Promise<TItem[]>;
  /** Extract a unique key from each item. */
  getKey: (item: TItem) => string | number;
  /** Structural TanStack Query client port. */
  queryClient: QueryClientPort;
}

/**
 * Create a TanStack DB collection backed by TanStack Query for data fetching.
 *
 * This factory bridges TanStack DB's reactive collection model with TanStack
 * Query's caching and synchronization. The resulting collection supports:
 * - Live queries via `useLiveQuery()`
 * - Optimistic mutations via `collection.update()`
 * - Automatic sync through TanStack Query's cache
 *
 * @example
 * ```ts
 * import { createQueryCollection } from '@netscript/sdk/collections';
 * import { getIslandQueryClient } from '@netscript/fresh/query';
 *
 * const ordersCollection = createQueryCollection({
 *   resource: 'orders',
 *   queryKey: ['orders', 'list'],
 *   queryFn: () => ordersClient.list({ page: 1, limit: 100 }),
 *   getKey: (order) => order.id,
 *   queryClient: getIslandQueryClient(),
 * });
 * ```
 */
export function createQueryCollection<TItem extends Record<string, unknown>>(
  options: QueryCollectionOptions<TItem>,
) {
  const { queryKey, queryFn, getKey, queryClient } = options;

  return createCollection(
    queryCollectionOptions({
      queryKey: queryKey as unknown[],
      queryFn: () => queryFn(),
      getKey,
      // TanStack DB expects the concrete upstream QueryClient type. The public
      // SDK option is structural to keep upstream types out of the surface; a
      // real QueryClient from `createNetScriptQueryClient()` is assignable here.
      queryClient: queryClient as QueryClient,
    }),
  );
}
