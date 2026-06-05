/**
 * Internal composite-query implementation.
 *
 * @module
 */

import { getCacheProvider } from './cache-provider.ts';
import { serializeQueryKeyInput } from '../interfaces/query-key.ts';
import type { CompositeQuery } from '../interfaces/query-factory.ts';
import type { QueryParams } from '../interfaces/query-options.ts';

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
    staleTime: defaultStaleTime = 30_000,
    cacheTime: defaultCacheTime = 300_000,
    revalidateOnStale: defaultRevalidateOnStale = true,
    preferFreshOnStale: defaultPreferFreshOnStale = false,
  } = defaultOptions;

  const compositeQuery = async (
    props: TProps,
    options: QueryParams = {},
  ): Promise<TOutput> => {
    const {
      staleTime = defaultStaleTime,
      cacheTime = defaultCacheTime,
      revalidateOnStale = defaultRevalidateOnStale,
      preferFreshOnStale = defaultPreferFreshOnStale,
    } = options;

    return await getCacheProvider().query(
      [...key, serializeQueryKeyInput(props)] as const,
      {
        staleTime,
        cacheTime,
        revalidateOnStale,
        preferFreshOnStale,
        queryFn: () => queryFn(props),
      },
    );
  };

  compositeQuery.invalidate = async (): Promise<void> => {
    await getCacheProvider().invalidateQueries([...key]);
  };

  compositeQuery.getCachedData = async (props: TProps): Promise<TOutput | null> => {
    return await getCacheProvider().getCachedData([...key, serializeQueryKeyInput(props)] as const);
  };

  compositeQuery.getCachedEntry = async (props: TProps) => {
    return await getCacheProvider().getCachedEntry([...key, serializeQueryKeyInput(props)] as const);
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
    } = options;

    void getCacheProvider().prefetch(
      [...key, serializeQueryKeyInput(props)] as const,
      {
        staleTime,
        cacheTime,
        revalidateOnStale,
        preferFreshOnStale,
        queryFn: () => queryFn(props),
      },
    );
  };

  return compositeQuery as CompositeQuery<TProps, TOutput, TKey>;
}
