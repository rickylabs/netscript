/**
 * Client-side StreamDB factory for the Workers plugin.
 *
 * Returns a TanStack DB-backed `StreamDB` with typed `.collections` for
 * worker executions and jobs. Connect it to the Aspire-discovered durable streams
 * service via `@durable-streams/state`.
 *
 * @module
 */

import { createStreamDB } from '@durable-streams/state/db';
import { buildStreamUrl, getStreamsAuth } from '@netscript/plugin-streams-core';
import { type WorkerExecution, type WorkerJob, workersStreamSchema } from './schema.ts';

export type { WorkerExecution, WorkerJob };

/** Browser-facing StreamDB surface returned by the workers stream factory. */
export type WorkersStreamDB = Readonly<{
  /** Live collection handles keyed by workers stream entity name. */
  readonly collections: Readonly<{
    /** Worker execution collection handle. */
    readonly execution: unknown;
    /** Worker job collection handle. */
    readonly job: unknown;
  }>;
}>;

/**
 * Create a TanStack DB-backed StreamDB for worker execution and job entities.
 *
 * The returned `StreamDB` has `.collections.execution` and `.collections.job`
 * which are live TanStack DB `Collection` instances.  Use them with
 * `useLiveQuery` from `@tanstack/react-db`.
 *
 * @example
 * ```ts
 * import { createWorkersStreamDB } from '@plugins/workers/streams';
 * import { useLiveQuery } from '@tanstack/react-db';
 *
 * const workersDb = createWorkersStreamDB({ baseUrl: streamsServiceUrl });
 *
 * // In a Preact island:
 * const { data: running } = useLiveQuery((q) =>
 *   q.from({ e: workersDb.collections.execution })
 *     .where(({ e }) => e.status === 'running')
 * );
 * ```
 */
export function createWorkersStreamDB(
  options: { baseUrl?: string } = {},
): WorkersStreamDB {
  const baseUrl = requiredStreamsBaseUrl(options.baseUrl);

  return createStreamDB({
    streamOptions: {
      url: buildStreamUrl('/workers/executions', baseUrl),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state: workersStreamSchema,
  }) as WorkersStreamDB;
}

function requiredStreamsBaseUrl(baseUrl: string | undefined): string {
  if (baseUrl === undefined) {
    throw new Error('Workers StreamDB requires the Aspire-discovered streams service URL.');
  }
  return baseUrl;
}
