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
 * import { createWorkersStreamDB } from '@netscript/plugin-workers/streams';
 *
 * declare const streamsServiceUrl: string;
 *
 * const workersDb = createWorkersStreamDB({ baseUrl: streamsServiceUrl });
 * const executions = workersDb.collections.execution;
 * void executions;
 * ```
 */
export function createWorkersStreamDB(
  options: { baseUrl?: string } = {},
): WorkersStreamDB {
  return createStreamDB({
    streamOptions: {
      url: buildStreamUrl('/workers/executions', options.baseUrl),
      contentType: 'application/json',
      headers: getStreamsAuth(),
    },
    state: workersStreamSchema,
  }) as WorkersStreamDB;
}
