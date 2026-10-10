import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertRejects,
  assertStrictEquals,
} from 'jsr:@std/assert@^1';
import { MemoryKvAdapter } from '@netscript/kv';
import type {
  JobContext,
  JobDefinition,
  JobMessage,
  JobResult,
  TaskDefinition,
  TaskExecutionOptions,
  TaskMessage,
} from '@netscript/plugin-workers-core/runtime';
import type { MessageContext } from '@netscript/queue';
import { processWorkerJob, processWorkerTask } from './job-dispatcher.ts';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import { Worker } from './worker.ts';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type {
  WorkerCompleteExecutionOptions,
  WorkerCreateExecutionOptions,
  WorkerDispatchContext,
  WorkerExecutionRecord,
  WorkerExecutionState,
  WorkerJobRegistry,
  WorkerTaskExecutor,
  WorkerTaskRegistry,
  WorkerTaskResult,
} from './worker-options.ts';
import { createWorkerPool, type WorkerPool } from './job-runner-pool.ts';
import { context as otelContext, propagation } from 'npm:@opentelemetry/api@^1.9.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.5.0';
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import { getParentContextFromHeaders } from '@netscript/telemetry/context';

const MESSAGE_TRACE_ID = '0af7651916cd43dd8448eb211c80319c';
const MESSAGE_TRACEPARENT = `00-${MESSAGE_TRACE_ID}-b7ad6b7169203331-01`;
const MESSAGE_TRACESTATE = 'vendor=message';
const ACTIVE_TRACE_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const ACTIVE_TRACEPARENT = `00-${ACTIVE_TRACE_ID}-bbbbbbbbbbbbbbbb-01`;

Deno.test('processWorkerJob skips completed duplicate redelivery without creating a second execution', async () => {
  await using kv = new MemoryKvAdapter();
  const executionState = new MemoryExecutionState();
  const taskExecutor = new CountingTaskExecutor([
    { success: true, duration: 1, result: { ok: true } },
  ]);
  const context = dispatchContext({
    kv,
    executionState,
    taskExecutor,
    job: polyglotJob('send-email'),
  });
  const message: JobMessage = {
    jobId: 'send-email',
    topic: 'jobs',
    triggeredBy: 'manual',
    payload: { email: 'a@example.com' },
  };
  const queueContext = messageContext('msg-1');

  await processWorkerJob(context, message, queueContext);
  await processWorkerJob(context, message, queueContext);

  assertEquals(taskExecutor.calls, 1);
  assertEquals(executionState.created.length, 1);
  assertEquals(executionState.completed.map((entry) => entry.options.status), ['completed']);
});

Deno.test('processWorkerJob releases a failed claim so redelivery can re-run', async () => {
  await using kv = new MemoryKvAdapter();
  const executionState = new MemoryExecutionState();
  const taskExecutor = new CountingTaskExecutor([
    new Error('transient worker failure'),
    { success: true, duration: 1, result: { ok: true } },
  ]);
  const context = dispatchContext({
    kv,
    executionState,
    taskExecutor,
    job: polyglotJob('sync-account'),
  });
  const message: JobMessage = {
    jobId: 'sync-account',
    topic: 'jobs',
    triggeredBy: 'manual',
    idempotencyKey: 'evt-sync-1',
    payload: { accountId: 'acct_1' },
  };

  await processWorkerJob(context, message, messageContext('msg-2'));
  await processWorkerJob(context, message, messageContext('msg-2'));

  assertEquals(taskExecutor.calls, 2);
  assertEquals(executionState.created.length, 2);
  assertEquals(executionState.completed.map((entry) => entry.options.status), [
    'failed',
    'completed',
  ]);
});

Deno.test('processWorkerTask skips duplicate redelivery after applied marker', async () => {
  await using kv = new MemoryKvAdapter();
  const executionState = new MemoryExecutionState();
  const taskExecutor = new CountingTaskExecutor([
    { success: true, duration: 1, result: { ok: true } },
  ]);
  const context = dispatchContext({
    kv,
    executionState,
    taskExecutor,
    task: taskDefinition('resize-image'),
  });
  const message: TaskMessage = {
    taskId: 'resize-image',
    topic: 'tasks',
    triggeredBy: 'manual',
    payload: { imageId: 'img_1' },
  };
  const queueContext = messageContext('task-msg-1');

  await processWorkerTask(context, message, queueContext);
  await processWorkerTask(context, message, queueContext);

  assertEquals(taskExecutor.calls, 1);
  assertEquals(executionState.created.length, 1);
});

Deno.test('processWorkerJob routes the durable execution id into progress before completion', async () => {
  await using kv = new MemoryKvAdapter();
  const executionState = new MemoryExecutionState();
  const job: JobDefinition = {
    id: 'report-progress',
    topic: 'jobs',
    enabled: true,
    executionType: 'deno',
    entrypoint: import.meta.url,
    handler: (context) => {
      void context.reportProgress?.(15, 'starting');
      void context.reportProgress?.(15, 'still starting');
      void context.reportProgress?.(10, 'recalibrated');
      return { success: true, data: { ok: true } };
    },
  };
  const workerPool = createWorkerPool();
  await workerPool.initialize();
  const context = dispatchContext({
    kv,
    executionState,
    taskExecutor: new CountingTaskExecutor([]),
    job,
    workerPool,
  });

  await processWorkerJob(context, {
    jobId: job.id,
    topic: 'jobs',
    triggeredBy: 'manual',
  });

  assertEquals(executionState.progressed, [
    { executionId: 'exec-1', percent: 15, message: 'starting' },
    { executionId: 'exec-1', percent: 15, message: 'still starting' },
    { executionId: 'exec-1', percent: 10, message: 'recalibrated' },
  ]);
  assertEquals(executionState.events, [
    'start:exec-1',
    'progress:15',
    'progress:15',
    'progress:10',
    'complete:completed',
  ]);
  await workerPool.shutdown();
});

Deno.test('processWorkerJob records failure when progress persistence rejects', async () => {
  await using kv = new MemoryKvAdapter();
  const executionState = new MemoryExecutionState(new Error('progress persistence failed'));
  const job: JobDefinition = {
    id: 'reject-progress',
    topic: 'jobs',
    enabled: true,
    executionType: 'deno',
    entrypoint: import.meta.url,
    handler: (context) => {
      void context.reportProgress?.(25, 'will fail');
      return { success: true };
    },
  };
  const workerPool = createWorkerPool();
  await workerPool.initialize();
  const context = dispatchContext({
    kv,
    executionState,
    taskExecutor: new CountingTaskExecutor([]),
    job,
    workerPool,
  });

  await processWorkerJob(context, {
    jobId: job.id,
    topic: 'jobs',
    triggeredBy: 'manual',
  });

  assertEquals(executionState.completed, [{
    executionId: 'exec-1',
    options: {
      status: 'failed',
      exitCode: 1,
      error: 'progress persistence failed',
    },
  }]);
  await workerPool.shutdown();
});

Deno.test('WorkerPool preserves every progress call in FIFO order and drains before completion', async () => {
  const pool = createWorkerPool();
  await pool.initialize();
  const first = Promise.withResolvers<void>();
  const second = Promise.withResolvers<void>();
  const third = Promise.withResolvers<void>();
  const gates = [first, second, third];
  const persisted: { executionId: string; percent: number; message?: string }[] = [];
  let sinkCall = 0;
  let settled = false;
  const executionId = 'durable-execution-42';
  const job = inlineJob('fifo-progress', (context) => {
    void context.reportProgress?.(40, 'first');
    void context.reportProgress?.(40, 'equal');
    void context.reportProgress?.(20, 'decreasing');
    return { success: true, data: { ok: true } };
  });

  const resultPromise = pool.executeJob(
    jobMessage(job.id),
    job,
    executionId,
    async (percent, text) => {
      persisted.push({ executionId, percent, message: text });
      const gate = gates[sinkCall++];
      await gate.promise;
    },
  );
  void resultPromise.finally(() => {
    settled = true;
  });

  await until(() => persisted.length === 1);
  assertEquals(settled, false);
  first.resolve();
  await until(() => persisted.length === 2);
  assertEquals(settled, false);
  second.resolve();
  await until(() => persisted.length === 3);
  assertEquals(settled, false);
  third.resolve();

  assertEquals(await resultPromise, { success: true, data: { ok: true } });
  assertEquals(persisted, [
    { executionId, percent: 40, message: 'first' },
    { executionId, percent: 40, message: 'equal' },
    { executionId, percent: 20, message: 'decreasing' },
  ]);
  await pool.shutdown();
});

Deno.test('WorkerPool surfaces an unawaited progress sink rejection', async () => {
  const pool = createWorkerPool();
  await pool.initialize();
  const job = inlineJob('reject-pool-progress', (context) => {
    void context.reportProgress?.(25, 'persist me');
    return { success: true };
  });

  await assertRejects(
    () =>
      pool.executeJob(
        jobMessage(job.id),
        job,
        'durable-reject',
        () => Promise.reject(new Error('progress persistence failed')),
      ),
    Error,
    'progress persistence failed',
  );
  await pool.shutdown();
});

Deno.test('WorkerPool keeps concurrent execution progress on separate sinks', async () => {
  const pool = createWorkerPool();
  await pool.initialize();
  const job = inlineJob('concurrent-progress', async (context) => {
    const value = (context.payload as { value: number }).value;
    await context.reportProgress?.(value, `value:${value}`);
    return { success: true, data: value };
  });
  const first: number[] = [];
  const second: number[] = [];

  const [firstResult, secondResult] = await Promise.all([
    pool.executeJob(jobMessage(job.id, { value: 11 }), job, 'execution-a', (percent) => {
      first.push(percent);
      return Promise.resolve();
    }),
    pool.executeJob(jobMessage(job.id, { value: 22 }), job, 'execution-b', (percent) => {
      second.push(percent);
      return Promise.resolve();
    }),
  ]);

  assertEquals(first, [11]);
  assertEquals(second, [22]);
  assertEquals(firstResult, { success: true, data: 11 });
  assertEquals(secondResult, { success: true, data: 22 });
  await pool.shutdown();
});

Deno.test('WorkerPool preserves success and failure results when handlers report no progress', async () => {
  const pool = createWorkerPool();
  await pool.initialize();
  const success = inlineJob('no-progress-success', () => ({ success: true }));
  const failure = inlineJob('no-progress-failure', () => ({
    success: false,
    error: 'handler failed',
    data: { retryable: false },
  }));
  const unexpectedProgress = (): Promise<void> =>
    Promise.reject(
      new Error('progress sink must not run'),
    );

  assertEquals(
    await pool.executeJob(jobMessage(success.id), success, 'execution-success', unexpectedProgress),
    { success: true },
  );
  assertEquals(
    await pool.executeJob(jobMessage(failure.id), failure, 'execution-failure', unexpectedProgress),
    { success: false, error: 'handler failed', data: { retryable: false } },
  );
  await pool.shutdown();
});

function inlineJob(
  id: string,
  handler: (context: JobContext<unknown, unknown>) => JobResult | Promise<JobResult>,
): JobDefinition {
  return {
    id,
    enabled: true,
    executionType: 'deno',
    handler,
  };
}

function jobMessage(jobId: string, payload?: Record<string, unknown>): JobMessage {
  return {
    jobId,
    topic: 'jobs',
    triggeredBy: 'manual',
    payload,
  };
}

async function until(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (condition()) return;
    await Promise.resolve();
  }
  throw new Error('Condition did not become true before the microtask limit.');
}

function dispatchContext(
  options: Readonly<{
    kv: MemoryKvAdapter;
    executionState: MemoryExecutionState;
    taskExecutor: CountingTaskExecutor;
    job?: JobDefinition;
    task?: TaskDefinition;
    workerPool?: WorkerPool;
  }>,
): WorkerDispatchContext {
  return {
    workerId: 'worker-test',
    registry: new SingleJobRegistry(options.job),
    executionState: options.executionState,
    taskExecutor: options.taskExecutor,
    taskRegistry: new SingleTaskRegistry(options.task),
    idempotency: new KvWorkerIdempotencyStore({ kv: options.kv }),
    workerPool: options.workerPool ?? ({} as never),
    jobsDir: '.',
    activeJobs: new Map(),
    workerSpan: null,
  };
}

function polyglotJob(id: string): JobDefinition {
  return {
    id,
    topic: 'jobs',
    enabled: true,
    executionType: 'python',
    entrypoint: './job.py',
  };
}

function taskDefinition(id: string): TaskDefinition {
  return {
    id,
    topic: 'tasks',
    enabled: true,
    type: 'deno',
    entrypoint: './task.ts',
  };
}

function messageContext(messageId: string): MessageContext {
  return {
    messageId,
    deliveryCount: 1,
    enqueuedAt: new Date('2026-06-20T00:00:00.000Z'),
    headers: {},
    ack: () => Promise.resolve(),
    nack: () => Promise.resolve(),
  };
}

class SingleJobRegistry implements WorkerJobRegistry {
  constructor(private readonly job?: JobDefinition) {}

  get(jobId: string): Promise<JobDefinition | undefined> {
    return Promise.resolve(this.job?.id === jobId ? this.job : undefined);
  }
}

class SingleTaskRegistry implements WorkerTaskRegistry {
  constructor(private readonly task?: TaskDefinition) {}

  get(taskId: string): Promise<TaskDefinition | undefined> {
    return Promise.resolve(this.task?.id === taskId ? this.task : undefined);
  }
}

class MemoryExecutionState implements WorkerExecutionState {
  readonly created: WorkerCreateExecutionOptions[] = [];
  readonly completed: { executionId: string; options: WorkerCompleteExecutionOptions }[] = [];
  readonly progressed: { executionId: string; percent: number; message?: string }[] = [];
  readonly events: string[] = [];
  #next = 0;

  constructor(private readonly progressError?: Error) {}

  create(options: WorkerCreateExecutionOptions): Promise<WorkerExecutionRecord> {
    this.created.push(options);
    this.#next += 1;
    return Promise.resolve({ id: `exec-${this.#next}` });
  }

  start(executionId: string): Promise<WorkerExecutionRecord | null> {
    this.events.push(`start:${executionId}`);
    return Promise.resolve({ id: executionId });
  }

  progress(
    executionId: string,
    percent: number,
    message?: string,
  ): Promise<WorkerExecutionRecord | null> {
    if (this.progressError) return Promise.reject(this.progressError);
    this.progressed.push({ executionId, percent, message });
    this.events.push(`progress:${percent}`);
    return Promise.resolve({ id: executionId });
  }

  complete(
    executionId: string,
    options: WorkerCompleteExecutionOptions,
  ): Promise<WorkerExecutionRecord | null> {
    this.completed.push({ executionId, options });
    this.events.push(`complete:${options.status}`);
    return Promise.resolve({ id: executionId });
  }
}

class CountingTaskExecutor implements WorkerTaskExecutor {
  calls = 0;
  readonly options: TaskExecutionOptions[] = [];

  constructor(private readonly results: (WorkerTaskResult | Error)[]) {}

  execute(_task: TaskDefinition, options: TaskExecutionOptions): Promise<WorkerTaskResult> {
    const result = this.results[this.calls] ?? { success: true, duration: 1 };
    this.calls += 1;
    this.options.push(options);
    if (result instanceof Error) {
      return Promise.reject(result);
    }
    return Promise.resolve(result);
  }
}

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
        assert(context.signal.aborted);
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
    workerPoolOptions: { abortGracePeriodMs: 5 },
  });
  const started = worker.start();
  void started.catch(() => undefined);
  const claimInput = {
    concept: 'job' as const,
    targetId: job.id,
    idempotencyKey: 'progress-delivery',
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
      if (reentrant) assertStrictEquals(nestedStop, stopped);
    }
    const result = await bounded(terminal.promise);
    assertEquals(context.signal.aborted, true);
    assertInstanceOf(context.signal.reason, DOMException);
    assertEquals(
      context.signal.reason.name,
      cause === 'cancel' ? 'AbortError' : cause === 'timeout' ? 'TimeoutError' : 'ShutdownError',
    );
    assertEquals(result.status, cause === 'timeout' ? 'timeout' : 'cancelled');
    // Neither stop nor claim release waits indefinitely on the still-blocked sink.
    await bounded(stopped ?? worker.stop());
    await bounded(started);
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
    await bounded(worker.stop());
    if (nestedStop) await bounded(nestedStop);
    await bounded(started);
  }
}

for (const cause of ['timeout', 'cancel', 'shutdown'] as const) {
  Deno.test(`Worker cancellation during unawaited progress drain retains ${cause} ownership`, () =>
    verifyBlockedProgressWorker(cause));
}
Deno.test('Worker reentrant stop from abort listener shares completion and cleanup', () =>
  verifyBlockedProgressWorker('shutdown', true));

Deno.test('processWorkerTask forwards correlation and message trace context into executor options', async () => {
  await using kv = new MemoryKvAdapter();
  const executionState = new MemoryExecutionState();
  const taskExecutor = new CountingTaskExecutor([{ success: true, duration: 1 }]);
  const context = dispatchContext({
    kv,
    executionState,
    taskExecutor,
    task: taskDefinition('traced-task'),
  });

  await processWorkerTask(context, {
    taskId: 'traced-task',
    topic: 'tasks',
    triggeredBy: 'manual',
    correlationId: 'corr-task-1',
    traceparent: MESSAGE_TRACEPARENT,
    tracestate: MESSAGE_TRACESTATE,
  }, messageContext('task-trace-1'));

  assertEquals(taskExecutor.options.length, 1);
  const options = taskExecutor.options[0]!;
  assertEquals(options.correlationId, 'corr-task-1');
  assertEquals(options.traceparent, MESSAGE_TRACEPARENT);
  assertEquals(options.tracestate, MESSAGE_TRACESTATE);
  assertEquals(executionState.created[0]?.correlationId, 'corr-task-1');
  assertEquals(executionState.created[0]?.traceparent, MESSAGE_TRACEPARENT);
  assertEquals(executionState.created[0]?.tracestate, MESSAGE_TRACESTATE);
});

Deno.test('processWorkerTask prefers the active span context over the message traceparent', async () => {
  const restore = installTracePropagation();
  try {
    await using kv = new MemoryKvAdapter();
    const taskExecutor = new CountingTaskExecutor([{ success: true, duration: 1 }]);
    const context = dispatchContext({
      kv,
      executionState: new MemoryExecutionState(),
      taskExecutor,
      task: taskDefinition('span-task'),
    });

    await otelContext.with(
      getParentContextFromHeaders({ traceparent: ACTIVE_TRACEPARENT }),
      () =>
        processWorkerTask(context, {
          taskId: 'span-task',
          topic: 'tasks',
          triggeredBy: 'manual',
          correlationId: 'corr-span-1',
          traceparent: MESSAGE_TRACEPARENT,
          tracestate: MESSAGE_TRACESTATE,
        }, messageContext('task-span-1')),
    );

    const options = taskExecutor.options[0]!;
    assertEquals(options.correlationId, 'corr-span-1');
    assertEquals(options.traceparent, ACTIVE_TRACEPARENT);
    assertEquals(options.tracestate, undefined);
  } finally {
    restore();
  }
});

Deno.test('processWorkerJob forwards the correlation id to the polyglot subprocess executor', async () => {
  await using kv = new MemoryKvAdapter();
  const taskExecutor = new CountingTaskExecutor([{ success: true, duration: 1 }]);
  const context = dispatchContext({
    kv,
    executionState: new MemoryExecutionState(),
    taskExecutor,
    job: polyglotJob('traced-polyglot-job'),
  });

  await processWorkerJob(context, {
    jobId: 'traced-polyglot-job',
    topic: 'jobs',
    triggeredBy: 'manual',
    correlationId: 'corr-job-1',
    traceparent: MESSAGE_TRACEPARENT,
  }, messageContext('job-trace-1'));

  assertEquals(taskExecutor.options.length, 1);
  const options = taskExecutor.options[0]!;
  assertEquals(options.correlationId, 'corr-job-1');
  assert(String(options.traceparent).includes(MESSAGE_TRACE_ID));
});

Deno.test({
  name: 'Worker task queue delivers CORRELATION_ID and TRACEPARENT into a real task subprocess env',
  fn: async () => {
    await using kv = new MemoryKvAdapter();
    const scriptDir = await Deno.makeTempDir({ prefix: 'workers-task-env-' });
    const entrypoint = `${scriptDir}/echo-trace-env.ts`;
    await Deno.writeTextFile(
      entrypoint,
      `console.log(JSON.stringify({
  taskId: Deno.env.get('TASK_ID') ?? null,
  correlationId: Deno.env.get('CORRELATION_ID') ?? null,
  traceparent: Deno.env.get('TRACEPARENT') ?? null,
  tracestate: Deno.env.get('TRACESTATE') ?? null,
}));
`,
    );
    const task: TaskDefinition = {
      id: 'echo-trace-env',
      topic: 'tasks',
      enabled: true,
      type: 'deno',
      entrypoint,
      cwd: scriptDir,
      timeout: 60_000,
      permissions: { env: true },
    };
    const terminal = Promise.withResolvers<WorkerCompleteExecutionOptions>();
    const executionState: WorkerExecutionState = {
      create: () => Promise.resolve({ id: 'task-execution-1' }),
      start: () => Promise.resolve({ id: 'task-execution-1' }),
      progress: () => Promise.resolve({ id: 'task-execution-1' }),
      complete: (_id, options) => {
        terminal.resolve(options);
        return Promise.resolve({ id: 'task-execution-1' });
      },
    };
    const taskQueue = new MemoryQueueAdapter<TaskMessage>({ pollInterval: 1 });
    const worker = new Worker({
      workerId: 'task-trace-env',
      queue: new MemoryQueueAdapter<JobMessage>({ pollInterval: 1 }),
      taskQueue,
      registry: { get: () => Promise.resolve(undefined) },
      executionState,
      taskRegistry: { get: (id) => Promise.resolve(id === task.id ? task : undefined) },
      taskExecutor: createDefaultTaskExecutor(),
      idempotency: new KvWorkerIdempotencyStore({ kv }),
    });
    const started = worker.start();
    void started.catch(() => undefined);
    try {
      await taskQueue.enqueue({
        taskId: task.id,
        topic: 'tasks',
        triggeredBy: 'queue',
        correlationId: 'corr-subprocess-1',
        traceparent: MESSAGE_TRACEPARENT,
        tracestate: MESSAGE_TRACESTATE,
      });
      const completed = await bounded(terminal.promise, 60_000);

      assertEquals(completed.status, 'completed', completed.error ?? undefined);
      assertEquals(completed.result, {
        taskId: task.id,
        correlationId: 'corr-subprocess-1',
        traceparent: MESSAGE_TRACEPARENT,
        tracestate: MESSAGE_TRACESTATE,
      });
    } finally {
      await bounded(worker.stop());
      await bounded(started);
      await Deno.remove(scriptDir, { recursive: true });
    }
  },
});

function installTracePropagation(): () => void {
  otelContext.disable();
  propagation.disable();
  assert(otelContext.setGlobalContextManager(new AsyncLocalStorageContextManager().enable()));
  assert(propagation.setGlobalPropagator(new W3CTraceContextPropagator()));
  return () => {
    otelContext.disable();
    propagation.disable();
  };
}
