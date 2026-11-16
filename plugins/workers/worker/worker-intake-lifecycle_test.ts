import { assert, assertEquals, assertRejects, assertStrictEquals } from '@std/assert';
import { delay } from '@std/async';
import { stub } from '@std/testing/mock';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import { DenoKvAdapter } from '@netscript/queue/adapters/deno-kv';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import type { ListenOptions, MessageContext, MessageQueue, NackOptions } from '@netscript/queue';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import { bounded, until } from '../../../packages/queue/tests/_fixtures/redis-lease-harness.ts';
import { recoveryContext } from './test_utils/redis-worker-context.ts';
import { Worker } from './worker.ts';

for (const family of ['jobs', 'tasks', 'triggers'] as const) {
  for (const mode of ['pause', 'drain'] as const) {
    Deno.test(`${family} ${mode} retains admitted work and owns the backend drain`, async () => {
      await using kv = new MemoryKvAdapter();
      const entered = Promise.withResolvers<AbortSignal>();
      const release = Promise.withResolvers<void>();
      let calls = 0;
      let completed = 0;
      const context = recoveryContext(new KvWorkerIdempotencyStore({ kv }), {
        execute: async (_definition, options) => {
          assert(options.signal instanceof AbortSignal);
          calls++;
          entered.resolve(options.signal);
          await release.promise;
          return { success: true, duration: 1 };
        },
      });
      const jobs = new MemoryQueueAdapter<JobMessage>();
      const tasks = new MemoryQueueAdapter<TaskMessage>();
      const triggers = new MemoryQueueAdapter<unknown>();
      const seen = new Map<string, ListenOptions | undefined>();
      const observed = <T>(queue: MemoryQueueAdapter<T>, name: string): MessageQueue<T> => ({
        nativeRetrial: queue.nativeRetrial,
        enqueue: (message, options) => queue.enqueue(message, options),
        stop: () => queue.stop(),
        listen: (handler, options) => {
          seen.set(name, options);
          return queue.listen(handler, options);
        },
      });
      using _triggers = stub(DenoKvAdapter.prototype, 'listen', (handler, options) => {
        seen.set('triggers', options);
        return triggers.listen(handler, options);
      });
      const worker = new Worker({
        ...context,
        queue: observed(jobs, 'jobs'),
        taskQueue: observed(tasks, 'tasks'),
        queueTriggers: [{ queueName: 'lifecycle-events', jobId: 'event' }],
        drainTimeoutMs: 2_000,
        abortGracePeriodMs: 500,
        executionState: {
          ...context.executionState,
          complete: (id, result) => {
            if (result.status === 'completed') completed++;
            return Promise.resolve({ id });
          },
        },
      });
      const enqueue = () =>
        family === 'jobs'
          ? jobs.enqueue({ jobId: 'job', topic: 'jobs', triggeredBy: 'queue' })
          : family === 'tasks'
          ? tasks.enqueue({ taskId: 'task', topic: 'tasks', triggeredBy: 'queue' })
          : triggers.enqueue({ event: true });
      let finished = false;
      const started = worker.start().finally(() => finished = true);
      void started.catch(() => {});
      let stopping: Promise<void> | undefined;
      try {
        await until(() => Promise.resolve(seen.size === 3));
        for (const options of seen.values()) assertEquals(options?.drainTimeoutMs, Infinity);
        await enqueue();
        const signal = await bounded(entered.promise);
        if (mode === 'pause') worker.pause();
        else stopping = worker.stop();
        await enqueue();
        assertEquals(signal.aborted, false);
        if (mode === 'pause') {
          assertEquals(worker.healthStatus.lifecycle, 'paused');
          assertEquals(worker.healthStatus.status, 'healthy');
          assertEquals(worker.isRunning, true);
          worker.resume();
          await delay(30);
          assertEquals(calls, 1, 'Resume over-admitted before the old generation settled.');
          worker.pause();
          worker.pause();
        }
        release.resolve();
        await until(() => Promise.resolve(completed === 1));
        await delay(30);
        assertEquals(calls, 1);
        if (mode === 'pause') {
          assertEquals(finished, false);
          assertEquals(
            worker.healthStatus.listeners.every((listener) => listener.restartCount === 0),
            true,
          );
          worker.resume();
          await until(() => Promise.resolve(completed === 2));
        } else await bounded(stopping!);
      } finally {
        release.resolve();
        await bounded(stopping ?? worker.stop());
        await bounded(started);
        await triggers.stop();
      }
    });
  }
}

Deno.test('a committed paused claim is charged while a draining claim preserves its attempt', async () => {
  await using kv = new MemoryKvAdapter();
  let executions = 0;
  const context = recoveryContext(new KvWorkerIdempotencyStore({ kv }), {
    execute: () => {
      executions++;
      return Promise.resolve({ success: true, duration: 1 });
    },
  });
  const ready = Promise.withResolvers<void>();
  let deliver: Parameters<MessageQueue<JobMessage>['listen']>[0] | undefined;
  const worker = new Worker({
    ...context,
    taskQueue: new MemoryQueueAdapter(),
    queue: {
      nativeRetrial: true,
      enqueue: () => Promise.resolve(),
      stop: () => Promise.resolve(),
      listen: (handler, options) => {
        deliver = handler;
        ready.resolve();
        return new Promise<void>((resolve) => {
          options?.signal?.addEventListener('abort', () => resolve(), { once: true });
        });
      },
    },
  });
  const recorded: NackOptions[] = [];
  const delivery: MessageContext = {
    messageId: 'committed',
    deliveryCount: 1,
    enqueuedAt: new Date(),
    headers: {},
    ack: () => Promise.resolve(),
    nack: (options = {}) => {
      recorded.push(options);
      return Promise.resolve();
    },
  };
  const message: JobMessage = { jobId: 'raced', topic: 'jobs', triggeredBy: 'queue' };
  const started = worker.start();
  try {
    await bounded(ready.promise);
    assert(deliver);
    worker.pause();
    await deliver(message, delivery);
    const stopped = worker.stop();
    await deliver(message, delivery);
    await bounded(stopped);
    assertEquals(recorded, [{ requeue: true }, { requeue: true, preserveDeliveryCount: true }]);
    assertEquals(executions, 0);
  } finally {
    await worker.stop();
    await started;
  }
});

Deno.test('stop during initialization is bounded and prevents late listener allocation', async () => {
  await using kv = new MemoryKvAdapter();
  const context = recoveryContext(new KvWorkerIdempotencyStore({ kv }), {
    execute: () => Promise.resolve({ success: true, duration: 1 }),
  });
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  let allocated = 0;
  using _listener = stub(DenoKvAdapter.prototype, 'listen', () => {
    allocated++;
    return Promise.resolve();
  });
  const worker = new Worker({
    ...context,
    queue: new MemoryQueueAdapter(),
    taskQueue: new MemoryQueueAdapter(),
    drainTimeoutMs: 100,
    abortGracePeriodMs: 20,
    registry: {
      get: async (id) => {
        entered.resolve();
        await release.promise;
        return context.registry.get(id);
      },
    },
    queueTriggers: [{ queueName: 'late', jobId: 'late' }],
  });
  const started = worker.start();
  try {
    await entered.promise;
    await assertRejects(
      () => bounded(worker.stop(), 1_000),
      DOMException,
      'Worker drain budget elapsed.',
    );
  } finally {
    release.resolve();
    await bounded(started);
  }
  assertEquals(allocated, 0);
  assertEquals(worker.healthStatus.lifecycle, 'stopped');
  assertStrictEquals(worker.stop(), worker.stop());
  worker.resume();
  worker.pause();
  await assertRejects(() => worker.start(), Error, 'stopped Worker');
});
