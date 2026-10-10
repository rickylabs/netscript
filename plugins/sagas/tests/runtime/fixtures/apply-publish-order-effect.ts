import { assert, assertEquals } from '@std/assert';
import { z } from 'zod';
import { publishOrderJob } from './publish-order-saga.ts';
import { DenoKvAdapter } from '@netscript/kv';
import { createPostgresCommandOutboxRelayStore } from '@netscript/database/commands/postgres';
import type {
  PostgresCommandClient,
  TransactionClientPort,
} from '@netscript/database/commands/postgres';
import { createCommandOutboxRelay } from '@netscript/service/commands/relay';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import { createWorkerCommandOutboxSink } from '@netscript/plugin-workers-core/integration/commands';
import type { JobDefinition } from '@netscript/plugin-workers-core/runtime';
import { processWorkerJob } from '../../../../workers/worker/job-dispatcher.ts';
import { createWorkerPool } from '../../../../workers/worker/job-runner-pool.ts';
import type { WorkerDispatchContext } from '../../../../workers/worker/worker-options.ts';

const applicationPayloadSchema = z.object({ correlationKey: z.string() });

/** Apply the recovered intent through the native worker, then replay its stable identity. */
export async function applyPublishOrderEffect<TTx extends PostgresCommandClient>(
  root: PostgresCommandClient & TransactionClientPort<TTx>,
  temp: string,
): Promise<void> {
  const kv = new DenoKvAdapter(await Deno.openKv(`${temp}/worker.sqlite`));
  const executions = new KvExecutionState({ kv, workerId: 'publish-order-consumer' });
  const pool = createWorkerPool();
  let applications = 0;
  const job: JobDefinition = {
    id: publishOrderJob.id,
    enabled: true,
    executionType: 'deno',
    entrypoint: import.meta.url,
    async handler(context) {
      assertEquals(context.payload, { correlationKey: 'restart' });
      applications++;
      await root.$executeRawUnsafe(
        'INSERT INTO publish_order_application (correlation_key) VALUES ($1)',
        'restart',
      );
      return { success: true };
    },
  };
  const dispatchContext: WorkerDispatchContext = {
    workerId: 'publish-order-consumer',
    registry: { get: () => Promise.resolve(job) },
    executionState: executions,
    idempotency: new KvWorkerIdempotencyStore({ kv }),
    workerPool: pool,
    jobsDir: '.',
    activeJobs: new Map(),
    workerSpan: null,
    taskRegistry: { get: () => Promise.resolve(undefined) },
    taskExecutor: { execute: () => Promise.reject(new Error('Unexpected task')) },
  };
  const sink = createWorkerCommandOutboxSink({
    id: 'workers',
    targets: new Map([['publish-order', { kind: 'job' as const, id: publishOrderJob.id }]]),
    workers: {
      async triggerJob(request) {
        assertEquals(request.jobId, job.id);
        await processWorkerJob(dispatchContext, {
          jobId: request.jobId,
          payload: applicationPayloadSchema.parse(request.payload),
          topic: 'publish-order',
          triggeredBy: 'manual',
          idempotencyKey: request.idempotencyKey,
          correlationId: request.correlationId,
        });
        const records = await executions.listAll({ limit: 2 });
        assertEquals(records.length, 1);
        const execution = records[0];
        assertEquals(execution.status, 'completed');
        return { jobId: job.id, runId: execution.id, acceptedAt: new Date(execution.triggeredAt) };
      },
      triggerTask: () => Promise.reject(new Error('Unexpected task')),
    },
  });
  const relay = createCommandOutboxRelay({
    store: createPostgresCommandOutboxRelayStore(root, { transactionTimeoutMs: 5000 }),
    sinks: new Map([['workers', sink]]),
    clock: { now: () => new Date() },
    ids: { next: () => crypto.randomUUID() },
    batchSize: 1,
    concurrency: 1,
    leaseMs: 1000,
    maxAttempts: 3,
    maxRetryDelayMs: 1000,
    classify: () => 'unavailable',
    retryAt: (_attempt, now) => new Date(now.getTime() + 1),
  });
  try {
    await root.$executeRawUnsafe(
      'CREATE TABLE publish_order_application (correlation_key text PRIMARY KEY)',
    );
    await pool.initialize();
    assertEquals(await relay.drainOnce(), 1);
    assertEquals(await relay.drainOnce(), 0);
    // Real KV worker idempotency also prevents direct downstream redelivery from executing twice.
    const [intent] = await root.$queryRawUnsafe<{ id: string }[]>(
      'SELECT id FROM netscript_command_outbox WHERE correlation_id=$1',
      'restart',
    );
    assert(intent);
    await processWorkerJob(dispatchContext, {
      jobId: job.id,
      payload: { correlationKey: 'restart' },
      topic: 'publish-order',
      triggeredBy: 'manual',
      idempotencyKey: intent.id,
      correlationId: 'restart',
    });
    assertEquals(applications, 1);
    const rows = await root.$queryRawUnsafe<{ count: bigint }[]>(
      'SELECT count(*) AS count FROM publish_order_application',
    );
    assertEquals(Number(rows[0].count), 1);
    assertEquals(await executions.countAll(), 1);
  } finally {
    await relay.stop();
    await pool.shutdown();
    await kv.close();
  }
}
