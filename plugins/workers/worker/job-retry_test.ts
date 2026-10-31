import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';
import { assertEquals } from '@std/assert';
import { closeKv, DenoKvAdapter as KvStoreAdapter, getKv, isKvInitialized } from '@netscript/kv';
import { KvPollingAdapter } from '@netscript/queue/adapters/kv-polling';
import { DenoKvAdapter as NativeKvQueue } from '@netscript/queue/adapters/deno-kv';
import { RedisAdapter } from '@netscript/queue/adapters/redis';
import type { MessageQueue } from '@netscript/queue';
import type {
  JobDefinition,
  JobMessage,
  JobRunnerClock,
} from '@netscript/plugin-workers-core/runtime';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import { createWorkerPool } from './job-runner-pool.ts';
import { processWorkerJob } from './job-dispatcher.ts';
import { Worker } from './worker.ts';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import type { WorkerCompleteExecutionOptions, WorkerDispatchContext } from './worker-options.ts';

/** Advance only retry time; real transport polling and persistence keep their normal clock. */
class RetryClock implements JobRunnerClock {
  readonly delays: number[] = [];
  time = 0;
  now(): number {
    return this.time;
  }
  schedule(delay: number, callback: () => void): () => void {
    this.delays.push(delay);
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      this.time += delay;
      callback();
    });
    return () => {
      cancelled = true;
    };
  }
}

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

for (const adapter of ['kv-polling', 'deno-kv', 'redis'] as const) {
  for (const backoff of ['fixed', 'linear', 'exponential'] as const) {
    Deno.test({
      name: `${adapter}: deno job fails twice then succeeds with declared ${backoff} backoff`,
      ignore: adapter === 'redis' && !redisUrl,
      async fn() {
        await using kv = await Deno.openKv(':memory:');
        const clock = new RetryClock();
        let calls = 0;
        const job: JobDefinition = {
          id: 'retry-job',
          enabled: true,
          executionType: 'deno',
          maxRetries: 2,
          retryDelay: 7,
          metadata: { retry: { backoff, maxDelayMs: 10 } },
          handler: () =>
            ++calls < 3
              ? { success: false, error: 'temporary' }
              : { success: true, data: { calls } },
        };
        const queue = makeQueue(adapter, kv);
        const harness = await dispatchHarness(kv, job, clock);
        try {
          await consumeOnce(queue, async (message, transport) => {
            await processWorkerJob(harness.context, message, transport);
          });
          assertEquals(calls, 3);
          assertEquals(clock.delays, backoff === 'fixed' ? [7, 7] : [7, 10]);
          assertEquals(harness.completed.map((result) => result.status), ['completed']);
        } finally {
          await queue.stop();
          await harness.context.workerPool.shutdown();
        }
      },
    });
  }

  Deno.test({
    name: `${adapter}: maxRetries zero executes a failing deno job exactly once`,
    ignore: adapter === 'redis' && !redisUrl,
    async fn() {
      await using kv = await Deno.openKv(':memory:');
      const clock = new RetryClock();
      let calls = 0;
      const harness = await dispatchHarness(kv, {
        id: 'zero-retry',
        enabled: true,
        maxRetries: 0,
        handler: () => {
          calls++;
          return { success: false, error: 'permanent' };
        },
      }, clock);
      const queue = makeQueue(adapter, kv);
      try {
        await consumeOnce(
          queue,
          (message, transport) =>
            processWorkerJob(harness.context, { ...message, jobId: 'zero-retry' }, transport),
        );
        assertEquals(calls, 1);
        assertEquals(clock.delays, []);
        assertEquals(harness.completed.map((result) => result.status), ['failed']);
        assertEquals(await harness.deadLetters.depth(), 1);
      } finally {
        await queue.stop();
        await harness.context.workerPool.shutdown();
      }
    },
  });
}

Deno.test('polyglot jobs use the same bounded retry policy without nested executor retries', async () => {
  await using kv = await Deno.openKv(':memory:');
  const clock = new RetryClock();
  const harness = await dispatchHarness(kv, {
    id: 'retry-job',
    enabled: true,
    executionType: 'python',
    entrypoint: './job.py',
    maxRetries: 2,
    metadata: { retry: { backoff: 'exponential', delayMs: 3 } },
  }, clock);
  let calls = 0;
  const context: WorkerDispatchContext = {
    ...harness.context,
    taskExecutor: {
      execute: (task) => {
        assertEquals(task.maxRetries, 0);
        return Promise.resolve({ success: ++calls === 3, duration: 1 });
      },
    },
  };
  try {
    await processWorkerJob(context, { jobId: 'retry-job', topic: 'jobs', triggeredBy: 'queue' });
    assertEquals(calls, 3);
    assertEquals(clock.delays, [3, 6]);
    assertEquals(harness.completed.map((result) => result.status), ['completed']);
  } finally {
    await harness.context.workerPool.shutdown();
  }
});

Deno.test('Worker KV listener replays a job after shutdown during backoff and releases its claim', async () => {
  await using kv = await Deno.openKv(':memory:');
  const scheduled = Promise.withResolvers<void>();
  let disposed = 0;
  const clock: JobRunnerClock = {
    now: () => 0,
    schedule: () => {
      scheduled.resolve();
      return () => {
        disposed++;
      };
    },
  };
  let calls = 0;
  const job: JobDefinition = {
    id: 'retry-job',
    enabled: true,
    maxRetries: 2,
    retryDelay: 1,
    handler: () => ++calls === 1 ? { success: false, error: 'temporary' } : { success: true },
  };
  const harness = await dispatchHarness(kv, job, clock);
  const queue = makeQueue('kv-polling', kv) as KvPollingAdapter<JobMessage>;
  const options = {
    workerId: 'shutdown-replay',
    deadLetters: harness.deadLetters,
    queue,
    registry: harness.context.registry,
    taskRegistry: harness.context.taskRegistry,
    taskExecutor: harness.context.taskExecutor,
    executionState: harness.context.executionState,
    idempotency: harness.context.idempotency,
  };
  const worker = new Worker({ ...options, retryClock: clock, taskQueue: new MemoryQueueAdapter() });
  const started = worker.start();
  void started.catch(() => undefined);
  let next: Worker | undefined;
  let resumed: Promise<void> | undefined;
  try {
    await queue.enqueue({ jobId: job.id, topic: 'jobs', triggeredBy: 'queue' });
    await bounded(scheduled.promise);
    await bounded(worker.stop());
    await bounded(started);
    assertEquals((await queue.getStats()).pending, 1, 'shutdown must preserve the queued job');
    assertEquals(disposed, 1);
    assertEquals(await harness.deadLetters.depth(), 0);
    next = new Worker({
      ...options,
      retryClock: new RetryClock(),
      taskQueue: new MemoryQueueAdapter(),
    });
    resumed = next.start();
    void resumed.catch(() => undefined);
    await bounded((async () => {
      while (!harness.completed.some((result) => result.status === 'completed')) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    })());
    await bounded(next.stop());
    await bounded(resumed);
    assertEquals(calls, 2);
    assertEquals(harness.completed.map((result) => result.status), ['cancelled', 'completed']);
    assertEquals(await queue.getStats(), { pending: 0, processing: 0, dlq: 0 });
  } finally {
    await worker.stop();
    await started;
    await next?.stop();
    await resumed;
    await queue.stop();
    await harness.context.workerPool.shutdown();
  }
});

Deno.test('polyglot timeout is terminal after one attempt and records timeout without a retry wait', async () => {
  await using kv = await Deno.openKv(':memory:');
  const clock = new RetryClock();
  const harness = await dispatchHarness(kv, {
    id: 'retry-job',
    enabled: true,
    executionType: 'python',
    entrypoint: './job.py',
    maxRetries: 2,
  }, clock);
  let calls = 0;
  try {
    await processWorkerJob({
      ...harness.context,
      taskExecutor: {
        execute: () => {
          calls++;
          return Promise.resolve({
            success: false,
            status: 'timeout',
            duration: 1,
            error: 'deadline',
          });
        },
      },
    }, { jobId: 'retry-job', topic: 'jobs', triggeredBy: 'queue' });
    assertEquals(calls, 1);
    assertEquals(clock.delays, []);
    assertEquals(harness.completed.map((result) => result.status), ['timeout']);
    const records = await harness.deadLetters.list();
    assertEquals(records.length, 1);
    assertEquals(records[0].deliveryCount, 1);
    assertEquals(records[0].errorCode, 'job.timeout');
  } finally {
    await harness.context.workerPool.shutdown();
  }
});

Deno.test('direct dispatcher consumers without a DLQ field keep the canonical durable default', async () => {
  assertEquals(isKvInitialized(), false);
  const shared = await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
  await using kv = await Deno.openKv(':memory:');
  const harness = await dispatchHarness(kv, {
    id: 'retry-job',
    enabled: true,
    maxRetries: 0,
    handler: () => ({ success: false, error: 'direct consumer failure' }),
  }, new RetryClock());
  const { deadLetters: _providedStore, ...legacyContext } = harness.context;
  const directConsumer: WorkerDispatchContext = legacyContext;
  try {
    await processWorkerJob(directConsumer, {
      jobId: 'retry-job',
      topic: 'jobs',
      triggeredBy: 'queue',
    });
    const stored = new KvDeadLetterStore<JobMessage>({
      queueName: 'workers:job-dlq:jobs',
      kv: shared,
    });
    assertEquals(await stored.depth(), 1);
    assertEquals((await stored.list())[0].errorMessage, 'direct consumer failure');
  } finally {
    await harness.context.workerPool.shutdown();
    await closeKv();
  }
});

function makeQueue(kind: string, kv: Deno.Kv): MessageQueue<JobMessage> {
  const queueName = `job-retry-${crypto.randomUUID()}`;
  if (kind === 'redis') return new RedisAdapter<JobMessage>(redisUrl!, queueName);
  if (kind === 'deno-kv') return NativeKvQueue.withKv<JobMessage>(kv, queueName);
  return new KvPollingAdapter<JobMessage>({
    queueName,
    kv: new KvStoreAdapter(kv),
    pollInterval: 1,
    retryBaseDelay: 0,
  });
}

async function dispatchHarness(kv: Deno.Kv, job: JobDefinition, retryClock: JobRunnerClock) {
  const workerPool = createWorkerPool();
  await workerPool.initialize();
  const completed: WorkerCompleteExecutionOptions[] = [];
  let executions = 0;
  const deadLetters = new KvDeadLetterStore<JobMessage>({ queueName: 'job-failures', denoKv: kv });
  const context: WorkerDispatchContext = {
    workerId: 'retry-test',
    deadLetters,
    concurrency: 1,
    registry: { get: () => Promise.resolve(job) },
    taskRegistry: { get: () => Promise.resolve(undefined) },
    executionState: {
      create: () => Promise.resolve({ id: `exec-${++executions}` }),
      start: (id) => Promise.resolve({ id }),
      progress: (id) => Promise.resolve({ id }),
      complete: (id, result) => {
        completed.push(result);
        return Promise.resolve({ id });
      },
    },
    taskExecutor: { execute: () => Promise.reject(new Error('Unexpected task execution')) },
    idempotency: new KvWorkerIdempotencyStore({ kv: new KvStoreAdapter(kv) }),
    workerPool,
    retryClock,
    jobsDir: '.',
    activeJobs: new Map(),
    workerSpan: null,
  };
  return { context, completed, deadLetters };
}

async function consumeOnce(
  queue: MessageQueue<JobMessage>,
  handler: Parameters<MessageQueue<JobMessage>['listen']>[0],
): Promise<void> {
  const stop = new AbortController();
  const done = Promise.withResolvers<void>();
  const listening = queue.listen(async (message, transport) => {
    try {
      await handler(message, transport);
      done.resolve();
    } catch (error) {
      done.reject(error);
      throw error;
    } finally {
      stop.abort();
    }
  }, { signal: stop.signal });
  try {
    await queue.enqueue({ jobId: 'retry-job', topic: 'jobs', triggeredBy: 'queue' });
    await bounded(done.promise);
    await bounded(listening);
  } finally {
    stop.abort();
    await queue.stop();
  }
}

async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Queue regression timed out')), 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
