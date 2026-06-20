/**
 * Client-side StreamDB factory for the Auth plugin.
 *
 * Returns a TanStack DB-backed `StreamDB` with a typed `.collections.authSession`
 * collection. Connect to the durable streams server via `@durable-streams/state`.
 *
 * @module
 */

import { createStreamDB } from '@durable-streams/state/db';
import type { StreamStateDefinition as DurableStreamStateDefinition } from '@durable-streams/state';
import { buildStreamUrl, getStreamsAuth } from '@netscript/plugin-streams-core';
import { type AuthSession, authStreamSchema } from './schema.ts';

export type { AuthSession };

/** StreamDB instance returned by the auth StreamDB factory. */
export interface AuthStreamDB {
  /** TanStack DB collections keyed by auth stream entity name. */
  readonly collections: {
    /** Auth session collection created by the durable streams client. */
    readonly authSession: unknown;
  };
  /** Connect and preload stream state into the collections. */
  preload(): Promise<void>;
  /** Close the underlying stream connection. */
  close(): void;
}

/**
 * Create a TanStack DB-backed StreamDB for auth session entities.
 *
 * @example
 * ```ts
 * import { createAuthStreamDB } from '@plugins/auth/streams';
 * import { useLiveQuery } from '@tanstack/react-db';
 *
 * const authDb = createAuthStreamDB({ baseUrl: 'http://localhost:4437' });
 *
 * const { data: active } = useLiveQuery((q) =>
 *   q.from({ s: authDb.collections.authSession })
 *     .where(({ s }) => s.state === 'active')
 * );
 * ```
 */
export function createAuthStreamDB(options: { baseUrl?: string } = {}): AuthStreamDB {
  const baseUrl = options.baseUrl ?? 'http://localhost:4437';

  return createStreamDB({
    streamOptions: {
      url: buildStreamUrl('/auth/sessions', baseUrl),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state: authStreamSchema as unknown as DurableStreamStateDefinition,
  }) as unknown as AuthStreamDB;
}
