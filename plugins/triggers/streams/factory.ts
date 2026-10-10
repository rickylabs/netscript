/**
 * Client-side StreamDB factory for the Triggers plugin.
 *
 * Returns a TanStack DB-backed `StreamDB` with a typed `.collections.triggerEvent`
 * collection. Connect to the durable streams server via `@durable-streams/state`.
 *
 * @module
 */

import { createStreamDB } from '@durable-streams/state/db';
import { createStateSchema } from '@durable-streams/state';
import {
  buildStreamUrl,
  getStreamsAuth,
  type StreamCollection,
} from '@netscript/plugin-streams-core';
import {
  type TriggerEvent,
  type TriggersStreamDefinition,
  type TriggerStreamEntity,
  TriggerStreamEntitySchema,
} from './schema.ts';

export type { TriggerEvent };

/** Browser StreamDB collections exposed by the triggers stream client. */
export type TriggersStreamCollections = Readonly<{
  triggerEvent: StreamCollection<TriggerStreamEntity>;
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
 * import { useLiveQuery } from '@tanstack/react-db';
 *
 * declare const streamsServiceUrl: string;
 *
 * const triggersDb = createTriggersStreamDB({ baseUrl: streamsServiceUrl });
 *
 * // Call inside a React component or custom hook.
 * function useTriggersRows() {
 *   const result = useLiveQuery((q) => q.from({ item: triggersDb.collections.triggerEvent }));
 *   const entityStates = result.data.map((item) => item.status);
 *   return { rows: result.data, state: result.state, status: result.status, entityStates };
 * }
 * void useTriggersRows;
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
