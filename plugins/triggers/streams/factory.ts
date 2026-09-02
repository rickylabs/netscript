/**
 * Client-side StreamDB factory for the Triggers plugin.
 *
 * Returns a TanStack DB-backed `StreamDB` with a typed `.collections.triggerEvent`
 * collection. Connect to the durable streams server via `@durable-streams/state`.
 *
 * @module
 */

import { createStateSchema } from '@durable-streams/state';
import { createStreamDB } from '@durable-streams/state/db';
import { buildStreamUrl, getStreamsAuth } from '@netscript/plugin-streams-core';
import {
  type TriggerEvent,
  type TriggersStreamDefinition,
  TriggerStreamEntitySchema,
} from './schema.ts';

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
 * import { createTriggersStreamDB } from '@netscript/plugin-triggers/streams';
 *
 * declare const streamsServiceUrl: string;
 *
 * const triggersDb = createTriggersStreamDB({ baseUrl: streamsServiceUrl });
 * const events = triggersDb.collections.triggerEvent;
 * void events;
 * ```
 */
export function createTriggersStreamDB(
  options: TriggersStreamDBOptions = {},
): TriggersStreamDB {
  const state = createStateSchema<TriggersStreamDefinition>({
    triggerEvent: {
      schema: TriggerStreamEntitySchema,
      type: 'triggerEvent',
      primaryKey: 'eventId',
    },
  });

  return createStreamDB({
    streamOptions: {
      url: buildStreamUrl('/triggers/events', options.baseUrl),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state,
  });
}
