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
  if (!Array.isArray(state.mutations) || !Array.isArray(state.queries)) {
    throw new TypeError('Invalid dehydrated state: mutations and queries must be arrays');
  }
  return {
    mutations: state.mutations.map((mutation, index) => {
      const normalized = normalizeDehydratedMutation(mutation);
      if (!normalized) {
        throw new TypeError(`Invalid dehydrated mutation at index ${index}`);
      }
      return normalized;
    }),
    queries: state.queries.map((query, index) => {
      const normalized = normalizeDehydratedQuery(query);
      if (!normalized) {
        throw new TypeError(`Invalid dehydrated query at index ${index}`);
      }
      return normalized;
    }),
  };
}

function normalizeDehydratedMutation(value: unknown): TanStackDehydratedMutation | undefined {
  if (!isRecord(value)) return undefined;
  const state = normalizeMutationState(value.state);
  if (!state) return undefined;

  const mutationKey = value.mutationKey;
  if (mutationKey !== undefined && !isUnknownArray(mutationKey)) return undefined;
  const meta = value.meta;
  if (meta !== undefined && !isRecord(meta)) return undefined;
  const scope = value.scope;
  let normalizedScope: { readonly id: string } | undefined;
  if (scope !== undefined) {
    if (!isRecord(scope) || typeof scope.id !== 'string') return undefined;
    normalizedScope = { id: scope.id };
  }

  return {
    mutationKey,
    state,
    meta,
    scope: normalizedScope,
  };
}

function normalizeDehydratedQuery(value: unknown): TanStackDehydratedQuery | undefined {
  if (
    !isRecord(value) || typeof value.queryHash !== 'string' ||
    !isUnknownArray(value.queryKey)
  ) {
    return undefined;
  }
  const state = normalizeQueryState(value.state);
  if (!state) return undefined;
  const promise = value.promise;
  if (promise !== undefined && !(promise instanceof Promise)) return undefined;
  const meta = value.meta;
  if (meta !== undefined && !isRecord(meta)) return undefined;
  const queryType = value.queryType;
  if (queryType !== undefined && queryType !== 'infinite') return undefined;
  const dehydratedAt = value.dehydratedAt;
  if (dehydratedAt !== undefined && typeof dehydratedAt !== 'number') return undefined;

  return {
    queryHash: value.queryHash,
    queryKey: value.queryKey,
    state,
    promise,
    meta,
    queryType,
    dehydratedAt,
  };
}

function normalizeMutationState(value: unknown): MutationState | undefined {
  if (!isRecord(value)) return undefined;
  const error = reviveSerializedError(value.error);
  const failureReason = reviveSerializedError(value.failureReason);
  if (
    !error.valid || !failureReason.valid ||
    typeof value.failureCount !== 'number' ||
    typeof value.isPaused !== 'boolean' ||
    !isOneOf(value.status, ['idle', 'pending', 'success', 'error']) ||
    typeof value.submittedAt !== 'number'
  ) {
    return undefined;
  }

  return {
    context: value.context,
    data: value.data,
    error: error.value,
    failureCount: value.failureCount,
    failureReason: failureReason.value,
    isPaused: value.isPaused,
    status: value.status,
    variables: value.variables,
    submittedAt: value.submittedAt,
  };
}

function normalizeQueryState(value: unknown): QueryState | undefined {
  if (!isRecord(value)) return undefined;
  const error = reviveSerializedError(value.error);
  const fetchFailureReason = reviveSerializedError(value.fetchFailureReason);
  if (
    !error.valid || !fetchFailureReason.valid ||
    typeof value.dataUpdateCount !== 'number' ||
    typeof value.dataUpdatedAt !== 'number' ||
    typeof value.errorUpdateCount !== 'number' ||
    typeof value.errorUpdatedAt !== 'number' ||
    typeof value.fetchFailureCount !== 'number' ||
    !isFetchMetaOrNull(value.fetchMeta) ||
    typeof value.isInvalidated !== 'boolean' ||
    !isOneOf(value.status, ['pending', 'error', 'success']) ||
    !isOneOf(value.fetchStatus, ['fetching', 'paused', 'idle'])
  ) {
    return undefined;
  }

  return {
    data: value.data,
    dataUpdateCount: value.dataUpdateCount,
    dataUpdatedAt: value.dataUpdatedAt,
    error: error.value,
    errorUpdateCount: value.errorUpdateCount,
    errorUpdatedAt: value.errorUpdatedAt,
    fetchFailureCount: value.fetchFailureCount,
    fetchFailureReason: fetchFailureReason.value,
    fetchMeta: value.fetchMeta,
    isInvalidated: value.isInvalidated,
    status: value.status,
    fetchStatus: value.fetchStatus,
  };
}

function isFetchMetaOrNull(value: unknown): value is QueryState['fetchMeta'] {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  if (value.fetchMore === undefined) return true;
  return isRecord(value.fetchMore) &&
    isOneOf(value.fetchMore.direction, ['forward', 'backward']);
}

type RevivedError =
  | { readonly valid: true; readonly value: Error | null }
  | { readonly valid: false };

function reviveSerializedError(value: unknown): RevivedError {
  if (value === null || value instanceof Error) {
    return { valid: true, value };
  }
  const record = isPlainRecord(value) ? value : undefined;
  if (
    !record && !Array.isArray(value) && typeof value !== 'string' &&
    typeof value !== 'number' && typeof value !== 'boolean'
  ) {
    return { valid: false };
  }

  const error = new Error(
    record
      ? typeof record.message === 'string' ? record.message : 'Serialized hydration error'
      : String(value),
    { cause: value },
  );
  if (record && typeof record.name === 'string') error.name = record.name;
  if (record && typeof record.stack === 'string') error.stack = record.stack;
  return { valid: true, value: error };
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

function isPlainRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
