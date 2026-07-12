/**
 * Generic NetScript StreamDB factory.
 *
 * `createNetScriptStreamDB()` is the framework-level generic factory for
 * creating TanStack DB-backed stream databases.  It wraps
 * `@durable-streams/state` `createStreamDB()` with NetScript's automatic
 * URL resolution and auth header injection.
 *
 * Plugin-specific factories (`createWorkersStreamDB`, `createSagasStreamDB`,
 * `createTriggersStreamDB`) live in their own plugin packages and call this
 * internally.
 *
 * @module
 */

import { createStreamDB } from '@durable-streams/state/db';
import type { StateSchema, StreamStateDefinition } from '@durable-streams/state';
import { buildStreamUrl, getStreamsAuth, getStreamsUrl } from '@netscript/plugin-streams-core';

/** NetScript-owned durable stream state definition. */
export type NetScriptStreamStateDefinition = Record<string, unknown>;

/** NetScript-owned state schema accepted by the stream DB factory. */
export type NetScriptStateSchema<TDef extends NetScriptStreamStateDefinition> = Record<
  keyof TDef,
  unknown
>;

/** NetScript-owned stream database handle returned by the factory. */
export interface NetScriptStreamDB<TDef extends NetScriptStreamStateDefinition> {
  /** Reactive collections keyed by schema collection name. */
  readonly collections: Record<keyof TDef & string, unknown>;
  /** Optional stop hook exposed by compatible stream DB adapters. */
  readonly stop?: () => void | Promise<void>;
  /** Optional dispose hook exposed by compatible stream DB adapters. */
  readonly dispose?: () => void | Promise<void>;
}

/** Input passed to the underlying stream DB factory port. */
export interface NetScriptStreamDBFactoryInput<TDef extends NetScriptStreamStateDefinition> {
  /** Transport options used to connect to the durable streams endpoint. */
  streamOptions: {
    /** Fully resolved durable stream URL. */
    url: string;
    /** Content type sent to the durable streams endpoint. */
    contentType: 'application/json';
    /** Auth headers sent to the durable streams endpoint. */
    headers: Record<string, string>;
  };
  /** State schema passed to the underlying stream DB adapter. */
  state: NetScriptStateSchema<TDef>;
}

/** Factory port used to create a durable stream DB handle. */
export type NetScriptStreamDBFactory<TDef extends NetScriptStreamStateDefinition> = (
  input: NetScriptStreamDBFactoryInput<TDef>,
) => NetScriptStreamDB<TDef>;

/** Options for `createNetScriptStreamDB`. */
export interface NetScriptStreamDBOptions<TDef extends NetScriptStreamStateDefinition> {
  /**
   * Stream path relative to the streams server root.
   * (e.g. `/workers/executions`)
   */
  streamPath: string;
  /**
   * Override the base stream server URL.
   * Defaults to `getStreamsUrl()` (env-resolved).
   */
  baseUrl?: string;
  /** State schema used by the durable stream database. */
  schema: NetScriptStateSchema<TDef>;
  /** Optional factory port for tests or alternate stream DB adapters. */
  createStreamDB?: NetScriptStreamDBFactory<TDef>;
}

/**
 * Create a NetScript-configured TanStack DB-backed StreamDB.
 *
 * The returned object has `.collections` — typed TanStack DB `Collection`
 * instances — that update reactively as events arrive from the durable
 * streams server.
 *
 * @example
 * ```ts
 * import { createNetScriptStreamDB } from '@netscript/fresh/streams';
 * import { myStreamSchema } from '../schemas.ts';
 *
 * const db = createNetScriptStreamDB({
 *   streamPath: '/my-service/my-stream',
 *   schema: myStreamSchema,
 * });
 *
 * // In a Preact island:
 * const { data: items } = useLiveQuery((q) =>
 *   q.from({ i: db.collections.myEntity })
 * );
 * ```
 */
export function createNetScriptStreamDB<TDef extends NetScriptStreamStateDefinition>(
  options: NetScriptStreamDBOptions<TDef>,
): NetScriptStreamDB<TDef> {
  const baseUrl = options.baseUrl ?? getStreamsUrl();
  const factory = options.createStreamDB ?? defaultCreateStreamDB;

  return factory({
    streamOptions: {
      url: buildStreamUrl(options.streamPath, baseUrl),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state: options.schema,
  });
}

function defaultCreateStreamDB<TDef extends NetScriptStreamStateDefinition>(
  input: NetScriptStreamDBFactoryInput<TDef>,
): NetScriptStreamDB<TDef> {
  if (!isDurableStateSchema(input.state)) {
    throw new TypeError(
      'NetScript StreamDB schemas must be created from durable-stream collection definitions',
    );
  }

  return createStreamDB(
    {
      streamOptions: input.streamOptions,
      state: input.state,
    },
  );
}

function isDurableStateSchema(
  state: Record<PropertyKey, unknown>,
): state is StateSchema<StreamStateDefinition> {
  return Object.values(state).every((collection) =>
    isRecord(collection) &&
    isRecord(collection.schema) &&
    typeof collection.type === 'string' &&
    typeof collection.primaryKey === 'string' &&
    typeof collection.insert === 'function' &&
    typeof collection.update === 'function' &&
    typeof collection.delete === 'function' &&
    typeof collection.upsert === 'function'
  );
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}
