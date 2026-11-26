import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { JobMessage } from '@netscript/plugin-workers-core/runtime';
import type { MessageQueue } from '@netscript/queue';
import { DenoKvAdapter } from '@netscript/queue/adapters/deno-kv';
import { KvPollingAdapter } from '@netscript/queue/adapters/kv-polling';
import { PostgresAdapter } from '@netscript/queue/adapters/postgres';
import { AmqpAdapter } from '@netscript/queue/adapters/amqp';
import { MemoryDeadLetterStore, MemoryQueueAdapter } from '@netscript/queue/testing';
import { Pool } from 'npm:pg@^8.23.1';
// @ts-types="npm:@types/amqplib@^0.10.7"
import { connect } from 'npm:amqplib@^2.4.1';
import { bounded } from '../../../packages/queue/tests/_fixtures/redis-lease-harness.ts';
import { recoveryContext } from './test_utils/redis-worker-context.ts';
import { Worker } from './worker.ts';

async function restartWorker(create: () => MessageQueue<JobMessage>): Promise<void> {
  await using kv = new MemoryKvAdapter();
  const idempotency = new KvWorkerIdempotencyStore({ kv });
  let identity: string | undefined;
  let executions = 0;
  for (let restart = 0; restart <= 8; restart++) {
    const entered = Promise.withResolvers<void>();
    const processed = Promise.withResolvers<void>();
    const queue = create();
    const context = recoveryContext(idempotency, {
      execute: async (_definition, { signal }) => {
        assert(signal instanceof AbortSignal);
        executions++;
        entered.resolve();
        if (restart < 8) {
          await new Promise<void>((resolve) =>
            signal.addEventListener('abort', () => resolve(), {
              once: true,
            })
          );
          return { success: false, duration: 1 };
        }
        return { success: true, duration: 1 };
      },
    });
    const worker = new Worker({
      ...context,
      drainTimeoutMs: 1_000,
      abortGracePeriodMs: 800,
      taskQueue: new MemoryQueueAdapter(),
      queue: {
        nativeRetrial: queue.nativeRetrial,
        enqueue: (message, options) => queue.enqueue(message, options),
        stop: () => queue.stop(),
        listen: (handler, options) =>
          queue.listen(async (message, delivery) => {
            assertEquals(delivery.deliveryCount, 1, `Shutdown ${restart} charged the attempt.`);
            identity ??= delivery.messageId;
            assertEquals(delivery.messageId, identity);
            assertEquals(delivery.headers, { purpose: 'worker-replacement' });
            await handler(message, delivery);
            processed.resolve();
          }, options),
      },
    });
    if (restart === 0) {
      await queue.enqueue({ jobId: 'healthy', topic: 'jobs', triggeredBy: 'queue' }, {
        headers: { purpose: 'worker-replacement' },
      });
    }
    const started = worker.start();
    void started.catch(() => {});
    try {
      await bounded(entered.promise);
      if (restart === 8) await bounded(processed.promise);
    } finally {
      await bounded(worker.stop());
      await bounded(started);
    }
  }
  assertEquals(executions, 9);
}

Deno.test('memory survives eight clean Worker replacements and finishes empty', async () => {
  const queue = new MemoryQueueAdapter<JobMessage>();
  await restartWorker(() => queue);
  assertEquals(queue.drain(), []);
});

Deno.test('KV polling survives eight clean Worker replacements without dead letters', async () => {
  await using kv = new MemoryKvAdapter();
  const queueName = crypto.randomUUID();
  const deadLetterStore = new MemoryDeadLetterStore<JobMessage>();
  const create = () =>
    new KvPollingAdapter<JobMessage>({
      kv,
      queueName,
      pollInterval: 1,
      maxRetries: 2,
      deadLetterStore,
    });
  await restartWorker(create);
  const inspector = create();
  assertEquals(await inspector.getStats(), { pending: 0, processing: 0, dlq: 0 });
  assertEquals(await deadLetterStore.depth(), 0);
  await inspector.stop();
});

Deno.test('native Deno KV survives eight clean Worker replacements without an extra delivery', async () => {
  await using kv = await Deno.openKv(':memory:');
  const queueName = crypto.randomUUID();
  await restartWorker(() => DenoKvAdapter.withKv(kv, queueName));
  const inspector = DenoKvAdapter.withKv<JobMessage>(kv, queueName);
  let extra = 0;
  const lifetime = new AbortController();
  const listening = inspector.listen(() => {
    extra++;
    return Promise.resolve();
  }, { signal: lifetime.signal });
  try {
    await new Promise((resolve) => setTimeout(resolve, 200));
  } finally {
    lifetime.abort();
    await listening;
    await inspector.stop();
  }
  assertEquals(extra, 0);
});

Deno.test({
  name: 'Postgres survives eight clean Worker replacements beyond maxRetries with no queue residue',
  ignore: !Deno.env.get('NETSCRIPT_TEST_POSTGRES_URL'),
  async fn() {
    const client = new Pool({ connectionString: Deno.env.get('NETSCRIPT_TEST_POSTGRES_URL') });
    const tableName = `worker_stop_${crypto.randomUUID().replaceAll('-', '')}`;
    const deadLetterStore = new MemoryDeadLetterStore<JobMessage>();
    try {
      await restartWorker(() =>
        new PostgresAdapter({
          client,
          tableName,
          pollInterval: 1,
          maxRetries: 2,
          deadLetterStore,
        })
      );
      const result = await client.query(`SELECT COUNT(*)::int AS count FROM "${tableName}"`);
      assertEquals(result.rows[0].count, 0);
      assertEquals(await deadLetterStore.depth(), 0);
    } finally {
      await client.query(`DROP TABLE IF EXISTS "${tableName}"`);
      await client.end();
    }
  },
});

Deno.test({
  name: 'AMQP survives eight clean Worker replacements with no queued or dead-letter residue',
  ignore: !Deno.env.get('NETSCRIPT_TEST_AMQP_URL'),
  async fn() {
    const url = Deno.env.get('NETSCRIPT_TEST_AMQP_URL')!;
    const queueName = `worker-stop-${crypto.randomUUID()}`;
    const deadLetterStore = new MemoryDeadLetterStore<JobMessage>();
    const connection = await connect(url);
    const channel = await connection.createChannel();
    try {
      await restartWorker(() => new AmqpAdapter(url, queueName, deadLetterStore));
      const state = await channel.checkQueue(queueName);
      assertEquals(state.messageCount, 0);
      assertEquals(state.consumerCount, 0);
      assertEquals(await deadLetterStore.depth(), 0);
    } finally {
      await channel.deleteQueue(queueName);
      await channel.close();
      await connection.close();
    }
  },
});
