import { assert, assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { Pool } from 'npm:pg@^8.23.1';
import { PostgresAdapter } from '../adapters/postgres.adapter.ts';
import type { MessageContext, MessageQueue } from '../ports/mod.ts';
import { MemoryDeadLetterStore } from '../testing/memory-queue.ts';
import { bounded, LeaseHarness } from './_fixtures/redis-lease-harness.ts';

interface Fixture extends AsyncDisposable {
  queue(): MessageQueue;
  depths(): Promise<{ ready: number; processing: number; dead: number }>;
}

function fixture(kind: string, url: string, limit: number): Fixture {
  if (kind !== 'Postgres') {
    const harness = new LeaseHarness(url);
    const inspector = harness.queue();
    return {
      queue: () => harness.queue(),
      depths: async () => {
        const health = await inspector.getHealth();
        return { ready: health.ready, processing: health.processing, dead: health.deadLetterDepth };
      },
      [Symbol.asyncDispose]: () => harness[Symbol.asyncDispose](),
    };
  }
  const client = new Pool({ connectionString: url });
  const tableName = `refund_${crypto.randomUUID().replaceAll('-', '')}`;
  const deadLetterStore = new MemoryDeadLetterStore();
  return {
    queue: () =>
      new PostgresAdapter({
        client,
        tableName,
        deadLetterStore,
        maxRetries: limit - 1,
        pollInterval: 1,
      }),
    depths: async () => {
      const { rows } = await client.query(
        `SELECT count(*) FILTER (WHERE locked_by IS NULL) AS ready,
        count(*) FILTER (WHERE locked_by IS NOT NULL) AS processing FROM "${tableName}"`,
      );
      return {
        ready: Number(rows[0].ready),
        processing: Number(rows[0].processing),
        dead: await deadLetterStore.depth(),
      };
    },
    [Symbol.asyncDispose]: async () => {
      try {
        await client.query(`DROP TABLE IF EXISTS "${tableName}"`);
      } finally {
        await client.end();
      }
    },
  };
}

function hold(queue: MessageQueue, limit: number, visibilityTimeout = 1_000) {
  const received = Promise.withResolvers<MessageContext>();
  const released = Promise.withResolvers<void>();
  const controller = new AbortController();
  const done = queue.listen(async (_message, context) => {
    received.resolve(context);
    await released.promise;
  }, {
    signal: controller.signal,
    maxDeliveries: limit,
    visibilityTimeout,
    recoveryGrace: 0,
    pollIntervalMs: 10,
  });
  void done.catch(() => {});
  return {
    received: () => bounded(received.promise),
    stop: async () => {
      controller.abort();
      released.resolve();
      try {
        await bounded(done);
      } finally {
        await queue.stop();
      }
    },
  };
}

for (
  const [kind, url] of [
    ['Redis', Deno.env.get('NETSCRIPT_TEST_REDIS_URL')],
    ['Garnet', Deno.env.get('NETSCRIPT_TEST_GARNET_URL')],
    ['Postgres', Deno.env.get('NETSCRIPT_TEST_POSTGRES_URL')],
  ] as const
) {
  Deno.test({
    name:
      `${kind} shutdown refund at the delivery limit is once-only and cannot settle a replacement`,
    ignore: !url,
    async fn() {
      await using backend = fixture(kind, url!, 1);
      const queue = backend.queue();
      await queue.enqueue('healthy');
      const first = hold(queue, 1);
      let second: ReturnType<typeof hold> | undefined;
      try {
        const old = await first.received();
        await Promise.all([
          old.nack({ preserveDeliveryCount: true }),
          old.nack({ preserveDeliveryCount: true }),
        ]);
        await old.ack();
        assertEquals(await backend.depths(), { ready: 1, processing: 0, dead: 0 });
        await first.stop();
        second = hold(backend.queue(), 1);
        const current = await second.received();
        assertEquals(current.messageId, old.messageId);
        assertEquals(current.deliveryCount, 1);
        for (
          const operation of [() => old.nack({ preserveDeliveryCount: true }), () => old.ack()]
        ) {
          try {
            await operation();
          } catch (error) {
            assert(error instanceof Error && error.name === 'AbortError');
          }
        }
        assertEquals(await backend.depths(), { ready: 0, processing: 1, dead: 0 });
        await current.ack();
      } finally {
        await first.stop();
        await second?.stop();
      }
      assertEquals(await backend.depths(), { ready: 0, processing: 0, dead: 0 });
    },
  });
  Deno.test({
    name: `${kind} expired shutdown receipt cannot refund or acknowledge a newer delivery`,
    ignore: !url,
    async fn() {
      await using backend = fixture(kind, url!, 5);
      const queue = backend.queue();
      await queue.enqueue('expired');
      const first = hold(queue, 5, 30);
      let second: ReturnType<typeof hold> | undefined;
      try {
        const old = await first.received();
        await delay(60);
        second = hold(backend.queue(), 5);
        const current = await second.received();
        assertEquals(current.deliveryCount, 2, 'Expiry recovery remains a charged attempt.');
        await old.nack({ preserveDeliveryCount: true });
        await old.ack();
        await first.stop();
        assertEquals(await backend.depths(), { ready: 0, processing: 1, dead: 0 });
        await current.ack();
      } finally {
        await first.stop();
        await second?.stop();
      }
      assertEquals(await backend.depths(), { ready: 0, processing: 0, dead: 0 });
    },
  });
  Deno.test({
    name: `${kind} preservation never changes a terminal nack`,
    ignore: !url,
    async fn() {
      await using backend = fixture(kind, url!, 1);
      const queue = backend.queue();
      await queue.enqueue('terminal');
      const consumer = hold(queue, 1);
      try {
        await (await consumer.received()).nack({ requeue: false, preserveDeliveryCount: true });
      } finally {
        await consumer.stop();
      }
      assertEquals(await backend.depths(), { ready: 0, processing: 0, dead: 1 });
    },
  });
}
