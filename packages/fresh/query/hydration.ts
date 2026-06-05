/**
 * TanStack Query hydration utilities for streaming SSR.
 *
 * These helpers enable prefetching into a QueryClient on the server, then
 * dehydrating the state for client-side hydration in islands.
 *
 * NOTE: For most use cases, the `initialData` + promise props pattern is
 * simpler and recommended (see RFC 17 §5.2). These utilities are for advanced
 * scenarios where a full QueryClient dehydration/hydration cycle is needed.
 *
 * @module
 */

import { dehydrate, type DehydratedState, hydrate } from '@tanstack/query-core';
import type { QueryClient } from '@tanstack/query-core';

/**
 * Dehydrate a QueryClient into a serializable state object.
 *
 * Call this on the server after prefetching queries, then pass the
 * dehydrated state as props to an island for client-side hydration.
 *
 * @param queryClient - The server-side QueryClient with prefetched data.
 * @returns Serializable dehydrated state.
 */
export function dehydrateQueryClient(queryClient: QueryClient): DehydratedState {
  return dehydrate(queryClient);
}

/**
 * Hydrate a client-side QueryClient from a server-dehydrated state.
 *
 * Call this on the client inside an island to restore server-prefetched
 * queries into the shared island QueryClient.
 *
 * @param queryClient - The client-side QueryClient to hydrate.
 * @param dehydratedState - State from `dehydrateQueryClient()`.
 */
export function hydrateFromDehydrated(
  queryClient: QueryClient,
  dehydratedState: DehydratedState,
): void {
  hydrate(queryClient, dehydratedState);
}

export type { DehydratedState };
