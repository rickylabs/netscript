import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
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

  constructor(private readonly results: (WorkerTaskResult | Error)[]) {}

  execute(_task: TaskDefinition, _options: TaskExecutionOptions): Promise<WorkerTaskResult> {
    const result = this.results[this.calls] ?? { success: true, duration: 1 };
    this.calls += 1;
    if (result instanceof Error) {
      return Promise.reject(result);
    }
    return Promise.resolve(result);
  }
}
