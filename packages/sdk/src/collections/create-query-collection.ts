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

/** Collection status values exposed by the SDK collection port. */
export type QueryCollectionStatus = 'idle' | 'loading' | 'ready' | 'error' | 'cleaned-up';

/** Opaque transaction returned by collection mutation operations. */
export interface QueryCollectionTransaction {
  /** Promise-like persistence state exposed by TanStack DB transactions. */
  readonly isPersisted?: {
    /** Resolves when the mutation is persisted by the configured handler. */
    readonly promise: Promise<unknown>;
  };
}

/** Callback used to update one collection item. */
export type QueryCollectionUpdate<TItem> = (draft: TItem) => void;

/** Callback used to update multiple collection items. */
export type QueryCollectionUpdateMany<TItem> = (drafts: TItem[]) => void;

/** Structural collection returned by `createQueryCollection()`. */
export interface QueryCollection<TItem extends object> {
  /** Collection identifier generated from the resource name. */
  readonly id: string;
  /** Current collection sync status. */
  readonly status: QueryCollectionStatus | string;
  /** Number of active collection subscribers. */
  readonly subscriberCount: number;
  /** Number of currently materialized items. */
  readonly size: number;
  /** Whether the collection is ready for reads. */
  isReady(): boolean;
  /** Start loading collection data. */
  preload(): Promise<void>;
  /** Read one item by key. */
  get(key: string | number): TItem | undefined;
  /** Check whether one item key is present. */
  has(key: string | number): boolean;
  /** Iterate collection keys. */
  keys(): IterableIterator<string | number>;
  /** Iterate collection values. */
  values(): IterableIterator<TItem>;
  /** Iterate collection entries. */
  entries(): IterableIterator<[string | number, TItem]>;
  /** Iterate collection entries by default. */
  [Symbol.iterator](): IterableIterator<[string | number, TItem]>;
  /** Run a callback for each item. */
  forEach(callback: (item: TItem, key: string | number, index: number) => void): void;
  /** Map collection items to an array. */
  map<TResult>(callback: (item: TItem, key: string | number, index: number) => TResult): TResult[];
  /** Snapshot collection items as an array. */
  readonly toArray: TItem[];
  /** Wait for initial data and snapshot collection items. */
  toArrayWhenReady(): Promise<TItem[]>;
  /** Insert one or more items. */
  insert(items: TItem | TItem[]): QueryCollectionTransaction;
  /** Update one item by key. */
  update(key: string | number, callback: QueryCollectionUpdate<TItem>): QueryCollectionTransaction;
  /** Update one item by key with metadata/config. */
  update(
    key: string | number,
    config: Record<string, unknown>,
    callback: QueryCollectionUpdate<TItem>,
  ): QueryCollectionTransaction;
  /** Update multiple items by key. */
  update(
    keys: Array<string | number>,
    callback: QueryCollectionUpdateMany<TItem>,
  ): QueryCollectionTransaction;
  /** Update multiple items by key with metadata/config. */
  update(
    keys: Array<string | number>,
    config: Record<string, unknown>,
    callback: QueryCollectionUpdateMany<TItem>,
  ): QueryCollectionTransaction;
  /** Delete one or more items by key. */
  delete(
    key: string | number | Array<string | number>,
    config?: Record<string, unknown>,
  ): QueryCollectionTransaction;
}

/**
 * Options for `createQueryCollection`.
 */
export interface QueryCollectionOptions<TItem extends object> {
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
export function createQueryCollection<TItem extends object>(
  options: QueryCollectionOptions<TItem>,
): QueryCollection<TItem> {
  const { queryKey, queryFn, getKey, queryClient } = options;

  const collection: unknown = createCollection(
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
  return collection as QueryCollection<TItem>;
}
