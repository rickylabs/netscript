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

import { abortable } from 'jsr:@std/async@^1/abortable';
import { createStreamDB } from '@durable-streams/state/db';
import type { StateSchema, StreamStateDefinition } from '@durable-streams/state';
import type { StreamDB } from '@durable-streams/state/db';
import { DurableStream } from '@durable-streams/client';
import { buildStreamUrl, getStreamsAuth, getStreamsUrl } from '@netscript/plugin-streams-core';
import { createStreamDBRecoveryAdapter } from './stream-db-recovery-adapter.ts';

/** Lifecycle of the default StreamDB consumer, including terminal failures. */
export type NetScriptStreamDBStatus =
  | 'idle'
  | 'connecting'
  | 'live'
  | 'retrying'
  | 'stopped'
  | 'failed';

/** Finite retry policy for an outage; a consumed batch resets the budget. */
export interface NetScriptStreamDBReconnectOptions {
  /** Retries after the first failed read; zero disables recovery. Defaults to five. */
  readonly maxRetries?: number;
  /** Initial exponential backoff delay in milliseconds. Defaults to one hundred. */
  readonly initialDelayMs?: number;
  /** Maximum backoff delay in milliseconds. Defaults to five thousand. */
  readonly maxDelayMs?: number;
}

/** NetScript-owned durable stream state definition. */
export type NetScriptStreamStateDefinition = StreamStateDefinition;

/** NetScript-owned state schema accepted by the stream DB factory. */
export type NetScriptStateSchema<TDef extends NetScriptStreamStateDefinition> = StateSchema<TDef>;

/** NetScript-owned stream database handle returned by the factory. */
export interface NetScriptStreamDB<TDef extends NetScriptStreamStateDefinition> {
  /** Reactive collections keyed by schema collection name. */
  readonly collections: StreamDB<StateSchema<TDef>>['collections'];
  /** Start the lazy default consumer and wait until its collections are up to date. */
  readonly preload?: () => Promise<void>;
  /** Inspect the default consumer's liveness; alternate adapters may omit this hook. */
  readonly status?: NetScriptStreamDBStatus;
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
  /** Optional bounded reconnect policy understood by the default adapter. */
  reconnect?: NetScriptStreamDBReconnectOptions;
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
   *
   * Note: The framework automatically prepends `STREAMS_URL_PREFIX` (`/v1/stream/netscript`).
   * For example, `streamPath: '/workers/executions'` resolves to `<base>/v1/stream/netscript/workers/executions`.
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
  /** Bounded reconnect policy; the default adapter resumes the last consumed batch. */
  reconnect?: NetScriptStreamDBReconnectOptions;
}

/**
 * Create a NetScript-configured TanStack DB-backed StreamDB.
 *
 * The returned object has `.collections` — typed TanStack DB `Collection`
 * instances — that update reactively as events arrive from the durable
 * streams server.
 * Call the default handle's `preload()` to start consumption. Recoverable
 * outages use finite exponential backoff and resume the last consumed batch
 * without replacing collections. Authentication, malformed data and invalid
 * retained offsets enter `failed`; they never trigger a full-log replay.
 * `stop()` and `dispose()` cancel reads and backoff and are idempotent.
 *
 * @example
 * ```ts
 * import { createNetScriptStreamDB } from '@netscript/fresh/streams';
 * import { useLiveQuery } from '@tanstack/react-db';
 * import { myStreamSchema } from '@app/streams/schemas.ts';
 *
 * const db = createNetScriptStreamDB({
 *   streamPath: '/my-service/my-stream',
 *   schema: myStreamSchema,
 * });
 * await db.preload?.();
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
    ...(options.reconnect ? { reconnect: options.reconnect } : {}),
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

  const recovery = createStreamDBRecoveryAdapter(
    new DurableStream({
      ...input.streamOptions,
      backoffOptions: { initialDelay: 1, maxDelay: 1, multiplier: 1, maxRetries: 0 },
    }),
    input.reconnect,
  );
  const db = createStreamDB({ stream: recovery.stream, state: input.state });
  const lifetime = new AbortController();
  const stop = () => {
    lifetime.abort();
    recovery.stop();
    db.close();
  };
  return {
    collections: db.collections,
    async preload() {
      lifetime.signal.throwIfAborted();
      await abortable(db.preload(), lifetime.signal);
    },
    get status() {
      return recovery.status;
    },
    stop,
    dispose: stop,
  };
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
