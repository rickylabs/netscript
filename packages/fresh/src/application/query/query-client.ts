/**
 * Island-scoped TanStack QueryClient singleton.
 *
 * All Fresh islands on a page share the same `QueryClient`, enabling:
 * - Query deduplication across islands
 * - Shared cache (one island's fetch is available to others)
 * - Cross-island mutation invalidation
 *
 * **SSR safety:** This singleton is client-only. Fresh islands hydrate on the
 * client — they do not server-render through this code path. If future work
 * introduces SSR of island internals, a per-request `QueryClient` must be used
 * to prevent cross-request data leakage.
 *
 * @module
 */

import { QueryClient } from '@tanstack/query-core';
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME } from '@netscript/sdk/query-client';
import type { IslandQueryClient } from './query-types.ts';

let islandQueryClient: QueryClient | undefined;

/**
 * Get (or create) the shared island `QueryClient`.
 *
 * @throws {Error} If called during server-side rendering outside island
 *                 hydration. Use a per-request QueryClient for SSR prefetch.
 *
 * @example
 * ```ts
 * const queryClient = getIslandQueryClient();
 * ```
 */
export function getIslandQueryClient(): IslandQueryClient {
  if (!islandQueryClient) {
    islandQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Prevents immediate refetch after server hydration
          staleTime: DEFAULT_STALE_TIME,
          // Matches server KV cache default TTL
          gcTime: DEFAULT_GC_TIME,
          // Server-first: no refetch on window focus by default
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return islandQueryClient;
}

/**
 * Reset the island QueryClient singleton.
 *
 * Primarily useful for testing. In production, the singleton lives for the
 * lifetime of the browser tab.
 */
export function resetIslandQueryClient(): void {
  if (islandQueryClient) {
    islandQueryClient.clear();
    islandQueryClient = undefined;
  }
}
