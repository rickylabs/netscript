import { createStreamDB as upstreamCreateStreamDB } from '@durable-streams/state/db';
import type { CollectionDefinition } from './stream-schema.ts';

/**
 * Create the upstream durable stream database without changing its schema inference.
 *
 * This shared public constructor also defines the nominal collection handle used
 * by `StreamCollection`; collections retain TanStack query and lifecycle support.
 *
 * @example
 * ```ts
 * import { createStreamDB, defineStreamSchema } from '@netscript/plugin-streams-core';
 * import { z } from 'zod';
 *
 * const schema = defineStreamSchema({
 *   sessions: { schema: z.object({ id: z.string() }), type: 'session', primaryKey: 'id' },
 * });
 * declare const streamUrl: string;
 * const db = createStreamDB({ streamOptions: { url: streamUrl }, state: schema });
 * console.log(db.collections.sessions.status);
 * ```
 */
export const createStreamDB: (typeof import('@durable-streams/state/db'))['createStreamDB'] =
  upstreamCreateStreamDB;

/**
 * Live TanStack collection handle for validated durable stream entities.
 *
 * @example
 * ```ts
 * import type { StreamCollection } from '@netscript/plugin-streams-core';
 *
 * declare const sessions: StreamCollection<{ id: string; state: string }>;
 * const session = sessions.get('session-1');
 * console.log(session?.state);
 * ```
 */
export type StreamCollection<T extends object> = ReturnType<
  typeof createStreamDB<{ item: CollectionDefinition<T> }>
>['collections']['item'];
