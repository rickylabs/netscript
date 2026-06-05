/**
 * `@netscript/fresh/query` — TanStack Query hooks for Fresh islands.
 *
 * This subpath provides:
 * - `QueryIsland` — island-level provider wrapper
 * - `getIslandQueryClient()` — shared QueryClient singleton
 * - TanStack Preact Query hooks (`useQuery`, `useMutation`, etc.)
 * - TanStack DB live query hooks (`useLiveQuery`, `useLiveSuspenseQuery`)
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

// === TanStack Preact Query hooks ===
export {
  useInfiniteQuery,
  useIsFetching,
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
export { type DehydratedState, dehydrateQueryClient, hydrateFromDehydrated } from './hydration.ts';
