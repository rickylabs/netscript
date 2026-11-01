import { assert, assertEquals, assertFalse, assertThrows } from '@std/assert';
import { delay } from '@std/async';
import { stub } from '@std/testing/mock';
import { childHealthResponse } from '@netscript/plugin/health';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type {
  JobDefinition,
  JobMessage,
  TaskMessage,
} from '@netscript/plugin-workers-core/runtime';
import { DenoKvAdapter } from '@netscript/queue/adapters/deno-kv';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import { Worker, type WorkerOptions } from './mod.ts';

function options(kv: MemoryKvAdapter): WorkerOptions {
  return {
    workerId: 'listener-health',
    registry: { get: () => Promise.resolve(undefined) },
    executionState: {
      create: () => Promise.resolve({ id: 'unused' }),
      start: (id) => Promise.resolve({ id }),
      progress: (id) => Promise.resolve({ id }),
      complete: (id) => Promise.resolve({ id }),
    },
    taskRegistry: { get: () => Promise.resolve(undefined) },
    taskExecutor: { execute: () => Promise.resolve({ success: true, duration: 0 }) },
    idempotency: new KvWorkerIdempotencyStore({ kv }),
  };
}

for (const family of ['jobs', 'tasks', 'triggers'] as const) {
  Deno.test(`Worker ${family} listener uses the configured window and exposes a safe HTTP health cause`, async () => {
    await using kv = new MemoryKvAdapter();
    let now = 0;
    let attempts = 0;
    const running = Promise.withResolvers<void>();
    // Exercise the production default clock seam, not an internal supervisor constructor.
    using _clock = stub(performance, 'now', () => now);
    assertEquals(performance.now(), 0);
    using _log = stub(console, 'error', () => {});
    const run = async (target: typeof family, signal?: AbortSignal): Promise<void> => {
      assert(signal);
      if (target === family) {
        if (++attempts <= 4) {
          now += 100;
          throw new Error('OOM password=private-secret https://private-user:secret@private-db');
        }
        running.resolve();
      }
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true })
      );
    };
    const queue = new MemoryQueueAdapter<JobMessage>();
    const taskQueue = new MemoryQueueAdapter<TaskMessage>();
    using _jobs = stub(queue, 'listen', (_handler, opts) => run('jobs', opts?.signal));
    using _tasks = stub(taskQueue, 'listen', (_handler, opts) => run('tasks', opts?.signal));
    using _triggers = stub(
      DenoKvAdapter.prototype,
      'listen',
      (_handler, opts) => run('triggers', opts?.signal),
    );
    const definition: JobDefinition = {
      id: 'orders',
      topic: 'jobs',
      enabled: true,
      executionType: 'deno',
      entrypoint: import.meta.url,
    };
    const worker = new Worker({
      ...options(kv),
      queue,
      taskQueue,
      registry: { get: () => Promise.resolve(definition) },
      queueTriggers: [{ queueName: 'orders', jobId: 'orders' }],
      listenerMaxRestarts: 1,
      listenerHealthyResetMs: 100,
      listenerInitialBackoffMs: 0,
    });
    const started = worker.start();
    try {
      const deadline = Date.now() + 10_000;
      while (attempts < 5) {
        assert(worker.isRunning, 'Worker stopped before listener recovered.');
        assert(
          Date.now() < deadline,
          'Configured healthy interval was not forwarded to this listener.',
        );
        await delay(10);
      }
      await running.promise;
      const health = worker.healthStatus;
      const targetName = family === 'jobs'
        ? 'jobs:jobs'
        : family === 'tasks'
        ? 'task:tasks'
        : 'trigger:orders';
      const target = health.listeners.find((listener) => listener.name === targetName);
      assert(target);
      assertEquals(target.failureCause, 'store-write-refused');
      assertEquals(target.restartCount, 4);
      assertEquals(health.childHealth.restartCount, 4);
      assertEquals(
        health.childHealth.lastFatalError?.message,
        'Queue store refused a write (details redacted).',
      );
      const response = childHealthResponse(
        new Request('http://localhost/health'),
        health.childHealth,
      );
      assertEquals(response.status, 503); // The separate crash-loop window has not elapsed.
      const payload = await response.text();
      for (const secret of ['private-secret', 'https:', 'private-user', 'private-db', 'stack']) {
        assertFalse(payload.includes(secret));
      }
      now += 100;
      const recoveredBudget = worker.healthStatus;
      assertEquals(
        recoveredBudget.listeners.find((listener) => listener.name === targetName)
          ?.restartBudgetUsed,
        0,
      );
      assertEquals(recoveredBudget.childHealth.restartCount, 4);
      assertEquals(recoveredBudget.status, 'degraded');
    } finally {
      await worker.stop();
      await started;
    }
  });
}

Deno.test('Worker rejects invalid healthy windows before starting resources', async () => {
  await using kv = new MemoryKvAdapter();
  for (const listenerHealthyResetMs of [0, -1, NaN, Infinity]) {
    assertThrows(
      () => new Worker({ ...options(kv), listenerHealthyResetMs }),
      RangeError,
      'listenerHealthyResetMs must be a finite positive number.',
    );
  }
});
