import { assertEquals, assertRejects } from '@std/assert';
import { stub } from '@std/testing/mock';
import { DenoKvAdapter } from '@netscript/kv';
import type { MessageContext } from '@netscript/queue';
import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { JobMessage } from '@netscript/plugin-workers-core/runtime';
import { getWorkerMetricInstruments } from '@netscript/telemetry/instrumentation';
import { recoveryContext } from '../../worker/test_utils/redis-worker-context.ts';
import { processWorkerJob, processWorkerTask } from '../../worker/job-dispatcher.ts';
import { workerJobLogger } from '../../worker/job-logger.ts';

async function withTempKvPath(run: (path: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'worker-kv-post-success-' });
  try {
    await run(`${dir}/kv.sqlite`);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test('unexpected post-success telemetry or logging error never marks execution failed, dead-letters, releases claim, or nacks', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    try {
      const storage = new DenoKvAdapter(rawKv);
      const executionState = new KvExecutionState({ kv: storage, workerId: 'post-success' });
      const baseIdempotency = new KvWorkerIdempotencyStore({ kv: storage });
      const deadLetters = new KvDeadLetterStore<JobMessage>({
        kv: storage,
        queueName: 'post-success-dlq',
      });
      let releases = 0;
      const idempotency = {
        claim: baseIdempotency.claim.bind(baseIdempotency),
        markApplied: baseIdempotency.markApplied.bind(baseIdempotency),
        release: (key: string, token?: string) => {
          releases += 1;
          return baseIdempotency.release(key, token);
        },
        isApplied: baseIdempotency.isApplied.bind(baseIdempotency),
      };
      let effects = 0;
      const context = {
        ...recoveryContext(baseIdempotency, {
          execute: () => {
            effects += 1;
            return Promise.resolve({ success: true, duration: 1 });
          },
        }),
        idempotency,
        executionState,
        deadLetters,
      };
      let nacks = 0;
      const queueContext: MessageContext = {
        messageId: 'msg-post-success',
        deliveryCount: 1,
        enqueuedAt: new Date(),
        headers: {},
        ack: () => Promise.resolve(),
        nack: () => {
          nacks += 1;
          return Promise.resolve();
        },
      };

      {
        using _metricsStub = stub(getWorkerMetricInstruments().processedJobs, 'add', () => {
          throw new Error('metrics exporter failed');
        });
        await processWorkerJob(
          context,
          { jobId: 'job-ok', topic: 'jobs', triggeredBy: 'queue', idempotencyKey: 'ps-job-1' },
          queueContext,
        );
        assertEquals(effects, 1);
        assertEquals(nacks, 0, 'post-success error must not nack/requeue');
        assertEquals(releases, 0, 'post-success error must not release claim');
        assertEquals(await deadLetters.depth(), 0, 'post-success error must not dead-letter');
        assertEquals((await executionState.listByStatus('completed')).length, 1);
        assertEquals((await executionState.listByStatus('failed')).length, 0);

        // Direct caller without queueContext still observes the error while state stays completed.
        await assertRejects(
          () =>
            processWorkerJob(context, {
              jobId: 'job-ok-direct',
              topic: 'jobs',
              triggeredBy: 'queue',
              idempotencyKey: 'ps-job-2',
            }),
          Error,
          'metrics exporter failed',
        );
        assertEquals(effects, 2);
        assertEquals(releases, 0);
        assertEquals(await deadLetters.depth(), 0);
        assertEquals((await executionState.listByStatus('completed')).length, 2);
        assertEquals((await executionState.listByStatus('failed')).length, 0);
      }

      // Same invariant on processWorkerTask when post-success logging throws.
      {
        using _logStub = stub(workerJobLogger, 'debug', (...args: unknown[]) => {
          if (typeof args[0] === 'string' && args[0].includes('completed')) {
            throw new Error('task logger failed');
          }
        });
        await processWorkerTask(
          context,
          { taskId: 'task-ok', topic: 'tasks', triggeredBy: 'queue', idempotencyKey: 'ps-task-1' },
          queueContext,
        );
        assertEquals(nacks, 0);
        assertEquals(releases, 0);
        assertEquals(
          (await executionState.listByStatus('completed', { concept: 'task' })).length,
          1,
        );
        assertEquals((await executionState.listByStatus('failed', { concept: 'task' })).length, 0);

        await assertRejects(
          () =>
            processWorkerTask(context, {
              taskId: 'task-ok-direct',
              topic: 'tasks',
              triggeredBy: 'queue',
              idempotencyKey: 'ps-task-2',
            }),
          Error,
          'task logger failed',
        );
        assertEquals(releases, 0);
        assertEquals(
          (await executionState.listByStatus('completed', { concept: 'task' })).length,
          2,
        );
        assertEquals((await executionState.listByStatus('failed', { concept: 'task' })).length, 0);
      }
    } finally {
      rawKv.close();
    }
  });
});
