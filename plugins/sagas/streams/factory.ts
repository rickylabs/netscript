/**
 * Client-side StreamDB factory for the Sagas plugin.
 *
 * Returns a TanStack DB-backed `StreamDB` with a typed `.collections.sagaInstance`
 * collection. Connect to the durable streams server via `@durable-streams/state`.
 *
 * @module
 */

import { createStreamDB } from '@durable-streams/state/db';
import type { StreamStateDefinition as DurableStreamStateDefinition } from '@durable-streams/state';
import { buildStreamUrl, getStreamsAuth } from '@netscript/plugin-streams-core';
import { type SagaInstance, sagasStreamSchema } from './schema.ts';

export type { SagaInstance };

/** StreamDB instance returned by the sagas StreamDB factory. */
export interface SagasStreamDB {
  /** TanStack DB collections keyed by saga stream entity name. */
  readonly collections: {
    /** Saga instance collection created by the durable streams client. */
    readonly sagaInstance: unknown;
  };
  /** Connect and preload stream state into the collections. */
  preload(): Promise<void>;
  /** Close the underlying stream connection. */
  close(): void;
}

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
    state: sagasStreamSchema as unknown as DurableStreamStateDefinition, // quality-allow: compatibility boundary between independently resolved upstream generic types
  }) as unknown as SagasStreamDB; // quality-allow: compatibility boundary between independently resolved upstream generic types
}
