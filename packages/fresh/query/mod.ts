/**
 * `@netscript/fresh/query` — TanStack Query hooks for Fresh islands.
 *
 * This subpath provides:
 * - `QueryIsland` — island-level provider wrapper
 * - `getIslandQueryClient()` — shared QueryClient singleton
 * - package-owned query hooks (`useIslandQuery`, `useIslandMutation`, etc.)
 * - package-owned live query hooks (`useLiveQuery`, `useLiveSuspenseQuery`)
 * - Hydration utilities for streaming SSR
 *
 * **Import discipline:** Island code should import from `@netscript/fresh/query`,
 * NOT from `@tanstack/preact-query` directly. This centralizes the dependency
 * and enables framework-level enhancements.
 *
 * @module
 */

// === QueryIsland provider ===
export { QueryIsland, type QueryIslandProps } from './query-island.tsx';

// === QueryClient singleton ===
export { getIslandQueryClient, resetIslandQueryClient } from './query-client.ts';

// === Package-owned query types ===
export type {
  DehydratedState,
  InitialDataFor,
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
  LoaderData,
  QueryIslandChildren,
  QueryJsonValue,
  QueryKey,
} from './query-types.ts';

// === Package-owned query hooks ===
export {
  useInfiniteQuery,
  useIsFetching,
  useIslandInfiniteQuery,
  useIslandMutation,
  useIslandQuery,
  useIslandSuspenseInfiniteQuery,
  useIslandSuspenseQuery,
  useIsMutating,
  useLiveQuery,
  useLiveSuspenseQuery,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from './hooks.ts';

// === Hydration utilities ===
export { dehydrateQueryClient, hydrateFromDehydrated } from './hydration.ts';
export {
  DEFAULT_QUERY_HYDRATION_SCRIPT_ID,
  HydrationBoundary,
  type HydrationBoundaryProps,
  QueryHydrationScript,
  type QueryHydrationScriptProps,
} from './hydration-script.tsx';
