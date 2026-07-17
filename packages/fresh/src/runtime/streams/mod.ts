/**
 * `@netscript/fresh/streams` — Client SDK for E2E durable streams.
 *
 * This subpath provides:
 * - `createNetScriptStreamDB()` — generic TanStack DB-backed StreamDB factory
 *   (wraps `@durable-streams/state` with NetScript URL resolution + auth)
 * - `useLiveQuery` / `useLiveSuspenseQuery` from `@tanstack/react-db`
 *   (works via `preact/compat` in Fresh islands)
 * - Re-exports of useful types from `@durable-streams/state`
 *
 * Plugin-specific factories (`createWorkersStreamDB`, etc.) live in their
 * respective plugin packages and import from here via `@netscript/fresh/streams`.
 *
 * @module
 */

export {
  createNetScriptStreamDB,
  type NetScriptStateSchema,
  type NetScriptStreamDB,
  type NetScriptStreamDBFactory,
  type NetScriptStreamDBFactoryInput,
  type NetScriptStreamDBOptions,
  type NetScriptStreamStateDefinition,
} from './create-stream-db.ts';

import {
  useLiveQuery as useTanStackLiveQuery,
  useLiveSuspenseQuery as useTanStackLiveSuspenseQuery,
} from '@tanstack/react-db';
import type {
  Context,
  InferResultType,
  InitialQueryBuilder,
  QueryBuilder,
} from '@tanstack/react-db';

/** Function that builds a live query from the upstream query builder. */
export type NetScriptLiveQueryFactory<TContext extends Context = Context> = (
  queryBuilder: InitialQueryBuilder,
) => QueryBuilder<TContext>;

/** Result returned by NetScript live-query wrappers. */
export interface NetScriptLiveQueryResult<TData = unknown> {
  /** Current query data, if the upstream hook has produced it. */
  readonly data?: TData;
  /** Upstream loading status or disabled status. */
  readonly status?: string;
  /** Error captured by the upstream hook, if any. */
  readonly error?: unknown;
  /** Additional upstream fields preserved for consumers that need them. */
  readonly details: Record<string, unknown>;
}

/** Run a TanStack DB live query through the NetScript Fresh streams surface. */
export function useLiveQuery<TContext extends Context>(
  queryFactory: NetScriptLiveQueryFactory<TContext>,
  deps?: readonly unknown[],
): NetScriptLiveQueryResult<InferResultType<TContext>> {
  const result = useTanStackLiveQuery(
    queryFactory,
    deps ? [...deps] : undefined,
  );

  return {
    data: result.data,
    status: typeof result.status === 'string' ? result.status : undefined,
    details: { ...result },
  };
}

/** Run a TanStack DB suspense live query through the NetScript Fresh streams surface. */
export function useLiveSuspenseQuery<TContext extends Context>(
  queryFactory: NetScriptLiveQueryFactory<TContext>,
  deps?: readonly unknown[],
): NetScriptLiveQueryResult<InferResultType<TContext>> {
  const result = useTanStackLiveSuspenseQuery(
    queryFactory,
    deps ? [...deps] : undefined,
  );

  return {
    data: result.data,
    details: { ...result },
  };
}
