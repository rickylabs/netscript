/**
 * Client-side StreamDB factory for the Sagas plugin.
 *
 * Returns a TanStack DB-backed `StreamDB` with a typed `.collections.sagaInstance`
 * collection. Connect to the durable streams server via `@durable-streams/state`.
 *
 * @module
 */

import { createStreamDB } from '@durable-streams/state';
import { buildStreamUrl, getStreamsAuth } from '@netscript/plugin-streams-core';
import { type SagaInstance, sagasStreamSchema } from './schema.ts';

export type { SagaInstance };

/** StreamDB instance returned by the sagas StreamDB factory. */
export type SagasStreamDB = ReturnType<typeof createStreamDB>;

/**
 * Create a TanStack DB-backed StreamDB for saga instance entities.
 *
 * @example
 * ```ts
 * import { createSagasStreamDB } from '@plugins/sagas/streams';
 * import { useLiveQuery } from '@tanstack/react-db';
 *
 * const sagasDb = createSagasStreamDB({ baseUrl: 'http://localhost:4437' });
 *
 * const { data: active } = useLiveQuery((q) =>
 *   q.from({ s: sagasDb.collections.sagaInstance })
 *     .where(({ s }) => s.status === 'active')
 * );
 * ```
 */
export function createSagasStreamDB(options: { baseUrl?: string } = {}): SagasStreamDB {
  const baseUrl = options.baseUrl ?? 'http://localhost:4437';

  return createStreamDB({
    streamOptions: {
      url: buildStreamUrl('/sagas/instances', baseUrl),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state: sagasStreamSchema,
  });
}
