/**
 * TanStack Query option types for the SDK ActionMethod extensions.
 *
 * @module
 */

/**
 * Configuration for ActionMethod.queryOptions() — the bridge between
 * server-side SDK caching and client-side TanStack Query.
 *
 * NOTE: Server-to-client hydration flows through `initialData` props, not
 * through the options factory. The server loader calls `getCachedEntry()` and
 * passes the result as island props. The island then sets `initialData` and
 * `initialDataUpdatedAt` on the returned query options. See RFC 17 §3.4.
 */
export interface ActionQueryOptions {
  /** Override staleTime for the client-side cache (default: inherits from server factory). */
  staleTime?: number;
}

/**
 * TanStack Query-compatible options produced by `ActionMethod.queryOptions()`.
 */
export interface QueryOptionsWithInitialData<TData> {
  /** Stable TanStack Query key for this action invocation. */
  readonly queryKey: readonly unknown[];
  /** Fetcher used by TanStack Query to execute the action. */
  readonly queryFn: () => Promise<TData>;
  /** Optional hydrated payload supplied by a server loader. */
  readonly initialData?: TData;
  /** Timestamp used by TanStack Query to age hydrated payloads. */
  readonly initialDataUpdatedAt?: number;
  /** Freshness window used by the client-side cache. */
  readonly staleTime: number;
}

/**
 * Configuration for ActionMethod.mutationOptions().
 */
export interface ActionMutationOptions {
  /** Optional callbacks merged into the TanStack mutation config. */
  onSuccess?: (...args: unknown[]) => void;
  /** Callback invoked when the mutation fails. */
  onError?: (...args: unknown[]) => void;
  /** Callback invoked after either mutation success or failure. */
  onSettled?: (...args: unknown[]) => void;
  /** Callback invoked before the mutation function runs. */
  onMutate?: (...args: unknown[]) => unknown;
}

/**
 * TanStack Query-compatible mutation options produced by
 * `ActionMethod.mutationOptions()`.
 */
export interface MutationOptionsResult<TData, TInput> {
  /** Stable TanStack Mutation key for this action. */
  readonly mutationKey: readonly unknown[];
  /** Mutation function used by TanStack Query. */
  readonly mutationFn: (input: TInput) => Promise<TData>;
}
