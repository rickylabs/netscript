/**
 * Internal composite-query implementation.
 *
 * @module
 */

import { getCacheProvider } from '../cache/cache-provider.ts';
import { DEFAULT_QUERY_CACHE_TIME, DEFAULT_QUERY_STALE_TIME } from '../cache/defaults.ts';
import { serializeQueryKeyInput } from '../ports/query-key.ts';
import type { CompositeQuery } from '../ports/query-factory.ts';
import type { QueryParams } from '../ports/query-options.ts';
import { normalizeCacheNamespace } from '../cache/cache-telemetry.ts';

/**
 * Create a composite query that combines multiple endpoints under one cache key.
 *
 * @param config - Composite query configuration.
 * @returns Composite query helper.
 */
export function createCompositeQuery<
  TProps,
  TOutput,
  const TKey extends readonly string[] = readonly string[],
>({
  key,
  queryFn,
  defaultOptions = {},
}: {
  /** Base cache key prefix. */
  key: TKey;
  /** Async fetcher that combines multiple data sources. */
  queryFn: (props: TProps) => Promise<TOutput>;
  /** Default cache policy for the composite query. */
  defaultOptions?: QueryParams;
}): CompositeQuery<TProps, TOutput, TKey> {
  const {
    staleTime: defaultStaleTime = DEFAULT_QUERY_STALE_TIME,
    cacheTime: defaultCacheTime = DEFAULT_QUERY_CACHE_TIME,
    revalidateOnStale: defaultRevalidateOnStale = true,
    preferFreshOnStale: defaultPreferFreshOnStale = false,
  } = defaultOptions;
  const defaultOperationId = normalizeCacheNamespace(defaultOptions.operationId, 'composite');

  const compositeQuery = async (
    props: TProps,
    options: QueryParams = {},
  ): Promise<TOutput> => {
    const {
      staleTime = defaultStaleTime,
      cacheTime = defaultCacheTime,
      revalidateOnStale = defaultRevalidateOnStale,
      preferFreshOnStale = defaultPreferFreshOnStale,
      operationId = defaultOperationId,
    } = options;

    return await getCacheProvider().query(
      [...key, serializeQueryKeyInput(props)] as const,
      {
        staleTime,
        cacheTime,
        revalidateOnStale,
        preferFreshOnStale,
        operationId,
        queryFn: () => queryFn(props),
      },
    );
  };

  compositeQuery.invalidate = async (): Promise<void> => {
    await getCacheProvider().invalidateQueries([...key], defaultOperationId);
  };

  compositeQuery.getCachedData = async (props: TProps): Promise<TOutput | null> => {
    return await getCacheProvider().getCachedData(
      [...key, serializeQueryKeyInput(props)] as const,
      defaultOperationId,
    );
  };

  compositeQuery.getCachedEntry = async (props: TProps) => {
    return await getCacheProvider().getCachedEntry(
      [...key, serializeQueryKeyInput(props)] as const,
      defaultOperationId,
    );
  };

  compositeQuery.key = (props: TProps): readonly [...TKey, string] => {
    return [...key, serializeQueryKeyInput(props)] as const;
  };

  compositeQuery.prefetch = (props: TProps, options: QueryParams = {}): void => {
    const {
      staleTime = defaultStaleTime,
      cacheTime = defaultCacheTime,
      revalidateOnStale = defaultRevalidateOnStale,
      preferFreshOnStale = defaultPreferFreshOnStale,
      operationId = defaultOperationId,
    } = options;

    void getCacheProvider().prefetch(
      [...key, serializeQueryKeyInput(props)] as const,
      {
        staleTime,
        cacheTime,
        revalidateOnStale,
        preferFreshOnStale,
        operationId,
        queryFn: () => queryFn(props),
      },
    );
  };

  return compositeQuery as CompositeQuery<TProps, TOutput, TKey>;
}
