/**
 * Package-owned structural port for TanStack-compatible query clients.
 *
 * @module
 */

import type { QueryClient } from '@tanstack/query-core';

/** Predicate filters query cache operations by key or implementation-specific metadata. */
export type QueryClientPredicate = (query: unknown) => boolean;

/** Cache selector accepted by invalidation and lookup operations. */
export interface QueryClientFilters {
  /** Query key prefix used by sdk query factories and collection invalidation. */
  readonly queryKey?: readonly unknown[];
  /** Query predicate used by TanStack DB collection synchronization. */
  readonly predicate?: QueryClientPredicate;
  /** Implementation-specific filter fields accepted by the underlying client. */
  readonly [key: string]: unknown;
}

/** Options accepted by query fetch operations. */
export interface QueryClientFetchOptions<TData = unknown> extends QueryClientFilters {
  /** Query function used by TanStack DB collection loading. */
  readonly queryFn?: () => TData | Promise<TData>;
}

/** Options accepted by cache write operations. */
export interface QueryClientSetOptions {
  /** Implementation-specific write options accepted by the underlying client. */
  readonly [key: string]: unknown;
}

/**
 * Narrow query-client port used by SDK collection and query adapters.
 *
 * The method signatures are selected from TanStack's concrete client instead
 * of being copied, so a `QueryClient` always satisfies this port as upstream
 * generic signatures evolve.
 */
export type QueryClientPort = Pick<
  QueryClient,
  | 'getQueryData'
  | 'setQueryData'
  | 'invalidateQueries'
  | 'fetchQuery'
  | 'getQueryCache'
  | 'mount'
  | 'unmount'
  | 'clear'
>;
