import { assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvPollingAdapter } from '../adapters/kv-polling.adapter.ts';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import { RedisAdapter } from '../adapters/redis.adapter.ts';
import { PostgresAdapter } from '../adapters/postgres.adapter.ts';
import { AmqpAdapter } from '../adapters/amqp.adapter.ts';
import { Pool } from 'npm:pg@^8.23.1';
import { MemoryDeadLetterStore, MemoryQueueAdapter } from '../testing/memory-queue.ts';
import type { MessageQueue } from '../ports/mod.ts';
import { bounded, leaseBackends } from './_fixtures/redis-lease-harness.ts';

async function repeatedHandback(
  create: () => MessageQueue<{ id: string }>,
  preserve: boolean,
  rounds: number,
  throwFailure = false,
): Promise<void> {
  let identity: string | undefined;
  for (let round = 0; round < rounds; round++) {
    const queue = create();
    const stop = new AbortController();
    const receipt = Promise.withResolvers<void>();
    if (round === 0) {
      await queue.enqueue({ id: 'healthy' }, { headers: { purpose: 'shutdown-requeue' } });
    }
    let expectedFailure = false;
    const done = queue.listen(async (_message, delivery) => {
      try {
        assertEquals(delivery.deliveryCount, preserve ? 1 : round + 1);
        identity ??= delivery.messageId;
        assertEquals(delivery.messageId, identity);
        assertEquals(delivery.headers, { purpose: 'shutdown-requeue' });
        stop.abort();
        if (round === rounds - 1) await delivery.ack();
        else if (throwFailure) {
          expectedFailure = true;
          receipt.resolve();
          throw new Error('Expected handler failure for counting contract.');
        } else {
          // A variable keeps this behavioral oracle executable against the old port contract.
          const options = { requeue: true, preserveDeliveryCount: preserve };
          await delivery.nack(options);
        }
        receipt.resolve();
      } catch (error) {
        stop.abort();
        if (!expectedFailure) receipt.reject(error);
        throw error;
      }
    }, { signal: stop.signal, pollIntervalMs: 10, maxDeliveries: 3 });
    void done.catch(() => {});
    try {
      await bounded(receipt.promise);
    } finally {
      stop.abort();
      try {
        await bounded(done).catch((error: unknown) => {
          if (!expectedFailure) throw error;
        });
      } finally {
        await queue.stop();
      }
    }
  }
}

for (const mode of ['shutdown', 'explicit', 'throw'] as const) {
  const preserve = mode === 'shutdown';
  const throwFailure = mode === 'throw';
  const reason = preserve
    ? 'shutdown handback preserves'
    : throwFailure
    ? 'thrown handler failure charges'
    : 'handler requeue charges';
  const rounds = preserve ? 8 : 3;
  Deno.test(`memory ${reason} delivery attempts across listener restarts`, async () => {
    const queue = new MemoryQueueAdapter<{ id: string }>();
    await repeatedHandback(() => queue, preserve, rounds, throwFailure);
  });
  Deno.test(`KV polling ${reason} delivery attempts across adapter restarts`, async () => {
    await using kv = new MemoryKvAdapter();
    const deadLetters = new MemoryDeadLetterStore();
    const queueName = crypto.randomUUID();
    await repeatedHandback(
      () =>
        new KvPollingAdapter({
          kv,
          queueName,
          pollInterval: 1,
          maxRetries: 2,
          retryBaseDelay: 0,
          deadLetterStore: deadLetters,
        }),
      preserve,
      rounds,
      throwFailure,
    );
    assertEquals(await deadLetters.depth(), 0);
  });
  Deno.test(`Deno KV ${reason} delivery attempts across adapter restarts`, async () => {
    await using kv = await Deno.openKv(':memory:');
    const name = crypto.randomUUID();
    await repeatedHandback(() => DenoKvAdapter.withKv(kv, name), preserve, rounds, throwFailure);
  });
  for (const [backend, url] of leaseBackends) {
    Deno.test({
      name: `${backend} ${reason} delivery attempts across adapter restarts`,
      ignore: !url,
      fn: async () => {
        const name = `shutdown-${crypto.randomUUID()}`;
        await repeatedHandback(() => new RedisAdapter(url!, name), preserve, rounds, throwFailure);
      },
    });
  }
  const postgres = Deno.env.get('NETSCRIPT_TEST_POSTGRES_URL');
  Deno.test({
    name: `Postgres ${reason} delivery attempts across adapter restarts`,
    ignore: !postgres,
    fn: async () => {
      const tableName = `shutdown_${crypto.randomUUID().replaceAll('-', '')}`;
      const client = new Pool({ connectionString: postgres });
      const deadLetterStore = new MemoryDeadLetterStore();
      try {
        await repeatedHandback(
          () =>
            new PostgresAdapter({
              client,
              tableName,
              maxRetries: 2,
              pollInterval: 1,
              deadLetterStore,
            }),
          preserve,
          rounds,
          throwFailure,
        );
        assertEquals(await deadLetterStore.depth(), 0);
      } finally {
        await client.query(`DROP TABLE IF EXISTS "${tableName}"`);
        await client.end();
      }
    },
  });
  const amqp = Deno.env.get('NETSCRIPT_TEST_AMQP_URL');
  Deno.test({
    name: `AMQP ${reason} delivery attempts across adapter restarts`,
    ignore: !amqp,
    fn: async () => {
      const name = `shutdown-${crypto.randomUUID()}`;
      await repeatedHandback(() => new AmqpAdapter(amqp!, name), preserve, rounds, throwFailure);
    },
  });
}
