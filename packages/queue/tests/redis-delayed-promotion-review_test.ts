import { assert, assertEquals, assertRejects } from '@std/assert';
import { stub } from '@std/testing/mock';
import { deadline } from '@std/async';
import { Redis } from 'ioredis';
import { RedisAdapter } from '../adapters/redis.adapter.ts';
import { forceTransactionPromotion } from './_fixtures/redis-promotion-capability.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

function createHarness(url: string) {
  const name = `delayed-review-${crypto.randomUUID()}`;
  const client = new Redis(url, {
    lazyConnect: true,
    enableReadyCheck: false,
    maxRetriesPerRequest: 1,
  });
  const queue = new RedisAdapter<{ id: number }>(url, name);
  Object.defineProperty(queue, 'clients', {
    value: { commands: client, blocking: { disconnect() {} } },
    writable: true,
  });
  Object.defineProperty(queue, 'promotionClient', { value: client, writable: true });
  const readyKey = `netscript:queue:${name}`;
  const delayedKey = `netscript:delayed:${name}`;
  const entry = JSON.stringify({ queueKey: readyKey, envelope: 'due-envelope' });
  return { client, queue, readyKey, delayedKey, entry, name };
}

for (const abortCount of [2, 3]) {
  Deno.test({
    name:
      `RedisAdapter transaction bounds retry attempts with ${abortCount} concurrent delayed enqueues`,
    ignore: !redisUrl,
    async fn() {
      assert(redisUrl);
      const { client, queue, readyKey, delayedKey, entry, name } = createHarness(redisUrl);
      using _capability = forceTransactionPromotion(client);
      const producer = new RedisAdapter<{ id: number }>(redisUrl, name);
      let attempts = 0;
      const multi = client.multi.bind(client);
      const execStubs: Array<{ restore(): void }> = [];
      using _multiStub = stub(client, 'multi', () => {
        const transaction = multi();
        const exec = transaction.exec.bind(transaction);
        execStubs.push(stub(transaction, 'exec', async () => {
          if (++attempts <= abortCount) {
            // A separate adapter writes after the watched read, before EXEC.
            await producer.enqueue({ id: attempts }, { delay: 60_000 });
          }
          return await exec();
        }));
        return transaction;
      });
      try {
        await client.zadd(delayedKey, 0, entry);
        await queue['moveDueDelayedMessages']();
        assertEquals(attempts, 3, 'one poll has a budget of three attempts');
        if (abortCount === 2) {
          assertEquals(await client.lrange(readyKey, 0, -1), ['due-envelope']);
          assertEquals(await client.zcard(delayedKey), 2, 'only future enqueues remain');
        } else {
          assertEquals(await client.llen(readyKey), 0);
          assertEquals(await client.zcard(delayedKey), 4, 'exhaustion retains every member');
          await queue['moveDueDelayedMessages']();
          assertEquals(await client.lrange(readyKey, 0, -1), ['due-envelope']);
          assertEquals(await client.zcard(delayedKey), 3);
        }
      } finally {
        execStubs.forEach((execStub) => execStub.restore());
        await producer.stop();
        await client.del(readyKey, delayedKey);
        client.disconnect();
      }
    },
  });
}

for (const forceFallback of [false, true]) {
  Deno.test({
    name: `RedisAdapter retains wrongly typed targets while promoting valid members (${
      forceFallback ? 'transaction' : 'detected backend'
    })`,
    ignore: !redisUrl,
    async fn() {
      assert(redisUrl);
      const { client, queue, readyKey, delayedKey, entry } = createHarness(redisUrl);
      using _capability = forceFallback ? forceTransactionPromotion(client) : undefined;
      const invalidKey = `${readyKey}:wrong-type`;
      const invalidEntry = JSON.stringify({ queueKey: invalidKey, envelope: 'retained-envelope' });
      const errors: unknown[][] = [];
      using _log = stub(console, 'error', (...args: unknown[]) => errors.push(args));
      try {
        await client.set(invalidKey, 'wrong-type');
        await client.zadd(delayedKey, 0, entry, 17, invalidEntry);
        await queue['moveDueDelayedMessages']();
        assertEquals(await client.zrange(delayedKey, 0, -1), [invalidEntry]);
        assertEquals(await client.get(invalidKey), 'wrong-type');
        assertEquals(await client.lrange(readyKey, 0, -1), ['due-envelope']);
        assertEquals(errors.length, 1);
        assertEquals(
          await client.zscore(delayedKey, invalidEntry),
          '17',
          'original score preserved',
        );
        assert(String(errors[0][0]).includes('member retained'));
        await client.del(invalidKey);
        await queue['moveDueDelayedMessages']();
        assertEquals(await client.lrange(invalidKey, 0, -1), ['retained-envelope']);
        assertEquals(await client.zcard(delayedKey), 0);
      } finally {
        await client.del(readyKey, delayedKey, invalidKey);
        client.disconnect();
      }
    },
  });
}

Deno.test({
  name: 'RedisAdapter producer creates its promotion connection only on the first pass',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const name = `delayed-lazy-${crypto.randomUUID()}`;
    const queue = new RedisAdapter(redisUrl, name);
    const observer = new Redis(redisUrl, { lazyConnect: true, enableReadyCheck: false });
    try {
      await queue.enqueue('producer-message');
      assertEquals(Object.keys(queue['ensureClients']()).sort(), ['blocking', 'commands']);
      assertEquals(queue['promotionClient'], undefined);
      const first = queue['moveDueDelayedMessages']().catch((error: unknown) => error);
      const promotion = queue['promotionClient'];
      assert(promotion instanceof Redis);
      await deadline(
        new Promise<void>((resolve) => promotion.once('ready', () => resolve())),
        1_000,
      );
      await first; // The best-effort initial poll may fail before the client is ready.
      await queue['moveDueDelayedMessages']();
      await queue.stop();
      assertEquals(queue['promotionClient'], undefined);
    } finally {
      await queue.stop();
      await observer.del(`netscript:queue:${name}`, `netscript:delayed:${name}`);
      observer.disconnect();
    }
  },
});

Deno.test('RedisAdapter preserves the primary failure when UNWATCH also fails', async () => {
  const primary = new SyntaxError('invalid delayed envelope');
  const cleanup = new Error('unwatch failed');
  const queue = new RedisAdapter('redis://example');
  const errors: unknown[][] = [];
  using _log = stub(console, 'error', (...args: unknown[]) => errors.push(args));
  Object.defineProperty(queue, 'promotionClient', {
    value: {
      status: 'ready',
      on() {},
      off() {},
      eval: () => Promise.reject(new Error('ERR unknown command EVAL')),
      watch: () => Promise.resolve('OK'),
      zrangebyscore: () => Promise.reject(primary),
      unwatch: () => Promise.reject(cleanup),
    },
  });
  const error = await assertRejects(() => queue['moveDueDelayedMessages'](), SyntaxError);
  assertEquals(error, primary);
  assertEquals(errors[0][1], cleanup);
});

for (const outcome of ['successful', 'failing', 'expected-stop'] as const) {
  const fails = outcome !== 'successful';
  Deno.test(`RedisAdapter timer stop handles an in-flight ${outcome} pass without unhandled rejection`, async () => {
    const queue = new RedisAdapter('redis://example');
    const started = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const primary = new Error(
      outcome === 'expected-stop' ? 'Connection is closed' : 'promotion read failed',
    );
    let disconnects = 0;
    let unhandled = 0;
    let tick: () => void = () => {
      throw new Error('timer callback not registered');
    };
    const setInterval = globalThis.setInterval.bind(globalThis);
    using _interval = stub(globalThis, 'setInterval', (callback) => {
      assert(typeof callback === 'function');
      tick = () => callback();
      // Keep a real disposable timer handle, but drive its callback explicitly.
      return setInterval(() => {}, 60_000);
    });
    const errors: unknown[][] = [];
    using _log = stub(console, 'error', (...args: unknown[]) => errors.push(args));
    const observeUnhandled = () => unhandled++;
    globalThis.addEventListener('unhandledrejection', observeUnhandled);
    Object.defineProperty(queue, 'promotionClient', {
      value: {
        status: 'ready',
        on() {},
        off() {},
        eval: () => Promise.reject(new Error('ERR unknown command EVAL')),
        watch: () => Promise.resolve('OK'),
        zrangebyscore: async () => {
          started.resolve();
          await release.promise;
          if (fails) throw primary;
          return [];
        },
        unwatch: () => Promise.resolve('OK'),
        disconnect: () => disconnects++,
      },
      writable: true,
    });
    try {
      queue['startDelayedProcessor']();
      tick();
      tick(); // A pending pass must not accumulate another timer rejection handler.
      await started.promise;
      const stopped = queue.stop();
      assertEquals(disconnects, 1, 'stop disconnects before awaiting the pass');
      release.resolve();
      await stopped;
      assertEquals(disconnects, 1);
      assertEquals(unhandled, 0);
      assertEquals(queue['delayedPromotion'], undefined);
      assertEquals(queue['delayedTimer'], undefined);
      assertEquals(errors.some((args) => args.includes(primary)), outcome === 'failing');
      if (outcome === 'failing') {
        assertEquals(errors.length, 1, 'one shared pass owns error reporting');
      }
    } finally {
      release.resolve();
      await queue.stop();
      globalThis.removeEventListener('unhandledrejection', observeUnhandled);
    }
  });
}
