/**
 * TanStack Query hooks re-exports and NetScript convenience wrappers.
 *
 * Re-exports canonical TanStack Preact Query hooks so island code imports
 * from `@netscript/fresh/query` rather than `@tanstack/preact-query` directly.
 * This centralizes the dependency and enables future enhancements.
 *
 * @module
 */

// === TanStack Preact Query re-exports ===
export {
  useInfiniteQuery,
  useIsFetching,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/preact-query';

// === TanStack DB re-exports (via preact/compat) ===
export { useLiveQuery, useLiveSuspenseQuery } from '@tanstack/react-db';
