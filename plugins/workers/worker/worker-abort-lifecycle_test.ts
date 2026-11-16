import { assert, assertEquals, assertInstanceOf, assertStrictEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type {
  JobContext,
  JobDefinition,
  JobMessage,
  TaskMessage,
} from '@netscript/plugin-workers-core/runtime';
import type { WorkerCompleteExecutionOptions, WorkerExecutionState } from './worker-options.ts';
import { Worker } from './worker.ts';

async function bounded<T>(promise: Promise<T>, timeoutMs = 2_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Lifecycle did not settle.')), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

for (const cause of ['timeout', 'cancel', 'shutdown'] as const) {
  Deno.test(`Worker queue-to-Deno handler aborts on ${cause} and records the terminal cause`, async () => {
    await using kv = new MemoryKvAdapter();
    const queue = new MemoryQueueAdapter<JobMessage>({ pollInterval: 1 });
    const taskQueue = new MemoryQueueAdapter<TaskMessage>({ pollInterval: 1 });
    const idempotency = new KvWorkerIdempotencyStore({ kv });
    const ready = Promise.withResolvers<JobContext>();
    const finish = Promise.withResolvers<void>();
    const terminal = Promise.withResolvers<WorkerCompleteExecutionOptions>();
    const completed: WorkerCompleteExecutionOptions[] = [];
    const executionState: WorkerExecutionState = {
      create: () => Promise.resolve({ id: 'execution-1' }),
      start: () => Promise.resolve({ id: 'execution-1' }),
      progress: () => Promise.resolve({ id: 'execution-1' }),
      complete: (_id, options) => {
        completed.push(options);
        terminal.resolve(options);
        return Promise.resolve({ id: 'execution-1' });
      },
    };
    const job: JobDefinition = {
      id: `lifecycle-${cause}`,
      enabled: true,
      topic: 'jobs',
      executionType: 'deno',
      entrypoint: import.meta.url,
      timeout: cause === 'timeout' ? 100 : 10_000,
      handler: async (context) => {
        ready.resolve(context);
        await Promise.race([
          new Promise<void>((resolve) => {
            if (context.signal.aborted) resolve();
            else context.signal.addEventListener('abort', () => resolve(), { once: true });
          }),
          finish.promise,
        ]);
        return { success: true };
      },
    };
    const worker = new Worker({
      workerId: 'cancellation-lifecycle',
      queue,
      taskQueue,
      registry: { get: () => Promise.resolve(job) },
      executionState,
      taskRegistry: { get: () => Promise.resolve(undefined) },
      taskExecutor: { execute: () => Promise.reject(new Error('Task path must not run.')) },
      idempotency,
      drainTimeoutMs: 200,
      workerPoolOptions: { abortGracePeriodMs: 5 },
    });
    const started = worker.start();
    void started.catch(() => undefined);
    const claimInput = { concept: 'job' as const, targetId: job.id, idempotencyKey: 'delivery-1' };
    try {
      await queue.enqueue({
        jobId: job.id,
        topic: 'jobs',
        triggeredBy: 'manual',
        idempotencyKey: 'delivery-1',
      });
      const context = await bounded(ready.promise);
      assertInstanceOf(context.signal, AbortSignal);
      assert(typeof context.deadlineAt === 'number');
      assertEquals(worker.activeJobCount, 1);
      assertEquals(worker.cancel('absent'), false);
      let stopped: Promise<void> | undefined;
      if (cause === 'cancel') {
        assertEquals(worker.cancel('execution-1'), true);
        assertEquals(worker.cancel('execution-1'), false);
        assert(context.signal.aborted);
      } else if (cause === 'shutdown') {
        stopped = worker.stop();
        assertEquals(worker.stop(), stopped);
        assertEquals(context.signal.aborted, false);
      }
      const result = await bounded(terminal.promise);
      assert(context.signal.aborted);
      assertInstanceOf(context.signal.reason, DOMException);
      assertEquals(
        context.signal.reason.name,
        cause === 'timeout'
          ? 'TimeoutError'
          : cause === 'shutdown'
          ? 'ShutdownError'
          : 'AbortError',
      );
      assertEquals(result.status, cause === 'timeout' ? 'timeout' : 'cancelled');
      await bounded(stopped ?? worker.stop());
      await bounded(started);
      assertEquals(worker.activeJobCount, 0);
      assertEquals(worker.isRunning, false);
      assertEquals(completed.length, 1);
      const retry = await idempotency.claim(claimInput);
      assertEquals(retry.claimed, true);
      assertEquals(retry.alreadyApplied, false);
      await idempotency.release(retry.key);
    } finally {
      finish.resolve();
      await bounded(worker.stop());
      await bounded(started);
    }
  });
}

async function verifyBlockedProgressWorker(
  cause: 'timeout' | 'cancel' | 'shutdown',
  reentrant = false,
): Promise<void> {
  await using kv = new MemoryKvAdapter();
  const queue = new MemoryQueueAdapter<JobMessage>({ pollInterval: 1 });
  const taskQueue = new MemoryQueueAdapter<TaskMessage>({ pollInterval: 1 });
  let queueStops = 0;
  let taskStops = 0;
  const stopQueue = queue.stop.bind(queue);
  const stopTasks = taskQueue.stop.bind(taskQueue);
  queue.stop = async () => {
    queueStops++;
    await stopQueue();
  };
  taskQueue.stop = async () => {
    taskStops++;
    await stopTasks();
  };
  const idempotency = new KvWorkerIdempotencyStore({ kv });
  const ready = Promise.withResolvers<JobContext>();
  const sinkEntered = Promise.withResolvers<void>();
  const finishProgress = Promise.withResolvers<void>();
  const terminal = Promise.withResolvers<WorkerCompleteExecutionOptions>();
  const completed: WorkerCompleteExecutionOptions[] = [];
  const executionState: WorkerExecutionState = {
    create: () => Promise.resolve({ id: 'execution-1' }),
    start: () => Promise.resolve({ id: 'execution-1' }),
    progress: async () => {
      sinkEntered.resolve();
      await finishProgress.promise;
      return { id: 'execution-1' };
    },
    complete: (_id, options) => {
      completed.push(options);
      terminal.resolve(options);
      return Promise.resolve({ id: 'execution-1' });
    },
  };
  const job: JobDefinition = {
    id: `progress-drain-${cause}`,
    enabled: true,
    topic: 'jobs',
    executionType: 'deno',
    entrypoint: import.meta.url,
    timeout: cause === 'timeout' ? 500 : 10000,
    handler: (context) => {
      ready.resolve(context);
      void context.reportProgress?.(10);
      return { success: true };
    },
  };
  const worker = new Worker({
    workerId: 'progress-drain-lifecycle',
    queue,
    taskQueue,
    registry: { get: () => Promise.resolve(job) },
    executionState,
    taskRegistry: { get: () => Promise.resolve(undefined) },
    taskExecutor: { execute: () => Promise.reject(new Error('Task path must not run.')) },
    idempotency,
    drainTimeoutMs: 200,
    workerPoolOptions: { abortGracePeriodMs: 5 },
  });
  const started = worker.start();
  void started.catch(() => undefined);
  const claimInput = {
    concept: 'job' as const,
    targetId: job.id,
    idempotencyKey: 'progress-delivery',
  };
  const settleStop = async (completion: Promise<void>) => {
    try {
      await bounded(completion);
    } catch (error) {
      // A sink held beyond cleanup may exhaust the stop budget; it must remain bounded.
      assertEquals(cause, 'shutdown');
      assertInstanceOf(error, DOMException);
      assertEquals(error.name, 'TimeoutError');
    }
  };
  let nestedStop: Promise<void> | undefined;
  try {
    await queue.enqueue({
      jobId: job.id,
      topic: 'jobs',
      triggeredBy: 'manual',
      idempotencyKey: 'progress-delivery',
    });
    const context = await bounded(ready.promise);
    await bounded(sinkEntered.promise);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (reentrant) {
      context.signal.addEventListener('abort', () => {
        nestedStop = worker.stop();
      }, { once: true });
    }
    let stopped: Promise<void> | undefined;
    if (cause === 'cancel') {
      assertEquals(worker.cancel('execution-1'), true);
      assertEquals(context.signal.aborted, true);
    } else if (cause === 'shutdown') {
      stopped = worker.stop();
      assertEquals(worker.stop(), stopped);
    }
    const result = await bounded(terminal.promise);
    if (reentrant) assertStrictEquals(nestedStop, stopped);
    assertEquals(context.signal.aborted, true);
    assertInstanceOf(context.signal.reason, DOMException);
    assertEquals(
      context.signal.reason.name,
      cause === 'cancel' ? 'AbortError' : cause === 'timeout' ? 'TimeoutError' : 'ShutdownError',
    );
    assertEquals(result.status, cause === 'timeout' ? 'timeout' : 'cancelled');
    // Neither stop nor claim release waits indefinitely on the still-blocked sink.
    await settleStop(stopped ?? worker.stop());
    await settleStop(started);
    assertEquals(worker.activeJobCount, 0);
    assertEquals(worker.isRunning, false);
    assertEquals(completed.length, 1);
    assertEquals(queueStops, 1);
    assertEquals(taskStops, 1);
    const retry = await idempotency.claim(claimInput);
    assertEquals(retry.claimed, true);
    assertEquals(retry.alreadyApplied, false);
    await idempotency.release(retry.key);
  } finally {
    finishProgress.resolve();
    await settleStop(worker.stop());
    if (nestedStop) await settleStop(nestedStop);
    await settleStop(started);
  }
}

for (const cause of ['timeout', 'cancel', 'shutdown'] as const) {
  Deno.test(`Worker cancellation during unawaited progress drain retains ${cause} ownership`, () =>
    verifyBlockedProgressWorker(cause));
}
Deno.test('Worker reentrant stop from abort listener shares completion and cleanup', () =>
  verifyBlockedProgressWorker('shutdown', true));
