/**
 * Client-side StreamDB factory for the Triggers plugin.
 *
 * Returns a TanStack DB-backed `StreamDB` with a typed `.collections.triggerEvent`
 * collection. Connect to the durable streams server via `@durable-streams/state`.
 *
 * @module
 */

import { createStreamDB } from '@durable-streams/state/db';
import { buildStreamUrl, getStreamsAuth } from '@netscript/plugin-streams-core';
import { type TriggerEvent, triggersStreamSchema } from './schema.ts';

export type { TriggerEvent };

/** Browser StreamDB collections exposed by the triggers stream client. */
export type TriggersStreamCollections = Readonly<{
  triggerEvent: unknown;
}>;

/** Browser StreamDB handle for trigger event entities. */
export type TriggersStreamDB = Readonly<{
  collections: TriggersStreamCollections;
}>;

/** Options for creating a triggers StreamDB client. */
export type TriggersStreamDBOptions = Readonly<{
  baseUrl?: string;
}>;

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
  options: TriggersStreamDBOptions = {},
): TriggersStreamDB {
  const baseUrl = options.baseUrl ?? 'http://localhost:4437';

  return createStreamDB({
    streamOptions: {
      url: buildStreamUrl('/triggers/events', baseUrl),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state: triggersStreamSchema as never,
  }) as unknown as TriggersStreamDB; // quality-allow: compatibility boundary between independently resolved upstream generic types
}
