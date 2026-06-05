/**
 * Client-side StreamDB factory for the Triggers plugin.
 *
 * Returns a TanStack DB-backed `StreamDB` with a typed `.collections.triggerEvent`
 * collection. Connect to the durable streams server via `@durable-streams/state`.
 *
 * @module
 */

import { createStreamDB, type StreamDB } from '@durable-streams/state';
import { buildStreamUrl, getStreamsAuth } from '@netscript/plugin-streams-core';
import { type TriggerEvent, triggersStreamSchema } from './schema.ts';

export type { TriggerEvent };

/**
 * Create a TanStack DB-backed StreamDB for trigger event entities.
 *
 * @example
 * ```ts
 * import { createTriggersStreamDB } from '@plugins/triggers/streams';
 * import { useLiveQuery } from '@tanstack/react-db';
 *
 * const triggersDb = createTriggersStreamDB({ baseUrl: 'http://localhost:4437' });
 *
 * const { data: detected } = useLiveQuery((q) =>
 *   q.from({ t: triggersDb.collections.triggerEvent })
 *     .where(({ t }) => t.status === 'detected')
 * );
 * ```
 */
export function createTriggersStreamDB(
  options: { baseUrl?: string } = {},
): StreamDB<typeof triggersStreamSchema> {
  const baseUrl = options.baseUrl ?? 'http://localhost:4437';

  return createStreamDB({
    streamOptions: {
      url: buildStreamUrl('/triggers/events', baseUrl),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state: triggersStreamSchema,
  });
}
