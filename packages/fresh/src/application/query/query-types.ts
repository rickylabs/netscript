/**
 * Package-owned public query types for Fresh islands.
 *
 * @module
 */

/** JSON-compatible value accepted by island query hydration helpers. */
export type QueryJsonValue =
  | string
  | number
  | boolean
  | null
  | QueryJsonValue[]
  | { readonly [key: string]: QueryJsonValue };

/** Renderable children accepted by the query island provider. */
export type QueryIslandChildren =
  | object
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | readonly QueryIslandChildren[];

/** Stable query key shape used by NetScript Fresh query wrappers. */
export type QueryKey = readonly unknown[];

/** Client handle returned by the island query-client factory. */
export type IslandQueryClient = QueryClient;

/** State produced by server-side query dehydration. */
export interface DehydratedState {
  /** Serialized mutation cache entries. */
  readonly mutations: readonly unknown[];
  /** Serialized query cache entries. */
  readonly queries: readonly unknown[];
}

/** Result of an island query hook call. */
export interface IslandQueryResult<TData = unknown, TError = unknown> {
  /** Current query data, when the query has produced a value. */
  readonly data: TData | undefined;
  /** Current query error, when the query failed. */
  readonly error: TError | null;
  /** Current query lifecycle status. */
  readonly status: 'pending' | 'error' | 'success';
  /** Whether the query is still loading its first value. */
  readonly isLoading: boolean;
  /** Whether the query currently has a successful value. */
  readonly isSuccess: boolean;
  /** Whether the query currently has an error. */
  readonly isError: boolean;
  /** Refetch the query through the underlying QueryClient. */
  refetch(): Promise<IslandQueryResult<TData, TError>>;
}

/** Result of a suspense island query hook call. */
export interface IslandSuspenseQueryResult<TData = unknown, TError = unknown>
  extends Omit<IslandQueryResult<TData, TError>, 'data'> {
  /** Current query data. Suspense guarantees this is present for rendered consumers. */
  readonly data: TData;
}

/** Page collection returned by an island infinite query. */
export interface IslandInfiniteData<TData = unknown, TPageParam = unknown> {
  /** Loaded query pages in fetch order. */
  readonly pages: TData[];
  /** Page parameters corresponding to each loaded page. */
  readonly pageParams: TPageParam[];
}

/** Context passed to an island infinite-query loader. */
export interface IslandInfiniteQueryContext<TPageParam = unknown> {
  /** Query client executing the load. */
  readonly client: IslandQueryClient;
  /** Stable key for the query. */
  readonly queryKey: QueryKey;
  /** Signal aborted when the query is canceled. */
  readonly signal: AbortSignal;
  /** Page parameter selected by the pagination callback. */
  readonly pageParam: TPageParam;
  /** Optional query metadata. */
  readonly meta: Record<string, unknown> | undefined;
}

/** Result of an island infinite query hook call. */
export interface IslandInfiniteQueryResult<
  TData = unknown,
  TError = unknown,
  TPageParam = unknown,
> extends IslandQueryResult<IslandInfiniteData<TData, TPageParam>, TError> {
  /** Fetch the next page from the underlying infinite query. */
  fetchNextPage(): Promise<IslandInfiniteQueryResult<TData, TError, TPageParam>>;
  /** Whether another page is available. */
  readonly hasNextPage: boolean;
  /** Whether the next page is being fetched. */
  readonly isFetchingNextPage: boolean;
}

/** Result of an island mutation hook call. */
export interface IslandMutationResult<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> {
  /** Current mutation data, when the mutation has completed successfully. */
  readonly data: TData | undefined;
  /** Current mutation error, when the mutation failed. */
  readonly error: TError | null;
  /** Current mutation lifecycle status. */
  readonly status: 'idle' | 'pending' | 'error' | 'success';
  /** Whether the mutation is currently running. */
  readonly isPending: boolean;
  /** Run the mutation and resolve with its data. */
  mutateAsync(variables: TVariables): Promise<TData>;
  /** Run the mutation without awaiting its result. */
  mutate(variables: TVariables): void;
}

/** Options accepted by `useIslandQuery`. */
export interface IslandQueryOptions<TData = unknown, TError = unknown, TSelected = TData> {
  /** Stable cache key for the query. */
  queryKey: QueryKey;
  /** Function that loads query data. */
  queryFn: () => Promise<TData> | TData;
  /** Initial data supplied from a Fresh server loader. */
  initialData?: TData;
  /** Whether the query should run automatically. */
  enabled?: boolean;
  /** Cache freshness duration in milliseconds. */
  staleTime?: number;
  /** Cache garbage-collection duration in milliseconds. */
  gcTime?: number;
  /** Optional projection applied by the underlying query adapter. */
  select?: (data: TData) => TSelected;
  /** Optional error callback. */
  onError?: (error: TError) => void;
  /**
   * Polling interval in milliseconds. When set, the query refetches on this
   * cadence. Set to `false` to disable polling. Defaults to `false`.
   */
  refetchInterval?: number | false;
  /**
   * Whether polling continues while the tab or window is in the background.
   * Only relevant when `refetchInterval` is set. Defaults to `false`.
   */
  refetchIntervalInBackground?: boolean;
}

/** Options accepted by `useIslandInfiniteQuery`. */
export interface IslandInfiniteQueryOptions<TData = unknown, TError = unknown, TPageParam = unknown>
  extends Omit<IslandQueryOptions<TData, TError, TData>, 'queryFn' | 'initialData' | 'select'> {
  /** Function that loads one page of query data. */
  queryFn: (context: IslandInfiniteQueryContext<TPageParam>) => Promise<TData> | TData;
  /** Initial page parameter. */
  initialPageParam: TPageParam;
  /** Previously loaded pages supplied from a Fresh server loader. */
  initialData?: IslandInfiniteData<TData, TPageParam>;
  /** Optional projection applied to the complete page collection. */
  select?: (
    data: IslandInfiniteData<TData, TPageParam>,
  ) => IslandInfiniteData<TData, TPageParam>;
  /** Resolve the next page parameter from the current page set. */
  getNextPageParam: (
    lastPage: TData,
    allPages: readonly TData[],
  ) => TPageParam | undefined;
}

/** Options accepted by `useIslandMutation`. */
export interface IslandMutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> {
  /** Function that performs the mutation. */
  mutationFn: (variables: TVariables) => Promise<TData> | TData;
  /** Optional optimistic update callback that returns rollback context. */
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  /** Optional success callback. */
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => Promise<void> | void;
  /** Optional error callback. */
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined,
  ) => Promise<void> | void;
  /** Optional settled callback that runs after success or error. */
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined,
  ) => Promise<void> | void;
}

/** Filters accepted by query/mutation activity counters. */
export interface IslandQueryFilters {
  /** Match a specific query key prefix. */
  queryKey?: QueryKey;
  /** Match only exact query keys. */
  exact?: boolean;
}

/** Result returned by NetScript live-query wrappers. */
export interface IslandLiveQueryResult<TData = unknown> {
  /** Current query data, if the upstream hook has produced it. */
  readonly data?: TData;
  /** Upstream loading status or disabled status. */
  readonly status?: string;
  /** Error captured by the upstream hook, if any. */
  readonly error?: unknown;
  /** Additional upstream fields preserved for consumers that need them. */
  readonly details: Record<string, unknown>;
}

/** Function that builds a live query from the upstream query builder. */
export type IslandLiveQueryFactory<TContext extends Context = Context> = (
  queryBuilder: InitialQueryBuilder,
) => QueryBuilder<TContext>;

/** Data inferred from a TanStack DB live-query builder context. */
export type IslandLiveQueryData<TContext extends Context> = InferResultType<TContext>;

/** Resolve the awaited return value from a Fresh route loader. */
export type LoaderData<TLoader extends (...args: never[]) => unknown> = Awaited<
  ReturnType<TLoader>
>;

/** Extract initial data from a query-options object. */
export type InitialDataFor<TOptions extends { initialData?: unknown }> = TOptions['initialData'];
import type {
  Context,
  InferResultType,
  InitialQueryBuilder,
  QueryBuilder,
} from '@tanstack/react-db';
import type { QueryClient } from '@tanstack/query-core';
