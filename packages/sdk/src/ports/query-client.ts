/**
 * Package-owned structural port for TanStack-compatible query clients.
 *
 * @module
 */

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
 * Structural query-client port used by sdk factories and collection adapters.
 */
export interface QueryClientPort {
  /** Read cached data; driven by sdk query helpers and TanStack DB collection reads. */
  getQueryData<TData = unknown>(queryKey: readonly unknown[]): TData | undefined;

  /** Write cached data; driven by TanStack DB optimistic collection updates. */
  setQueryData<TData = unknown>(
    queryKey: readonly unknown[],
    updater: TData | ((oldData: TData | undefined) => TData | undefined),
    options?: QueryClientSetOptions,
  ): TData | undefined;

  /** Invalidate cache entries; driven by sdk query factories and Fresh island mutations. */
  invalidateQueries(filters?: QueryClientFilters): Promise<void>;

  /** Fetch and cache query data; driven by server prefetch and collection loading. */
  fetchQuery<TData = unknown>(options: QueryClientFetchOptions<TData>): Promise<TData>;

  /** Expose the underlying query cache; driven by TanStack DB collection synchronization. */
  getQueryCache(): unknown;

  /** Attach focus/online listeners; driven by Fresh island QueryClient lifecycle. */
  mount(): void;

  /** Detach focus/online listeners; driven by Fresh island QueryClient lifecycle. */
  unmount(): void;

  /** Clear cached data; driven by Fresh test and reset helpers. */
  clear(): void;
}
