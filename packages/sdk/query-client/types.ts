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
  readonly queryKey: readonly unknown[];
  readonly queryFn: () => Promise<TData>;
  readonly initialData?: TData;
  readonly initialDataUpdatedAt?: number;
  readonly staleTime: number;
}

/**
 * Configuration for ActionMethod.mutationOptions().
 */
export interface ActionMutationOptions {
  /** Optional callbacks merged into the TanStack mutation config. */
  onSuccess?: (...args: unknown[]) => void;
  onError?: (...args: unknown[]) => void;
  onSettled?: (...args: unknown[]) => void;
  onMutate?: (...args: unknown[]) => unknown;
}

/**
 * TanStack Query-compatible mutation options produced by
 * `ActionMethod.mutationOptions()`.
 */
export interface MutationOptionsResult<TData, TInput> {
  readonly mutationKey: readonly unknown[];
  readonly mutationFn: (input: TInput) => Promise<TData>;
}
