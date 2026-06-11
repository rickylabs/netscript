/**
 * TanStack QueryClient factory with NetScript-sensible defaults.
 *
 * @module
 */

import { QueryClient } from '@tanstack/query-core';
import { DEFAULT_QUERY_CACHE_TIME, DEFAULT_QUERY_STALE_TIME } from '../cache/defaults.ts';
import type { QueryClientPort } from '../ports/query-client.ts';

/** Default stale time matching NetScript's server-first philosophy (30 s). */
export const DEFAULT_STALE_TIME: number = DEFAULT_QUERY_STALE_TIME;

/** Default garbage collection time matching server KV cache TTL (5 min). */
export const DEFAULT_GC_TIME: number = DEFAULT_QUERY_CACHE_TIME;

/**
 * Options for `createNetScriptQueryClient`.
 */
export interface NetScriptQueryClientOptions {
  /** How long data is considered fresh (ms). Default: 30 000 (30 s). */
  staleTime?: number;
  /** How long inactive queries stay in memory (ms). Default: 300 000 (5 min). */
  gcTime?: number;
  /** Whether to refetch on window focus. Default: false (server-first). */
  refetchOnWindowFocus?: boolean;
  /** Retry failed queries. Default: 1. */
  retry?: number;
}

/**
 * Create a TanStack `QueryClient` with defaults aligned to NetScript's
 * server-first philosophy.
 *
 * - `staleTime: 30_000` — prevents immediate refetch after server hydration.
 * - `gcTime: 300_000` — matches the server KV cache default TTL.
 * - `refetchOnWindowFocus: false` — server-first; enable per-query where needed.
 * - `retry: 1` — one retry; server SWR already handles resilience.
 *
 * @example
 * ```ts
 * const queryClient = createNetScriptQueryClient();
 * ```
 */
export function createNetScriptQueryClient(
  options: NetScriptQueryClientOptions = {},
): QueryClientPort {
  const {
    staleTime = DEFAULT_STALE_TIME,
    gcTime = DEFAULT_GC_TIME,
    refetchOnWindowFocus = false,
    retry = 1,
  } = options;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime,
        gcTime,
        refetchOnWindowFocus,
        retry,
      },
    },
  });
  // TanStack's concrete QueryClient keeps generic updater return types wider
  // than the SDK port. The runtime object implements the structural methods
  // the port documents, so the upstream boundary stays internal here.
  return queryClient as QueryClientPort;
}
