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

import { createStreamDB } from '@durable-streams/state';
import type { StateSchema, StreamDB, StreamStateDefinition } from '@durable-streams/state';
import { buildStreamUrl, getStreamsAuth, getStreamsUrl } from '@netscript/plugin-streams-core';

/** Options for `createNetScriptStreamDB`. */
export interface NetScriptStreamDBOptions {
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
export function createNetScriptStreamDB<TDef extends StreamStateDefinition>(
  options: NetScriptStreamDBOptions & { schema: StateSchema<TDef> },
): StreamDB<TDef> {
  const baseUrl = options.baseUrl ?? getStreamsUrl();

  return createStreamDB<TDef>({
    streamOptions: {
      url: buildStreamUrl(options.streamPath, baseUrl),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state: options.schema as unknown as TDef,
  });
}
