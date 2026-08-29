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

import { dehydrate, hydrate } from '@tanstack/query-core';
import type {
  DehydratedState as TanStackDehydratedState,
  MutationState,
  QueryState,
} from '@tanstack/query-core';
import type { DehydratedState, IslandQueryClient } from './query-types.ts';

type TanStackDehydratedMutation = TanStackDehydratedState['mutations'][number];
type TanStackDehydratedQuery = TanStackDehydratedState['queries'][number];

/**
 * Dehydrate a QueryClient into a serializable state object.
 *
 * Call this on the server after prefetching queries, then pass the
 * dehydrated state as props to an island for client-side hydration.
 *
 * @param queryClient - The server-side QueryClient with prefetched data.
 * @returns Serializable dehydrated state.
 */
export function dehydrateQueryClient(queryClient: IslandQueryClient): DehydratedState {
  return dehydrate(queryClient) as DehydratedState;
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
  queryClient: IslandQueryClient,
  dehydratedState: DehydratedState,
): void {
  hydrate(queryClient, toMutableDehydratedState(dehydratedState));
}

function toMutableDehydratedState(state: DehydratedState): TanStackDehydratedState {
  return {
    mutations: state.mutations.map((mutation, index) => {
      if (!isDehydratedMutation(mutation)) {
        throw new TypeError(`Invalid dehydrated mutation at index ${index}`);
      }
      return { ...mutation, state: { ...mutation.state } };
    }),
    queries: state.queries.map((query, index) => {
      if (!isDehydratedQuery(query)) {
        throw new TypeError(`Invalid dehydrated query at index ${index}`);
      }
      return { ...query, state: { ...query.state } };
    }),
  };
}

function isDehydratedMutation(value: unknown): value is TanStackDehydratedMutation {
  if (!isRecord(value) || !isMutationState(value.state)) return false;
  if (value.mutationKey !== undefined && !Array.isArray(value.mutationKey)) return false;
  if (value.meta !== undefined && !isRecord(value.meta)) return false;
  return value.scope === undefined ||
    (isRecord(value.scope) && typeof value.scope.id === 'string');
}

function isDehydratedQuery(value: unknown): value is TanStackDehydratedQuery {
  if (
    !isRecord(value) || typeof value.queryHash !== 'string' ||
    !Array.isArray(value.queryKey) || !isQueryState(value.state)
  ) {
    return false;
  }
  if (value.promise !== undefined && !(value.promise instanceof Promise)) return false;
  if (value.meta !== undefined && !isRecord(value.meta)) return false;
  if (value.queryType !== undefined && value.queryType !== 'infinite') return false;
  return value.dehydratedAt === undefined || typeof value.dehydratedAt === 'number';
}

function isMutationState(value: unknown): value is MutationState {
  return isRecord(value) &&
    Object.hasOwn(value, 'context') &&
    Object.hasOwn(value, 'data') &&
    isErrorOrNull(value.error) &&
    typeof value.failureCount === 'number' &&
    isErrorOrNull(value.failureReason) &&
    typeof value.isPaused === 'boolean' &&
    isOneOf(value.status, ['idle', 'pending', 'success', 'error']) &&
    Object.hasOwn(value, 'variables') &&
    typeof value.submittedAt === 'number';
}

function isQueryState(value: unknown): value is QueryState {
  return isRecord(value) &&
    Object.hasOwn(value, 'data') &&
    typeof value.dataUpdateCount === 'number' &&
    typeof value.dataUpdatedAt === 'number' &&
    isErrorOrNull(value.error) &&
    typeof value.errorUpdateCount === 'number' &&
    typeof value.errorUpdatedAt === 'number' &&
    typeof value.fetchFailureCount === 'number' &&
    isErrorOrNull(value.fetchFailureReason) &&
    isFetchMetaOrNull(value.fetchMeta) &&
    typeof value.isInvalidated === 'boolean' &&
    isOneOf(value.status, ['pending', 'error', 'success']) &&
    isOneOf(value.fetchStatus, ['fetching', 'paused', 'idle']);
}

function isFetchMetaOrNull(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  if (value.fetchMore === undefined) return true;
  return isRecord(value.fetchMore) &&
    isOneOf(value.fetchMore.direction, ['forward', 'backward']);
}

function isErrorOrNull(value: unknown): value is Error | null {
  return value === null || value instanceof Error;
}

function isOneOf<const TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
): value is TValue {
  return typeof value === 'string' && allowed.some((candidate) => candidate === value);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
