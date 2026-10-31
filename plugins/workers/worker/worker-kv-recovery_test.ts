import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { DenoKvAdapter as NativeQueue } from '@netscript/queue/adapters/deno-kv';
import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import { bounded, until } from '../../../packages/queue/tests/_fixtures/redis-lease-harness.ts';
import { recoveryContext } from './test_utils/redis-worker-context.ts';
import { processWorkerJob, processWorkerTask } from './job-dispatcher.ts';

Deno.test('Deno KV job redelivers after a dead-letter write outage', async () => {
  await using kv = await Deno.openKv(':memory:');
  const storage = new DenoKvAdapter(kv);
  const durable = new KvDeadLetterStore<JobMessage>({ kv: storage, queueName: 'job-outage' });
  const queue = NativeQueue.withKv<JobMessage>(kv, 'job-outage');
  const context = recoveryContext(new KvWorkerIdempotencyStore({ kv: storage }), {
    execute: () => Promise.resolve({ success: false, duration: 1, error: 'terminal' }),
  });
  let writes = 0;
  let deliveries = 0;
  const stop = new AbortController();
  const done = queue.listen(async (message, delivery) => {
    deliveries++;
    await processWorkerJob(
      {
        ...context,
        deadLetters: {
          append: async (record) => {
            if (++writes === 1) throw new Error('dead-letter storage temporarily unavailable');
            await durable.append(record);
          },
          list: (options) => durable.list(options),
          depth: () => durable.depth(),
          reprocess: (enqueue, options) => durable.reprocess(enqueue, options),
        },
      },
      message,
      delivery,
    );
  }, { signal: stop.signal });
  try {
    await queue.enqueue({ jobId: 'recover', topic: 'jobs', triggeredBy: 'queue' });
    await until(async () => await durable.depth() === 1, 10_000);
    assertEquals(deliveries, 2);
    assertEquals(writes, 2);
  } finally {
    stop.abort();
    await bounded(done);
    await queue.stop();
  }
});

Deno.test('Deno KV task interrupted by worker shutdown redelivers to a replacement', async () => {
  await using kv = await Deno.openKv(':memory:');
  const storage = new DenoKvAdapter(kv);
  const store = new KvWorkerIdempotencyStore({ kv: storage });
  const original = NativeQueue.withKv<TaskMessage>(kv, 'shutdown-task');
  const replacement = NativeQueue.withKv<TaskMessage>(kv, 'shutdown-task');
  const entered = Promise.withResolvers<void>();
  const shutdown = new AbortController();
  const context = recoveryContext(store, {
    execute: (_task, options) => {
      const signal = options.signal;
      assert(signal instanceof AbortSignal);
      entered.resolve();
      return new Promise((resolve) => {
        signal.addEventListener('abort', () => resolve({ success: false, duration: 1 }), {
          once: true,
        });
      });
    },
  }, shutdown.signal);
  const first = original.listen(
    (message, delivery) => processWorkerTask(context, message, delivery),
    { signal: shutdown.signal },
  );
  const stop = new AbortController();
  let second: Promise<void> | undefined;
  try {
    await original.enqueue({ taskId: 'recover', topic: 'tasks', triggeredBy: 'queue' });
    await bounded(entered.promise);
    shutdown.abort();
    await bounded(first);
    const applied = Promise.withResolvers<void>();
    let effects = 0;
    const next = recoveryContext(store, {
      execute: () => {
        effects++;
        return Promise.resolve({ success: true, duration: 1 });
      },
    });
    second = replacement.listen(async (message, delivery) => {
      await processWorkerTask(next, message, delivery);
      applied.resolve();
    }, { signal: stop.signal });
    await bounded(applied.promise, 10_000);
    assertEquals(effects, 1, 'shutdown must leave the task available to a replacement worker');
  } finally {
    shutdown.abort();
    stop.abort();
    await bounded(first);
    if (second) await bounded(second);
    await original.stop();
    await replacement.stop();
  }
});
