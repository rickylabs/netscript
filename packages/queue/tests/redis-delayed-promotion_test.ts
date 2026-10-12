import { assert, assertEquals, assertRejects } from '@std/assert';
import { stub } from '@std/testing/mock';
import { Redis } from 'ioredis';
import { RedisAdapter } from '../adapters/redis.adapter.ts';
import { createEnvelope } from '../adapters/_envelope.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

Deno.test({
  name: 'CI requires Redis for the delayed-promotion regression',
  ignore: !Deno.env.get('CI'),
  fn() {
    assert(redisUrl, 'NETSCRIPT_TEST_REDIS_URL is required in CI');
  },
});

function createHarness(url: string, name: string, count: number) {
  const clients = Array.from(
    { length: count },
    () => new Redis(url, { lazyConnect: true, enableReadyCheck: false, maxRetriesPerRequest: 1 }),
  );
  const queues = clients.map((client) => {
    const queue = new RedisAdapter<{ id: number }>(url, name);
    // Reuse the existing adapter seam and drive promotion directly, without timers.
    Object.defineProperty(queue, 'clients', {
      value: { commands: client, blocking: client, promotion: client },
    });
    return queue;
  });
  const readyKey = `netscript:queue:${name}`;
  const delayedKey = `netscript:delayed:${name}`;
  const processingKey = `netscript:processing:${name}`;
  return { clients, queues, readyKey, delayedKey, processingKey };
}

Deno.test({
  name: 'RedisAdapter eight concurrent movers promote and deliver each due message exactly once',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const { clients, queues, readyKey, delayedKey, processingKey } = createHarness(
      redisUrl,
      `delayed-race-${crypto.randomUUID()}`,
      8,
    );
    const readerBarrier = Promise.withResolvers<void>();
    let readers = 0;
    const readStubs = clients.map((client) => {
      const read = client.zrangebyscore.bind(client);
      return stub(client, 'zrangebyscore', async (...args: Parameters<typeof read>) => {
        const entries = await read(...args);
        if (++readers === clients.length) readerBarrier.resolve();
        await readerBarrier.promise;
        return entries;
      });
    });
    const expected = Array.from(
      { length: 80 },
      (_, id) => JSON.stringify(createEnvelope({ id }, { headers: { source: 'delayed-race' } })),
    );
    try {
      await clients[0].zadd(
        delayedKey,
        ...expected.flatMap((envelope) => [0, JSON.stringify({ queueKey: readyKey, envelope })]),
      );
      await Promise.all(queues.map((queue) => queue['moveDueDelayedMessages']()));
      assertEquals(readers, 8);
      assertEquals(await clients[0].zcard(delayedKey), 0, 'no lost or pending due members');
      assertEquals(await clients[0].llen(readyKey), expected.length, 'one insertion per member');

      const delivered: number[] = [];
      const claims: string[] = [];
      const counts: number[] = [];
      await Promise.all(queues.map(async (queue, index) => {
        // Finite nonblocking pop-push calls exercise the same atomic pickup as listen().
        for (;;) {
          const encoded = await clients[index].rpoplpush(readyKey, processingKey);
          if (encoded === null) return;
          assert(expected.includes(encoded), 'envelope bytes are preserved');
          await queue['handleEncodedMessage'](encoded, async (message, context) => {
            delivered.push(message.id);
            claims.push(context.messageId);
            counts.push(context.deliveryCount);
            assertEquals(context.headers, { source: 'delayed-race' });
            await context.ack();
          });
        }
      }));
      assertEquals(delivered.sort((a, b) => a - b), expected.map((_, id) => id));
      assertEquals(new Set(claims).size, expected.length, 'one concurrent pickup per message id');
      assertEquals(counts, expected.map(() => 1));
      assertEquals(await clients[0].llen(processingKey), 0);
    } finally {
      readStubs.forEach((readStub) => readStub.restore());
      await clients[0].del(readyKey, delayedKey, processingKey);
      clients.forEach((client) => client.disconnect());
    }
  },
});

Deno.test({
  name: 'RedisAdapter bounds promotion batches and preserves future entries and recorded routing',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const { clients, queues, readyKey, delayedKey, processingKey } = createHarness(
      redisUrl,
      `delayed-batch-${crypto.randomUUID()}`,
      1,
    );
    const targetKey = `${readyKey}:recorded-target`;
    const client = clients[0];
    const queue = queues[0];
    const expected = Array.from(
      { length: 257 },
      (_, id) =>
        JSON.stringify({ queueKey: targetKey, envelope: JSON.stringify(createEnvelope({ id })) }),
    );
    const future = JSON.stringify({ queueKey: targetKey, envelope: 'future-envelope' });
    try {
      await client.zadd(delayedKey, ...expected.flatMap((entry) => [0, entry]));
      await client.zadd(delayedKey, Date.now() + 60_000, future);
      const pass = queue['moveDueDelayedMessages']();
      assertEquals(queue['moveDueDelayedMessages'](), pass, 'overlapping polls share WATCH state');
      await pass;
      assertEquals(await client.llen(targetKey), 100);
      assertEquals(await client.zcard(delayedKey), 158);
      await queue['moveDueDelayedMessages']();
      assertEquals(await client.llen(targetKey), 200);
      await queue['moveDueDelayedMessages']();
      await queue['moveDueDelayedMessages']();
      assertEquals(await client.llen(targetKey), 257);
      assertEquals(await client.zrange(delayedKey, 0, -1), [future]);
      assertEquals(await client.llen(readyKey), 0, 'route comes from parsed entry');
    } finally {
      await client.del(readyKey, delayedKey, processingKey, targetKey);
      client.disconnect();
    }
  },
});

Deno.test({
  name: 'RedisAdapter clears WATCH and allows a subsequent pass after invalid JSON',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const { clients, queues, readyKey, delayedKey } = createHarness(
      redisUrl,
      `delayed-invalid-${crypto.randomUUID()}`,
      1,
    );
    const client = clients[0];
    try {
      await client.zadd(delayedKey, 0, 'invalid-json');
      await assertRejects(() => queues[0]['moveDueDelayedMessages'](), SyntaxError);
      assertEquals(await client.zcard(delayedKey), 1);
      await client.zrem(delayedKey, 'invalid-json');
      await client.zadd(delayedKey, 0, JSON.stringify({ queueKey: readyKey, envelope: 'valid' }));
      await queues[0]['moveDueDelayedMessages']();
      assertEquals(await client.lrange(readyKey, 0, -1), ['valid']);
    } finally {
      await client.del(readyKey, delayedKey);
      client.disconnect();
    }
  },
});
