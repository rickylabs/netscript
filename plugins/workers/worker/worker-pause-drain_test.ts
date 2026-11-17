import { assert, assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import { bounded, until } from '../../../packages/queue/tests/_fixtures/redis-lease-harness.ts';
import { recoveryContext } from './test_utils/redis-worker-context.ts';
import { Worker } from './worker.ts';

for (const mode of ['pause', 'drain'] as const) {
  Deno.test(`Worker ${mode} preserves admitted work and acknowledges a successful job`, async () => {
    await using kv = new MemoryKvAdapter();
    const entered = Promise.withResolvers<AbortSignal>();
    const release = Promise.withResolvers<void>();
    let executions = 0;
    let completed = 0;
    let acknowledged = 0;
    const queue = new MemoryQueueAdapter<JobMessage>();
    const dispatch = recoveryContext(new KvWorkerIdempotencyStore({ kv }), {
      execute: async (_definition, options) => {
        assert(options.signal instanceof AbortSignal);
        executions++;
        entered.resolve(options.signal);
        await release.promise;
        return { success: true, duration: 1 };
      },
    });
    const workerOptions = {
      ...dispatch,
      drainTimeoutMs: 2_000,
      abortGracePeriodMs: 500,
      queue: {
        nativeRetrial: queue.nativeRetrial,
        enqueue: (message: JobMessage) => queue.enqueue(message),
        stop: () => queue.stop(),
        listen: (
          handler: Parameters<typeof queue.listen>[0],
          options?: Parameters<typeof queue.listen>[1],
        ) =>
          queue.listen(async (message, delivery) => {
            await handler(message, delivery);
            await delivery.ack();
            acknowledged++;
          }, options),
      },
      taskQueue: new MemoryQueueAdapter<TaskMessage>(),
      executionState: {
        ...dispatch.executionState,
        complete: (id: string, result: { status: string }) => {
          if (result.status === 'completed') completed++;
          return Promise.resolve({ id });
        },
      },
    };
    const worker = new Worker(workerOptions);
    if (mode === 'pause') {
      assert('pause' in worker && typeof worker.pause === 'function', 'Worker.pause is missing.');
      assert(
        'resume' in worker && typeof worker.resume === 'function',
        'Worker.resume is missing.',
      );
    }
    await queue.enqueue({ jobId: 'first', topic: 'jobs', triggeredBy: 'queue' });
    let startSettled = false;
    const started = worker.start().finally(() => startSettled = true);
    void started.catch(() => {});
    let stopping: Promise<void> | undefined;
    try {
      const signal = await bounded(entered.promise);
      if (mode === 'pause') {
        assert('pause' in worker && typeof worker.pause === 'function');
        await worker.pause();
      } else {
        stopping = worker.stop();
      }
      assertEquals(signal.aborted, false, 'Stopping intake must leave the handler running.');
      await queue.enqueue({ jobId: 'second', topic: 'jobs', triggeredBy: 'queue' });
      release.resolve();
      await until(() => Promise.resolve(completed === 1));
      await delay(30);
      assertEquals(executions, 1, 'Paused/draining worker admitted another job.');
      assertEquals(acknowledged, 1);
      if (mode === 'pause') {
        assertEquals(startSettled, false, 'Pause must retain the process start lifetime.');
        assert('resume' in worker && typeof worker.resume === 'function');
        await worker.resume();
        await until(() => Promise.resolve(completed === 2));
      } else {
        await bounded(stopping!);
      }
    } finally {
      release.resolve();
      await bounded(stopping ?? worker.stop());
      await bounded(started);
    }
  });
}
