/**
 * Package-owned TanStack Query wrappers for Fresh islands.
 *
 * @module
 */

import {
  useInfiniteQuery as useTanStackInfiniteQuery,
  useIsFetching as useTanStackIsFetching,
  useIsMutating as useTanStackIsMutating,
  useMutation as useTanStackMutation,
  useQuery as useTanStackQuery,
  useQueryClient as useTanStackQueryClient,
  useSuspenseInfiniteQuery as useTanStackSuspenseInfiniteQuery,
  useSuspenseQuery as useTanStackSuspenseQuery,
} from '@tanstack/preact-query';
import {
  useLiveQuery as useTanStackLiveQuery,
  useLiveSuspenseQuery as useTanStackLiveSuspenseQuery,
} from '@tanstack/react-db';
import type { Context } from '@tanstack/react-db';
import type { QueryFunctionContext } from '@tanstack/query-core';
import type {
  IslandInfiniteData,
  IslandInfiniteQueryOptions,
  IslandInfiniteQueryResult,
  IslandLiveQueryData,
  IslandLiveQueryFactory,
  IslandLiveQueryResult,
  IslandMutationOptions,
  IslandMutationResult,
  IslandQueryClient,
  IslandQueryFilters,
  IslandQueryOptions,
  IslandQueryResult,
  IslandSuspenseQueryResult,
  QueryKey,
} from './query-types.ts';

/** Run an island query through the shared NetScript Fresh QueryClient. */
export function useIslandQuery<TData = unknown, TError = unknown, TSelected = TData>(
  options: IslandQueryOptions<TData, TError, TSelected>,
): IslandQueryResult<TSelected, TError> {
  return useTanStackQuery<TData, TError, TSelected, QueryKey>(options);
}

/** Run a suspense island query through the shared NetScript Fresh QueryClient. */
export function useIslandSuspenseQuery<TData = unknown, TError = unknown, TSelected = TData>(
  options: IslandQueryOptions<TData, TError, TSelected>,
): IslandSuspenseQueryResult<TSelected, TError> {
  return useTanStackSuspenseQuery<TData, TError, TSelected, QueryKey>(options);
}

/** Run an island infinite query through the shared NetScript Fresh QueryClient. */
export function useIslandInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TPageParam = unknown,
>(
  options: IslandInfiniteQueryOptions<TData, TError, TPageParam>,
): IslandInfiniteQueryResult<TData, TError, TPageParam> {
  const { queryFn, ...upstreamOptions } = options;

  return useTanStackInfiniteQuery<
    TData,
    TError,
    IslandInfiniteData<TData, TPageParam>,
    QueryKey,
    TPageParam
  >({
    ...upstreamOptions,
    queryFn: (context: QueryFunctionContext<QueryKey, TPageParam>) =>
      queryFn({
        client: context.client,
        queryKey: context.queryKey,
        signal: context.signal,
        pageParam: typedPageParam(context),
        meta: context.meta,
      }),
  });
}

/** Run a suspense island infinite query through the shared NetScript Fresh QueryClient. */
export function useIslandSuspenseInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TPageParam = unknown,
>(
  options: IslandInfiniteQueryOptions<TData, TError, TPageParam>,
): IslandInfiniteQueryResult<TData, TError, TPageParam> {
  const { queryFn, ...upstreamOptions } = options;

  return useTanStackSuspenseInfiniteQuery<
    TData,
    TError,
    IslandInfiniteData<TData, TPageParam>,
    QueryKey,
    TPageParam
  >({
    ...upstreamOptions,
    queryFn: (context: QueryFunctionContext<QueryKey, TPageParam>) =>
      queryFn({
        client: context.client,
        queryKey: context.queryKey,
        signal: context.signal,
        pageParam: typedPageParam(context),
        meta: context.meta,
      }),
  });
}

function typedPageParam<TPageParam>(
  context: QueryFunctionContext<QueryKey, TPageParam>,
): TPageParam {
  // TanStack's conditional context retains its `never` branch for an open
  // generic even though the same page-param type is supplied to the hook.
  return context.pageParam as TPageParam;
}

/** Run an island mutation through the shared NetScript Fresh QueryClient. */
export function useIslandMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: IslandMutationOptions<TData, TError, TVariables, TContext>,
): IslandMutationResult<TData, TError, TVariables, TContext> {
  const { mutationFn, ...upstreamOptions } = options;

  return useTanStackMutation<TData, TError, TVariables, TContext>({
    ...upstreamOptions,
    mutationFn: async (variables) => await mutationFn(variables),
  });
}

/** Return the active island QueryClient handle. */
export function useQueryClient(): IslandQueryClient {
  return useTanStackQueryClient();
}

/** Count active island queries matching the optional filters. */
export function useIsFetching(filters?: IslandQueryFilters): number {
  return useTanStackIsFetching(filters);
}

/** Count active island mutations matching the optional filters. */
export function useIsMutating(filters?: IslandQueryFilters): number {
  return useTanStackIsMutating(filters);
}

/** Run an island live query through the NetScript Fresh query surface. */
export function useLiveQuery<TContext extends Context>(
  queryFactory: IslandLiveQueryFactory<TContext>,
  deps?: readonly unknown[],
): IslandLiveQueryResult<IslandLiveQueryData<TContext>> {
  const result = useTanStackLiveQuery(
    queryFactory,
    deps ? [...deps] : undefined,
  );

  return {
    data: result.data,
    status: typeof result.status === 'string' ? result.status : undefined,
    details: { ...result },
  };
}

/** Run an island suspense live query through the NetScript Fresh query surface. */
export function useLiveSuspenseQuery<TContext extends Context>(
  queryFactory: IslandLiveQueryFactory<TContext>,
  deps?: readonly unknown[],
): IslandLiveQueryResult<IslandLiveQueryData<TContext>> {
  const result = useTanStackLiveSuspenseQuery(
    queryFactory,
    deps ? [...deps] : undefined,
  );

  return {
    data: result.data,
    details: { ...result },
  };
}

/** Run an island query through the canonical NetScript Fresh query surface. */
export function useQuery<TData = unknown, TError = unknown, TSelected = TData>(
  options: IslandQueryOptions<TData, TError, TSelected>,
): IslandQueryResult<TSelected, TError> {
  return useIslandQuery(options);
}

/** Run an island suspense query through the canonical NetScript Fresh query surface. */
export function useSuspenseQuery<TData = unknown, TError = unknown, TSelected = TData>(
  options: IslandQueryOptions<TData, TError, TSelected>,
): IslandSuspenseQueryResult<TSelected, TError> {
  return useIslandSuspenseQuery(options);
}

/** Run an island infinite query through the canonical NetScript Fresh query surface. */
export function useInfiniteQuery<TData = unknown, TError = unknown, TPageParam = unknown>(
  options: IslandInfiniteQueryOptions<TData, TError, TPageParam>,
): IslandInfiniteQueryResult<TData, TError> {
  return useIslandInfiniteQuery(options);
}

/** Run an island suspense infinite query through the canonical NetScript Fresh query surface. */
export function useSuspenseInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TPageParam = unknown,
>(
  options: IslandInfiniteQueryOptions<TData, TError, TPageParam>,
): IslandInfiniteQueryResult<TData, TError> {
  return useIslandSuspenseInfiniteQuery(options);
}

/** Run an island mutation through the canonical NetScript Fresh query surface. */
export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: IslandMutationOptions<TData, TError, TVariables, TContext>,
): IslandMutationResult<TData, TError, TVariables, TContext> {
  return useIslandMutation(options);
}
