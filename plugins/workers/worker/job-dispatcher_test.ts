import { assertEquals } from 'jsr:@std/assert@^1';
import { MemoryKvAdapter } from '@netscript/kv';
import type {
  JobDefinition,
  JobMessage,
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

function dispatchContext(
  options: Readonly<{
    kv: MemoryKvAdapter;
    executionState: MemoryExecutionState;
    taskExecutor: CountingTaskExecutor;
    job?: JobDefinition;
    task?: TaskDefinition;
  }>,
): WorkerDispatchContext {
  return {
    workerId: 'worker-test',
    registry: new SingleJobRegistry(options.job),
    executionState: options.executionState,
    taskExecutor: options.taskExecutor,
    taskRegistry: new SingleTaskRegistry(options.task),
    idempotency: new KvWorkerIdempotencyStore({ kv: options.kv }),
    workerPool: {} as never,
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
  #next = 0;

  create(options: WorkerCreateExecutionOptions): Promise<WorkerExecutionRecord> {
    this.created.push(options);
    this.#next += 1;
    return Promise.resolve({ id: `exec-${this.#next}` });
  }

  start(executionId: string): Promise<WorkerExecutionRecord | null> {
    return Promise.resolve({ id: executionId });
  }

  complete(
    executionId: string,
    options: WorkerCompleteExecutionOptions,
  ): Promise<WorkerExecutionRecord | null> {
    this.completed.push({ executionId, options });
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
