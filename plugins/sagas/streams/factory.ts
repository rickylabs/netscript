/**
 * Client-side StreamDB factory for the Sagas plugin.
 *
 * Returns a TanStack DB-backed `StreamDB` with a typed `.collections.sagaInstance`
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
import { z } from 'zod';
import { type SagaInstance, SagaInstanceSchema } from './schema.ts';

export type { SagaInstance };

/** StreamDB instance returned by the sagas StreamDB factory. */
export interface SagasStreamDB {
  /** TanStack DB collections keyed by saga stream entity name. */
  readonly collections: {
    /** Saga instance collection created by the durable streams client. */
    readonly sagaInstance: StreamCollection<SagaInstance>;
  };
  /** Connect and preload stream state into the collections. */
  preload(): Promise<void>;
  /** Close the underlying stream connection. */
  close(): void;
}

// The pinned StreamDB client infers rows from the schema input. Keep input and
// output aligned while the existing parser still validates every incoming value.
const sagaInstanceSchema: z.ZodType<SagaInstance, SagaInstance> = z.custom<SagaInstance>()
  .transform(
    (value): SagaInstance => SagaInstanceSchema.parse(value),
  );
const state = createStateSchema({
  sagaInstance: {
    schema: sagaInstanceSchema,
    type: 'saga-instance',
    primaryKey: 'instanceId',
  },
});

/**
 * Create a TanStack DB-backed StreamDB for saga instance entities.
 *
 * @example
 * ```ts
 * import { createSagasStreamDB } from '@netscript/plugin-sagas/streams';
 * import { useLiveQuery } from '@tanstack/react-db';
 *
 * declare const streamsServiceUrl: string;
 *
 * const sagasDb = createSagasStreamDB({ baseUrl: streamsServiceUrl });
 *
 * // Call inside a React component or custom hook.
 * function useSagasRows() {
 *   const result = useLiveQuery((q) => q.from({ item: sagasDb.collections.sagaInstance }));
 *   const entityStates = result.data.map((item) => item.status);
 *   return { rows: result.data, state: result.state, status: result.status, entityStates };
 * }
 * void useSagasRows;
 * ```
 */
export function createSagasStreamDB(options: { baseUrl?: string } = {}): SagasStreamDB {
  return createStreamDB({
    streamOptions: {
      url: buildStreamUrl('/sagas/instances', options.baseUrl),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state,
  });
}
