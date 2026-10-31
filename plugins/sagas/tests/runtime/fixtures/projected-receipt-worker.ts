import { z } from 'zod';
import { assert, assertEquals } from '@std/assert';
import type { WatchableKv } from '@netscript/kv';
import type { JobDefinition } from '@netscript/plugin-workers-core/runtime';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { WorkerJobCommandRequest } from '@netscript/plugin-workers-core/integration/commands';
import { processWorkerJob } from '../../../../workers/worker/job-dispatcher.ts';
import { createWorkerPool } from '../../../../workers/worker/job-runner-pool.ts';
import type { WorkerDispatchContext } from '../../../../workers/worker/worker-options.ts';

/** Exercise the shipped worker dispatcher and pool, retaining execution and replay state in KV. */
export async function withReceiptWorker(
  kv: WatchableKv,
  job: JobDefinition,
  run: (dispatch: (request: WorkerJobCommandRequest) => Promise<unknown>) => Promise<void>,
): Promise<void> {
  const pool = createWorkerPool();
  const executions = new KvExecutionState({ kv, workerId: 'receipt-investigator' });
  const context: WorkerDispatchContext = {
    workerId: 'receipt-investigator',
    concurrency: 1,
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
  await pool.initialize();
  try {
    await run(async (request) => {
      assertEquals(request.jobId, job.id);
      await processWorkerJob(context, {
        jobId: request.jobId,
        payload: z.object({ id: z.string() }).parse(request.payload),
        triggeredBy: 'manual',
        topic: 'receipt',
        idempotencyKey: request.idempotencyKey,
        correlationId: request.correlationId,
      });
      const records = await executions.listAll();
      for (const record of records) {
        assertEquals(record.status, 'completed', record.error ?? undefined);
      }
      assertEquals(records.length, 1);
      const execution = records[0];
      assert(execution);
      assertEquals(execution.status, 'completed', execution.error ?? undefined);
      return { jobId: job.id, runId: execution.id, acceptedAt: new Date(execution.triggeredAt) };
    });
  } finally {
    await pool.shutdown();
  }
}
