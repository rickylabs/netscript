/**
 * Cache query option contracts.
 *
 * @module
 */

/**
 * Cache policy overrides for a query execution.
 */
export interface QueryParams {
  /** How long data is considered fresh in milliseconds. */
  staleTime?: number;
  /** How long to keep data in cache in milliseconds. */
  cacheTime?: number;
  /** Enable background revalidation when data is stale. */
  revalidateOnStale?: boolean;
  /**
   * When true, stale entries trigger a blocking refetch instead of returning
   * stale data immediately.
   */
  preferFreshOnStale?: boolean;
}

/**
 * Full cache-query execution options.
 *
 * @typeParam TData - Payload returned by the fetcher.
 */
export interface CacheQueryOptions<TData> extends QueryParams {
  /** Async fetcher that resolves the requested payload. */
  queryFn: () => Promise<TData>;
}
