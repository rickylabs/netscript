import { assertEquals, assertRejects } from '@std/assert';
import { stub } from '@std/testing/mock';
import { trace } from 'npm:@opentelemetry/api@^1.9.1';
import { BasicTracerProvider } from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
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
      const idempotency = new KvWorkerIdempotencyStore({ kv: storage });
      const deadLetters = new KvDeadLetterStore<JobMessage>({
        kv: storage,
        queueName: 'post-success-dlq',
      });
      let releases = 0;
      const originalRelease = idempotency.release.bind(idempotency);
      using _releaseStub = stub(idempotency, 'release', (key: string, token?: string) => {
        releases += 1;
        return originalRelease(key, token);
      });
      let effects = 0;
      const context = {
        ...recoveryContext(idempotency, {
          execute: () => {
            effects += 1;
            return Promise.resolve({ success: true, duration: 1 });
          },
        }),
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

Deno.test('throwing OpenTelemetry state_update span event after job success never marks failed, dead-letters, releases claim, or nacks', async () => {
  const provider = new BasicTracerProvider();
  const activeSpan = provider.getTracer('post-success-test').startSpan('job.execute');
  const originalAddEvent = activeSpan.addEvent.bind(activeSpan);
  activeSpan.addEvent = ((name: string, attributesOrStartTime?: unknown, startTime?: unknown) => {
    if (
      name === 'job.step.state_update' &&
      typeof attributesOrStartTime === 'object' &&
      attributesOrStartTime !== null &&
      'status' in attributesOrStartTime &&
      (attributesOrStartTime as { status?: unknown }).status === 'completed'
    ) {
      throw new Error('otel span state_update failed');
    }
    return originalAddEvent(
      name,
      attributesOrStartTime as Parameters<typeof originalAddEvent>[1],
      startTime as Parameters<typeof originalAddEvent>[2],
    );
  }) as typeof activeSpan.addEvent;
  using _activeSpanStub = stub(trace, 'getActiveSpan', () => activeSpan);

  try {
    await withTempKvPath(async (path) => {
      const rawKv = await Deno.openKv(path);
      try {
        const storage = new DenoKvAdapter(rawKv);
        const executionState = new KvExecutionState({ kv: storage, workerId: 'otel-post-success' });
        const idempotency = new KvWorkerIdempotencyStore({ kv: storage });
        const deadLetters = new KvDeadLetterStore<JobMessage>({
          kv: storage,
          queueName: 'otel-post-success-dlq',
        });
        let releases = 0;
        const originalRelease = idempotency.release.bind(idempotency);
        using _releaseStub = stub(idempotency, 'release', (key: string, token?: string) => {
          releases += 1;
          return originalRelease(key, token);
        });
        let providerEffects = 0;
        const context = {
          ...recoveryContext(idempotency, {
            execute: () => {
              providerEffects += 1;
              return Promise.resolve({ success: true, duration: 1 });
            },
          }),
          executionState,
          deadLetters,
        };
        let nacks = 0;
        const queueContext: MessageContext = {
          messageId: 'msg-otel-post-success',
          deliveryCount: 1,
          enqueuedAt: new Date(),
          headers: {},
          ack: () => Promise.resolve(),
          nack: () => {
            nacks += 1;
            return Promise.resolve();
          },
        };

        await processWorkerJob(
          context,
          { jobId: 'job-otel-ok', topic: 'jobs', triggeredBy: 'queue', idempotencyKey: 'otel-1' },
          queueContext,
        );
        assertEquals(providerEffects, 1);
        assertEquals(nacks, 0, 'post-success span fault must not nack/requeue');
        assertEquals(releases, 0, 'post-success span fault must not release claim');
        assertEquals(await deadLetters.depth(), 0, 'post-success span fault must not dead-letter');
        assertEquals((await executionState.listByStatus('completed')).length, 1);
        assertEquals((await executionState.listByStatus('failed')).length, 0);

        await assertRejects(
          () =>
            processWorkerJob(context, {
              jobId: 'job-otel-direct',
              topic: 'jobs',
              triggeredBy: 'queue',
              idempotencyKey: 'otel-2',
            }),
          Error,
          'otel span state_update failed',
        );
        assertEquals(providerEffects, 2);
        assertEquals(releases, 0);
        assertEquals(await deadLetters.depth(), 0);
        assertEquals((await executionState.listByStatus('completed')).length, 2);
        assertEquals((await executionState.listByStatus('failed')).length, 0);
      } finally {
        rawKv.close();
      }
    });
  } finally {
    activeSpan.end();
    await provider.shutdown();
  }
});

Deno.test('throwing secondary diagnostic sink after post-success fault never rejects queued job or task callbacks or triggers nack', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    try {
      const storage = new DenoKvAdapter(rawKv);
      const executionState = new KvExecutionState({ kv: storage, workerId: 'diag-sink-fault' });
      const idempotency = new KvWorkerIdempotencyStore({ kv: storage });
      const deadLetters = new KvDeadLetterStore<JobMessage>({
        kv: storage,
        queueName: 'diag-sink-dlq',
      });
      let releases = 0;
      const originalRelease = idempotency.release.bind(idempotency);
      using _releaseStub = stub(idempotency, 'release', (key: string, token?: string) => {
        releases += 1;
        return originalRelease(key, token);
      });
      let effects = 0;
      const context = {
        ...recoveryContext(idempotency, {
          execute: () => {
            effects += 1;
            return Promise.resolve({ success: true, duration: 1 });
          },
        }),
        executionState,
        deadLetters,
      };
      let nacks = 0;
      const queueContext: MessageContext = {
        messageId: 'msg-diag-sink',
        deliveryCount: 1,
        enqueuedAt: new Date(),
        headers: {},
        ack: () => Promise.resolve(),
        nack: () => {
          nacks += 1;
          return Promise.resolve();
        },
      };

      using _consoleErrStub = stub(console, 'error', () => {
        throw new Error('diagnostic sink failed');
      });

      // Job path: primary metrics fault + throwing secondary diagnostic sink.
      {
        using _processedStub = stub(getWorkerMetricInstruments().processedJobs, 'add', () => {
          throw new Error('metrics exporter failed');
        });

        await processWorkerJob(
          context,
          { jobId: 'job-diag-q', topic: 'jobs', triggeredBy: 'queue', idempotencyKey: 'diag-j1' },
          queueContext,
        );
        assertEquals(effects, 1);
        assertEquals(nacks, 0);
        assertEquals(releases, 0);
        assertEquals(await deadLetters.depth(), 0);
        assertEquals((await executionState.listByStatus('completed')).length, 1);
        assertEquals((await executionState.listByStatus('failed')).length, 0);

        await assertRejects(
          () =>
            processWorkerJob(context, {
              jobId: 'job-diag-direct',
              topic: 'jobs',
              triggeredBy: 'queue',
              idempotencyKey: 'diag-j2',
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

      // Task path: primary logger fault + throwing diagnostic sink.
      {
        using _logStub = stub(workerJobLogger, 'debug', (...args: unknown[]) => {
          if (typeof args[0] === 'string' && args[0].includes('completed')) {
            throw new Error('task logger failed');
          }
        });

        await processWorkerTask(
          context,
          {
            taskId: 'task-diag-q',
            topic: 'tasks',
            triggeredBy: 'queue',
            idempotencyKey: 'diag-t1',
          },
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
              taskId: 'task-diag-direct',
              topic: 'tasks',
              triggeredBy: 'queue',
              idempotencyKey: 'diag-t2',
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
