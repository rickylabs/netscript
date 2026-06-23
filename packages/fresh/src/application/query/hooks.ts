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
import type {
  IslandInfiniteQueryOptions,
  IslandInfiniteQueryResult,
  IslandLiveQueryFactory,
  IslandLiveQueryResult,
  IslandMutationOptions,
  IslandMutationResult,
  IslandQueryClient,
  IslandQueryFilters,
  IslandQueryOptions,
  IslandQueryResult,
  IslandSuspenseQueryResult,
} from './query-types.ts';

/** Run an island query through the shared NetScript Fresh QueryClient. */
export function useIslandQuery<TData = unknown, TError = unknown, TSelected = TData>(
  options: IslandQueryOptions<TData, TError, TSelected>,
): IslandQueryResult<TSelected, TError> {
  return useTanStackQuery(options as never) as unknown as IslandQueryResult<TSelected, TError>;
}

/** Run a suspense island query through the shared NetScript Fresh QueryClient. */
export function useIslandSuspenseQuery<TData = unknown, TError = unknown, TSelected = TData>(
  options: IslandQueryOptions<TData, TError, TSelected>,
): IslandSuspenseQueryResult<TSelected, TError> {
  return useTanStackSuspenseQuery(options as never) as unknown as IslandSuspenseQueryResult<
    TSelected,
    TError
  >;
}

/** Run an island infinite query through the shared NetScript Fresh QueryClient. */
export function useIslandInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TPageParam = unknown,
>(
  options: IslandInfiniteQueryOptions<TData, TError, TPageParam>,
): IslandInfiniteQueryResult<TData, TError> {
  return useTanStackInfiniteQuery(options as never) as unknown as IslandInfiniteQueryResult<
    TData,
    TError
  >;
}

/** Run a suspense island infinite query through the shared NetScript Fresh QueryClient. */
export function useIslandSuspenseInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TPageParam = unknown,
>(
  options: IslandInfiniteQueryOptions<TData, TError, TPageParam>,
): IslandInfiniteQueryResult<TData, TError> {
  return useTanStackSuspenseInfiniteQuery(options as never) as unknown as IslandInfiniteQueryResult<
    TData,
    TError
  >;
}

/** Run an island mutation through the shared NetScript Fresh QueryClient. */
export function useIslandMutation<TData = unknown, TError = unknown, TVariables = void>(
  options: IslandMutationOptions<TData, TError, TVariables>,
): IslandMutationResult<TData, TError, TVariables> {
  return useTanStackMutation(options as never) as unknown as IslandMutationResult<
    TData,
    TError,
    TVariables
  >;
}

/** Return the active island QueryClient handle. */
export function useQueryClient(): IslandQueryClient {
  return useTanStackQueryClient() as IslandQueryClient;
}

/** Count active island queries matching the optional filters. */
export function useIsFetching(filters?: IslandQueryFilters): number {
  return useTanStackIsFetching(filters as never);
}

/** Count active island mutations matching the optional filters. */
export function useIsMutating(filters?: IslandQueryFilters): number {
  return useTanStackIsMutating(filters as never);
}

/** Run an island live query through the NetScript Fresh query surface. */
export function useLiveQuery<TData = unknown>(
  queryFactory: IslandLiveQueryFactory,
  deps?: readonly unknown[],
): IslandLiveQueryResult<TData> {
  const result = useTanStackLiveQuery(
    queryFactory as never,
    deps ? [...deps] : undefined,
  ) as Record<string, unknown>;

  return {
    data: result.data as TData | undefined,
    status: typeof result.status === 'string' ? result.status : undefined,
    error: result.error,
    details: result,
  };
}

/** Run an island suspense live query through the NetScript Fresh query surface. */
export function useLiveSuspenseQuery<TData = unknown>(
  queryFactory: IslandLiveQueryFactory,
  deps?: readonly unknown[],
): IslandLiveQueryResult<TData> {
  const result = useTanStackLiveSuspenseQuery(
    queryFactory as never,
    deps ? [...deps] : undefined,
  ) as Record<string, unknown>;

  return {
    data: result.data as TData | undefined,
    status: typeof result.status === 'string' ? result.status : undefined,
    error: result.error,
    details: result,
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
export function useMutation<TData = unknown, TError = unknown, TVariables = void>(
  options: IslandMutationOptions<TData, TError, TVariables>,
): IslandMutationResult<TData, TError, TVariables> {
  return useIslandMutation(options);
}
