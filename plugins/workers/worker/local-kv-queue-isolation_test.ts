import { assertEquals } from 'jsr:@std/assert@^1';
import { MemoryKvAdapter } from '@netscript/kv';
import type {
  JobDefinition,
  JobMessage,
  TaskDefinition,
  TaskMessage,
} from '@netscript/plugin-workers-core/runtime';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import { createQueue, QueueProvider } from '@netscript/queue';
import { Worker } from './worker.ts';
import type { WorkerExecutionState, WorkerTaskExecutor } from './worker-options.ts';

const KV_PATH_ENV = 'DENO_KV_URL';

/** Point queue discovery at a fresh local database, as a DB-less background runtime does. */
async function withLocalKv(run: () => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'workers-local-kv-' });
  const previous = Deno.env.get(KV_PATH_ENV);
  Deno.env.set(KV_PATH_ENV, `${dir}/kv.sqlite`);
  try {
    await run();
  } finally {
    if (previous === undefined) Deno.env.delete(KV_PATH_ENV);
    else Deno.env.set(KV_PATH_ENV, previous);
    await Deno.remove(dir, { recursive: true });
  }
}

function producer<T>(name: string) {
  return createQueue<T>(name, {
    provider: QueueProvider.DenoKv,
    autoDiscover: false,
    disableAutoTracing: true,
  });
}

async function until(condition: () => boolean, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error('Condition did not hold before the deadline.');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function denoJob(id: string, ran: string[]): JobDefinition {
  return {
    id,
    enabled: true,
    topic: 'jobs',
    executionType: 'deno',
    entrypoint: import.meta.url,
    handler: () => {
      ran.push(id);
      return { success: true };
    },
  };
}

Deno.test('combined worker on one local KV runs jobs, tasks and queue triggers without cross-consumption', async () => {
  await withLocalKv(async () => {
    await using kv = new MemoryKvAdapter();
    const jobsRan: string[] = [];
    const tasksRan: string[] = [];
    const requestedJobIds: unknown[] = [];
    const jobs = new Map<string, JobDefinition>([
      ['send-report', denoJob('send-report', jobsRan)],
      ['process-order', denoJob('process-order', jobsRan)],
    ]);
    const task: TaskDefinition = {
      id: 'resize-image',
      topic: 'tasks',
      enabled: true,
      type: 'deno',
      entrypoint: './task.ts',
    };
    let executionId = 0;
    const executionState: WorkerExecutionState = {
      create: () => Promise.resolve({ id: `execution-${++executionId}` }),
      start: (id) => Promise.resolve({ id }),
      progress: (id) => Promise.resolve({ id }),
      complete: (id) => Promise.resolve({ id }),
    };
    const taskExecutor: WorkerTaskExecutor = {
      execute: (definition, options) => {
        tasksRan.push(
          `${definition.id}:${(options.env as Record<string, string> | undefined)?.TASK_PAYLOAD}`,
        );
        return Promise.resolve({ success: true, duration: 1 });
      },
    };
    const worker = new Worker({
      workerId: 'combined-local-kv',
      registry: {
        get: (jobId) => {
          requestedJobIds.push(jobId);
          return Promise.resolve(jobs.get(jobId));
        },
      },
      executionState,
      taskRegistry: {
        get: (taskId) => Promise.resolve(taskId === task.id ? task : undefined),
      },
      taskExecutor,
      idempotency: new KvWorkerIdempotencyStore({ kv }),
      queueTriggers: [{ queueName: 'orders', jobId: 'process-order' }],
    });
    const taskProducer = producer<TaskMessage>('tasks');
    const jobProducer = producer<JobMessage>('jobs');
    const orderProducer = producer<{ orderId: string }>('orders');
    const started = worker.start();
    try {
      for (let index = 0; index < 3; index++) {
        await taskProducer.enqueue({
          taskId: 'resize-image',
          topic: 'tasks',
          triggeredBy: 'manual',
          payload: { image: index },
        });
      }
      await jobProducer.enqueue({ jobId: 'send-report', topic: 'jobs', triggeredBy: 'manual' });
      await orderProducer.enqueue({ orderId: 'o-1' });

      await until(() => tasksRan.length === 3 && jobsRan.length === 2);
      await new Promise((resolve) => setTimeout(resolve, 200));
    } finally {
      await worker.stop();
      await started;
      await Promise.all([taskProducer.stop(), jobProducer.stop(), orderProducer.stop()]);
    }

    assertEquals(tasksRan.sort(), [
      'resize-image:{"image":0}',
      'resize-image:{"image":1}',
      'resize-image:{"image":2}',
    ]);
    assertEquals(jobsRan.sort(), ['process-order', 'send-report']);
    // The jobs listener never received a task message (which would ask the registry for `undefined`).
    assertEquals(requestedJobIds.filter((jobId) => typeof jobId !== 'string'), []);
  });
});
