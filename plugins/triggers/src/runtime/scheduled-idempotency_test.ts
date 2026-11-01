import { assert, assertEquals, assertInstanceOf, assertNotEquals } from '@std/assert';
import { DenoKvAdapter, type KvStore } from '@netscript/kv';
import { RedisKvAdapter } from '@netscript/kv/redis';
import { defineScheduledTrigger, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import {
  CronTriggerSchedulerAdapter,
  type RuntimeCronJobContext,
  type RuntimeCronScheduler,
} from '@netscript/plugin-triggers-core/adapters';
import {
  TriggerDeduplicatedError,
  type TriggerEvent,
  type TriggerId,
} from '@netscript/plugin-triggers-core/domain';
import {
  MemoryTriggerDeferScheduler,
  TriggerTestClock,
} from '@netscript/plugin-triggers-core/testing';
import { defineJob } from '@netscript/plugin-workers-core';
import type { JobMessage } from '@netscript/plugin-workers-core/runtime';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { EnqueueOptions, MessageQueue } from '@netscript/queue';
import { processWorkerJob } from '../../../workers/worker/job-dispatcher.ts';
import { createWorkerPool } from '../../../workers/worker/job-runner-pool.ts';
import type { WorkerDispatchContext } from '../../../workers/worker/worker-options.ts';
import { createRuntimeTriggerProcessor } from './trigger-runtime-processor.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');
const SLOT = '2026-10-30T12:00:00.000Z';
const NEXT_SLOT = '2026-10-30T12:01:00.000Z';
const TRIGGERS = ['retention-a', 'retention-b'] as const;
type Backend = 'disk' | 'redis';

for (const backend of ['disk', 'redis'] as const) {
  Deno.test({
    name:
      `${backend}: scheduled triggers and their worker jobs survive processor restart on persisted KV`,
    ignore: backend === 'redis' && !redisUrl,
    async fn() {
      await withBackend(backend, async (open) => {
        const firstKv = await open();
        const first = await scheduledRuntime(firstKv);
        try {
          for (const [index, id] of TRIGGERS.entries()) {
            await first.fire(id, new Date(Date.parse(SLOT) + index).toISOString());
          }
          assertEquals(first.errors, []);
          assertEquals(first.executed, [...TRIGGERS]);
        } finally {
          await first.stop();
          await firstKv.close();
        }
        const secondKv = await open();
        // This is a reopen of durable data, not a fresh or memory-only store.
        const applied = [];
        for await (
          const entry of secondKv.list({ prefix: ['workers', 'idempotency', 'applied'] })
        ) {
          applied.push(entry.key);
        }
        assertEquals(applied.length, TRIGGERS.length);
        const second = await scheduledRuntime(secondKv);
        try {
          for (const [index, id] of TRIGGERS.entries()) {
            await second.fire(id, new Date(Date.parse(NEXT_SLOT) + index).toISOString());
          }
          assertEquals(second.errors, []);
          assertEquals(second.executed, [...TRIGGERS]);
          assertEquals(second.completed, ['completed', 'completed']);
          assertNotEquals(first.messages[0].idempotencyKey, second.messages[0].idempotencyKey);
        } finally {
          await second.stop();
          await secondKv.close();
        }
      });
    },
  });

  Deno.test({
    name: `${backend}: two triggers on the same cron and instant both process and run their jobs`,
    ignore: backend === 'redis' && !redisUrl,
    async fn() {
      await withBackend(backend, async (open) => {
        const kv = await open();
        const runtime = await scheduledRuntime(kv);
        try {
          await Promise.all(TRIGGERS.map((id) => runtime.fire(id, SLOT)));
          assertEquals(runtime.errors, []);
          assertEquals(runtime.executed.toSorted(), [...TRIGGERS]);
          assertEquals(runtime.messages.length, TRIGGERS.length);
          assertNotEquals(runtime.events[0].id, runtime.events[1].id);
          assertNotEquals(runtime.messages[0].idempotencyKey, runtime.messages[1].idempotencyKey);
        } finally {
          await runtime.stop();
          await kv.close();
        }
      });
    },
  });

  Deno.test({
    name:
      `${backend}: duplicate scheduled slot across processors deduplicates despite firing jitter and retries`,
    ignore: backend === 'redis' && !redisUrl,
    async fn() {
      await withBackend(backend, async (open) => {
        const kv = await open();
        const first = await scheduledRuntime(kv);
        const duplicate = await scheduledRuntime(kv);
        try {
          await first.fire(TRIGGERS[0], SLOT);
          // Provider scheduledTime is execution start; even that jitter must not change the slot.
          await duplicate.fire(TRIGGERS[0], '2026-10-30T12:00:00.123Z', 2);
          assertEquals(first.errors, []);
          assertEquals(duplicate.errors.length, 1);
          assertInstanceOf(duplicate.errors[0], TriggerDeduplicatedError);
          assertEquals(first.executed, [TRIGGERS[0]]);
          assertEquals(duplicate.executed, []);
          assertEquals(first.events[0].id, duplicate.events[0].id);
          assertEquals(first.events[0].idempotencyKey, duplicate.events[0].idempotencyKey);
          // Queue redelivery must also be rejected by the real worker applied store.
          await first.redeliver();
          assertEquals(first.executed, [TRIGGERS[0]]);
        } finally {
          await first.stop();
          await duplicate.stop();
          await kv.close();
        }
      });
    },
  });
}

/** Reopen one disk database or one isolated Redis namespace without erasing markers. */
async function withBackend(
  backend: Backend,
  test: (open: () => Promise<KvStore>) => Promise<void>,
): Promise<void> {
  const directory = backend === 'disk'
    ? await Deno.makeTempDir({ prefix: 'scheduled-kv-' })
    : undefined;
  const namespace = `scheduled-${crypto.randomUUID()}`;
  const handles: KvStore[] = [];
  const open = async (): Promise<KvStore> => {
    const kv = backend === 'disk'
      ? new DenoKvAdapter(await Deno.openKv(`${directory}/kv.sqlite3`))
      : new RedisKvAdapter({ url: redisUrl!, namespace });
    handles.push(kv);
    return kv;
  };
  try {
    await test(open);
  } finally {
    // Adapter close is idempotent; close all handles even after an assertion failure.
    for (const kv of handles) await kv.close();
    if (directory !== undefined) await Deno.remove(directory, { recursive: true });
  }
}

/** Real trigger enqueue and worker dispatch with only time and queue transport controlled. */
async function scheduledRuntime(kv: KvStore) {
  const events: TriggerEvent[] = [];
  const messages: JobMessage[] = [];
  const errors: unknown[] = [];
  const executed: unknown[] = [];
  const completed: string[] = [];
  const handlers = new Map<string, (context: RuntimeCronJobContext) => void | Promise<void>>();
  const primitive: RuntimeCronScheduler = {
    schedule: (id, _cron, handler) => {
      handlers.set(id, handler);
      return Promise.resolve({ enabled: true });
    },
    unschedule: (id) => Promise.resolve(handlers.delete(id)),
    get: () => ({ enabled: true }),
    disable: () => Promise.resolve(false),
    enable: () => Promise.resolve(false),
    trigger: () => Promise.resolve(false),
    stop: () => Promise.resolve(),
  };
  const scheduler = new CronTriggerSchedulerAdapter({
    scheduler: primitive,
    onError: (error) => {
      errors.push(error);
    },
  });
  const job = defineJob('scheduled-retention')
    .handler(({ payload }) => {
      assert(payload !== null && typeof payload === 'object' && 'triggerId' in payload);
      executed.push(payload.triggerId);
      return { success: true };
    }).build();
  const pool = createWorkerPool();
  await pool.initialize();
  let executionCount = 0;
  const worker: WorkerDispatchContext = {
    workerId: 'scheduled-regression',
    concurrency: 2,
    registry: { get: (id) => Promise.resolve(id === job.id ? job : undefined) },
    executionState: {
      create: () => Promise.resolve({ id: `execution-${++executionCount}` }),
      start: (id) => Promise.resolve({ id }),
      progress: (id) => Promise.resolve({ id }),
      complete: (id, result) => {
        completed.push(result.status);
        return Promise.resolve({ id });
      },
    },
    taskRegistry: { get: () => Promise.resolve(undefined) },
    taskExecutor: { execute: () => Promise.reject(new Error('Unexpected task execution')) },
    idempotency: new KvWorkerIdempotencyStore({ kv }),
    workerPool: pool,
    jobsDir: '.',
    activeJobs: new Map(),
    workerSpan: null,
  };
  const queue: MessageQueue<JobMessage> = {
    nativeRetrial: false,
    enqueue: async (message: JobMessage, options?: EnqueueOptions) => {
      assert(message.idempotencyKey);
      assertEquals(options?.deduplicationId, message.idempotencyKey);
      messages.push(message);
      await processWorkerJob(worker, message);
    },
    listen: () => Promise.reject(new Error('Queue transport is driven explicitly')),
    stop: () => Promise.resolve(),
  };
  const clock = new TriggerTestClock(new Date(SLOT));
  const processor = await createRuntimeTriggerProcessor({
    kv,
    kvRetentionDays: 7,
    jobQueue: queue,
    deferScheduler: new MemoryTriggerDeferScheduler(clock),
    clock,
  });
  for (const id of TRIGGERS) {
    const definition = defineScheduledTrigger(
      () => Promise.resolve([enqueueJob(job, { payload: { triggerId: id } })]),
      { id, cron: '* * * * *', timezone: 'UTC' },
    );
    await scheduler.schedule(definition.id, definition, async (event) => {
      events.push(event);
      assertEquals((await processor.process(event, definition)).status, 'completed');
    });
  }
  return {
    events,
    messages,
    errors,
    executed,
    completed,
    fire: async (id: string, time: string, attempt = 0) => {
      const handler = handlers.get(id as TriggerId);
      assert(handler);
      await handler({
        scheduledTime: new Date(time),
        actualTime: new Date(Date.parse(time) + 500),
        attempt,
      });
    },
    redeliver: () => processWorkerJob(worker, messages[0]),
    stop: async () => {
      await scheduler.stop();
      await processor.stop();
      await pool.shutdown();
    },
  };
}
