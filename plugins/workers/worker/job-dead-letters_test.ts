import { assertEquals, assertInstanceOf } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';
import { KvPollingAdapter } from '@netscript/queue/adapters/kv-polling';
import type { MessageQueue } from '@netscript/queue';
import type {
  JobDefinition,
  JobMessage,
  JobRunnerClock,
  TaskMessage,
} from '@netscript/plugin-workers-core/runtime';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import { childHealthResponse } from '@netscript/plugin/health';
import { Worker } from './worker.ts';
import { type JobDeadLetterStorePort, recordJobDeadLetter } from './job-dead-letters.ts';

Deno.test('direct job failures sharing an idempotency key keep separate durable DLQ identities', async () => {
  await using kv = await Deno.openKv(':memory:');
  const store = new KvDeadLetterStore<JobMessage>({ queueName: 'identity-scope', denoKv: kv });
  for (const jobId of ['first-job', 'second-job', 'first-job']) {
    await recordJobDeadLetter(store, {
      jobId,
      topic: 'jobs',
      triggeredBy: 'manual',
      idempotencyKey: 'same-event',
    }, { queueName: 'jobs', attempts: 1, error: 'failed' });
  }
  const records = await store.list();
  assertEquals(records.map((record) => record.payload.jobId).sort(), ['first-job', 'second-job']);
});

for (const maxRetries of [0, 2]) {
  Deno.test(`KV job DLQ persists after ${maxRetries} retries before the Worker listener acknowledges`, async () => {
    await using kv = await Deno.openKv(':memory:');
    const storage = new DenoKvAdapter(kv);
    const durable = new KvDeadLetterStore<JobMessage>({ queueName: 'job-exhaustion', kv: storage });
    const writing = Promise.withResolvers<void>();
    const allowWrite = Promise.withResolvers<void>();
    const delays: number[] = [];
    let attempts = 0;
    const deadLetters = forwardingStore(durable, async (record) => {
      writing.resolve();
      await allowWrite.promise;
      await durable.append(record);
    });
    const harness = createHarness(storage, deadLetters, {
      id: 'exhausted',
      enabled: true,
      maxRetries,
      retryDelay: 4,
      metadata: { retry: { backoff: 'exponential' } },
      handler: () => {
        attempts++;
        if (maxRetries === 2) throw new Error('permanent failure');
        return { success: false, error: 'permanent failure' };
      },
    }, advancingClock(delays));
    const started = harness.worker.start();
    void started.catch(() => undefined);
    try {
      await harness.queue.enqueue({
        jobId: 'exhausted',
        topic: 'jobs',
        triggeredBy: 'queue',
        payload: { key: 'original' },
      });
      await bounded(writing.promise);
      assertEquals(attempts, maxRetries + 1);
      assertEquals(delays, maxRetries === 0 ? [] : [4, 8]);
      await new Promise((resolve) => setTimeout(resolve, 10));
      assertEquals(await durable.depth(), 0);
      assertEquals(harness.returned(), 0, 'delivery must remain open while persistence is blocked');
      assertEquals((await harness.queue.getStats()).processing, 1);
      allowWrite.resolve();
      await until(() => harness.returned() === 1);
      await until(async () => (await harness.queue.getStats()).processing === 0);
      const records = await durable.list();
      assertEquals(records.length, 1);
      assertEquals(records[0].deliveryCount, maxRetries + 1);
      assertEquals(records[0].reason, 'max_attempts_exceeded');
      assertEquals(records[0].errorMessage, 'permanent failure');
      assertEquals(records[0].payload.payload, { key: 'original' });
      assertEquals(await harness.queue.getStats(), { pending: 0, processing: 0, dlq: 0 });
      const health = await harness.worker.readHealthStatus();
      assertEquals(health.deadLetters, { available: true, depth: 1 });
      const response = childHealthResponse(new Request('http://localhost/health'), {
        ...health.childHealth,
        ...{ deadLetters: health.deadLetters },
      });
      assertEquals(response.status, 200);
      assertEquals((await response.json()).deadLetters, { available: true, depth: 1 });
      const replayed: JobMessage[] = [];
      await durable.reprocess((record) => {
        replayed.push(record.payload);
        return Promise.resolve();
      });
      assertEquals(replayed.length, 1);
      assertEquals((await harness.worker.readHealthStatus()).deadLetters?.depth, 0);
    } finally {
      allowWrite.resolve();
      await harness.worker.stop();
      await started;
    }
  });
}

Deno.test('KV Worker listener requeues after a job DLQ write outage instead of acknowledging', async () => {
  await using kv = await Deno.openKv(':memory:');
  const storage = new DenoKvAdapter(kv);
  const durable = new KvDeadLetterStore<JobMessage>({ queueName: 'job-outage', kv: storage });
  let writes = 0;
  let attempts = 0;
  const deadLetters = forwardingStore(durable, async (record) => {
    if (++writes === 1) throw new Error('DLQ temporarily unavailable');
    await durable.append(record);
  });
  const harness = createHarness(storage, deadLetters, {
    id: 'exhausted',
    enabled: true,
    maxRetries: 0,
    handler: () => {
      attempts++;
      return { success: false, error: 'permanent' };
    },
  });
  const started = harness.worker.start();
  void started.catch(() => undefined);
  try {
    await harness.queue.enqueue({ jobId: 'exhausted', topic: 'jobs', triggeredBy: 'queue' });
    await until(async () => await durable.depth() === 1 && harness.returned() === 1);
    await until(async () => (await harness.queue.getStats()).processing === 0);
    assertEquals(harness.rejected(), 1, 'non-lease queues retain rejection-based retry semantics');
    assertEquals(attempts, 2, 'released idempotency claim permits transport redelivery');
    assertEquals(writes, 2);
    assertEquals(await harness.queue.getStats(), { pending: 0, processing: 0, dlq: 0 });
  } finally {
    await harness.worker.stop();
    await started;
  }
});

Deno.test('durable job DLQ depth failures make dependency health unavailable', async () => {
  await using kv = await Deno.openKv(':memory:');
  const storage = new DenoKvAdapter(kv);
  const durable = new KvDeadLetterStore<JobMessage>({ queueName: 'job-health', kv: storage });
  const deadLetters = forwardingStore(durable);
  let unavailable = false;
  const harness = createHarness(storage, {
    ...deadLetters,
    depth: () => unavailable ? Promise.reject(new Error('storage unavailable')) : durable.depth(),
  }, { id: 'unused', enabled: true, handler: () => ({ success: true }) });
  const started = harness.worker.start();
  void started.catch(() => undefined);
  try {
    await until(() => harness.worker.healthStatus.childHealth.state === 'ready');
    assertEquals((await harness.worker.readHealthStatus()).deadLetters, {
      available: true,
      depth: 0,
    });
    unavailable = true;
    const health = await harness.worker.readHealthStatus();
    assertEquals(health.status, 'degraded');
    assertEquals(health.deadLetters, { available: false, depth: null });
    assertEquals(
      childHealthResponse(new Request('http://localhost/health'), health.childHealth).status,
      503,
    );
  } finally {
    await harness.worker.stop();
    await started;
  }
});

Deno.test('Worker defaults its job dead-letter port to the canonical KV store', async () => {
  await using kv = await Deno.openKv(':memory:');
  const harness = createHarness(new DenoKvAdapter(kv), undefined, { id: 'unused', enabled: true });
  assertInstanceOf(harness.worker.deadLetters, KvDeadLetterStore);
  await harness.worker.stop();
});

Deno.test('explicit Worker cancellation acknowledges without poisoning the job DLQ', async () => {
  await using kv = await Deno.openKv(':memory:');
  const storage = new DenoKvAdapter(kv);
  const durable = new KvDeadLetterStore<JobMessage>({ queueName: 'job-cancel', kv: storage });
  const harness = createHarness(storage, durable, {
    id: 'exhausted',
    enabled: true,
    maxRetries: 2,
    handler: async (context) => {
      await new Promise<void>((resolve) =>
        context.signal.addEventListener('abort', () => resolve(), { once: true })
      );
      return { success: true };
    },
  });
  const started = harness.worker.start();
  void started.catch(() => undefined);
  try {
    await harness.queue.enqueue({ jobId: 'exhausted', topic: 'jobs', triggeredBy: 'queue' });
    await until(() => harness.worker.activeJobCount === 1);
    assertEquals(harness.worker.cancel('exec-1'), true);
    await until(() => harness.returned() === 1);
    await until(async () => (await harness.queue.getStats()).processing === 0);
    assertEquals(await durable.depth(), 0);
    assertEquals(harness.rejected(), 0);
  } finally {
    await harness.worker.stop();
    await started;
  }
});

Deno.test('disabled jobs are durably unroutable with zero handler attempts before acknowledgment', async () => {
  await using kv = await Deno.openKv(':memory:');
  const storage = new DenoKvAdapter(kv);
  const durable = new KvDeadLetterStore<JobMessage>({ queueName: 'job-disabled', kv: storage });
  const harness = createHarness(storage, durable, {
    id: 'disabled',
    enabled: false,
    maxRetries: 2,
  });
  const started = harness.worker.start();
  void started.catch(() => undefined);
  try {
    await harness.queue.enqueue({ jobId: 'disabled', topic: 'jobs', triggeredBy: 'queue' });
    await until(() => harness.returned() === 1);
    const records = await durable.list();
    assertEquals(records.length, 1);
    assertEquals(records[0].deliveryCount, 0);
    assertEquals(records[0].reason, 'unroutable');
  } finally {
    await harness.worker.stop();
    await started;
  }
});

function forwardingStore(
  store: JobDeadLetterStorePort,
  append: JobDeadLetterStorePort['append'] = (record) => store.append(record),
): JobDeadLetterStorePort {
  return {
    append,
    list: (options) => store.list(options),
    reprocess: (reenqueue, options) => store.reprocess(reenqueue, options),
    depth: () => store.depth(),
  };
}

function advancingClock(delays: number[]): JobRunnerClock {
  return {
    now: () => 0,
    schedule: (delay, callback) => {
      delays.push(delay);
      let active = true;
      queueMicrotask(() => {
        if (active) callback();
      });
      return () => {
        active = false;
      };
    },
  };
}

function createHarness(
  kv: DenoKvAdapter,
  deadLetters: JobDeadLetterStorePort | undefined,
  job: JobDefinition,
  retryClock?: JobRunnerClock,
) {
  const queue = new KvPollingAdapter<JobMessage>({
    queueName: `job-dlq-${crypto.randomUUID()}`,
    kv,
    pollInterval: 1,
    retryBaseDelay: 0,
  });
  let returned = 0;
  let rejected = 0;
  const observed: MessageQueue<JobMessage> = {
    nativeRetrial: queue.nativeRetrial,
    enqueue: (message, options) => queue.enqueue(message, options),
    stop: () => queue.stop(),
    listen: (handler, options) =>
      queue.listen(async (message, context) => {
        try {
          await handler(message, context);
          returned++;
        } catch (error) {
          rejected++;
          throw error;
        }
      }, options),
  };
  let execution = 0;
  const worker = new Worker({
    workerId: 'job-dlq-test',
    queue: observed,
    deadLetters,
    retryClock,
    taskQueue: new KvPollingAdapter<TaskMessage>({
      queueName: `tasks-${crypto.randomUUID()}`,
      kv,
      pollInterval: 1,
    }),
    registry: { get: () => Promise.resolve(job) },
    taskRegistry: { get: () => Promise.resolve(undefined) },
    taskExecutor: { execute: () => Promise.reject(new Error('unused')) },
    idempotency: new KvWorkerIdempotencyStore({ kv }),
    executionState: {
      create: () => Promise.resolve({ id: `exec-${++execution}` }),
      start: (id) => Promise.resolve({ id }),
      progress: (id) => Promise.resolve({ id }),
      complete: (id) => Promise.resolve({ id }),
    },
  });
  return { worker, queue, returned: () => returned, rejected: () => rejected };
}

async function until(condition: () => boolean | Promise<boolean>): Promise<void> {
  const deadline = Date.now() + 5000;
  while (!await condition()) {
    if (Date.now() >= deadline) throw new Error('DLQ condition did not hold before deadline');
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
}

async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('DLQ regression timed out')), 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
