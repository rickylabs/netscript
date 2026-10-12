import { assert, assertEquals } from '@std/assert';
import { deadline } from '@std/async';
import { stub } from '@std/testing/mock';
import { Redis } from 'ioredis';
import { RedisAdapter } from '../adapters/redis.adapter.ts';
import { forceTransactionPromotion } from './_fixtures/redis-promotion-capability.ts';

for (const state of ['connecting', 'reconnecting', 'reconnecting-with-queued-command'] as const) {
  Deno.test(`RedisAdapter stop bounds real ioredis on a refused port (${state})`, async () => {
    const refused = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    const port = (refused.addr as Deno.NetAddr).port;
    refused.close();
    const queue = new RedisAdapter(`redis://127.0.0.1:${port}`);
    const errors: unknown[][] = [];
    using _log = stub(console, 'error', (...args: unknown[]) => errors.push(args));
    let unhandled = 0;
    const observeUnhandled = () => unhandled++;
    globalThis.addEventListener('unhandledrejection', observeUnhandled);
    let tick: () => void = () => {};
    const setInterval = globalThis.setInterval.bind(globalThis);
    using _interval = stub(globalThis, 'setInterval', (callback) => {
      assert(typeof callback === 'function');
      tick = () => callback();
      return setInterval(() => {}, 60_000);
    });
    const client = queue['ensurePromotionClient']();
    assertEquals(client.options.enableOfflineQueue, false);
    try {
      if (state !== 'connecting') {
        await deadline(
          new Promise<void>((resolve) => client.once('reconnecting', () => resolve())),
          1_000,
        );
        assertEquals(client.status, 'reconnecting');
      } else {
        // No yield: exercise the 0 ms connection state.
        assertEquals(client.status, 'connecting');
      }
      if (state === 'reconnecting-with-queued-command') {
        // Reproduce the old configuration with REAL ioredis: disconnect clears
        // retry scheduling but neither rejects this command nor emits close.
        // The adapter must abandon it via its manual-disconnect signal.
        client.options.enableOfflineQueue = true;
      }
      queue['startDelayedProcessor']();
      tick();
      const pass = queue['delayedPromotion'];
      assert(pass);
      assertEquals(
        client['offlineQueue'].length,
        state === 'reconnecting-with-queued-command' ? 1 : 0,
      );
      await deadline(queue.stop(), 1_000);
      await deadline(pass, 1_000);
      assertEquals(unhandled, 0);
      assertEquals(errors, [], 'connection refusal and offline polls must stay quiet');
      assertEquals(client['reconnectTimeout'], null);
      assertEquals(queue['delayedPromotion'], undefined);
      assertEquals(queue['promotionClient'], undefined);
      if (state === 'reconnecting-with-queued-command') {
        assertEquals(client.status, 'reconnecting');
        assertEquals(
          client['offlineQueue'].length,
          1,
          'real disconnect did not settle the queued command',
        );
      }
    } finally {
      client.disconnect();
      await queue.stop();
      globalThis.removeEventListener('unhandledrejection', observeUnhandled);
    }
  });
}

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

for (const forceFallback of [false, true]) {
  Deno.test({
    name: `RedisAdapter promotes in one pass while ready enqueues and dequeues churn (${
      forceFallback ? 'transaction' : 'detected backend'
    })`,
    ignore: !redisUrl,
    async fn() {
      assert(redisUrl);
      const name = `delayed-contention-${crypto.randomUUID()}`;
      const client = new Redis(redisUrl, { lazyConnect: true, enableReadyCheck: false });
      const producer = new RedisAdapter<string>(redisUrl, name);
      const queue = new RedisAdapter<string>(redisUrl, name);
      Object.defineProperty(queue, 'promotionClient', { value: client, writable: true });
      using _capability = forceFallback ? forceTransactionPromotion(client) : undefined;
      const readyKey = `netscript:queue:${name}`;
      const delayedKey = `netscript:delayed:${name}`;
      const due = JSON.stringify({ queueKey: readyKey, envelope: 'due-envelope' });
      const execStubs: Array<{ restore(): void }> = [];
      let transactionCount = 0;
      let readyWrites = 0;
      const churn = async () => {
        for (let i = 0; i < 20; i++) {
          await producer.enqueue('immediate');
          assert(await client.rpop(readyKey));
          readyWrites += 2;
        }
      };
      const multi = client.multi.bind(client);
      using _multi = stub(client, 'multi', () => {
        transactionCount++;
        const transaction = multi();
        const exec = transaction.exec.bind(transaction);
        execStubs.push(stub(transaction, 'exec', async () => {
          // Force hot-list writes between TYPE and EXEC on every attempt.
          await churn();
          return await exec();
        }));
        return transaction;
      });
      const pipeline = client.pipeline.bind(client);
      using _pipeline = stub(client, 'pipeline', (...args: Parameters<typeof pipeline>) => {
        const batch = pipeline(...args);
        const exec = batch.exec.bind(batch);
        execStubs.push(stub(batch, 'exec', async () => {
          // Also churn before EVAL dispatch (or the fallback's TYPE preflight).
          await churn();
          return await exec();
        }));
        return batch;
      });
      try {
        await client.zadd(delayedKey, 0, due);
        await queue['moveDueDelayedMessages']();
        assert(readyWrites >= 40);
        assert(transactionCount <= 1, 'ready-list traffic must not consume the retry budget');
        assertEquals(await client.lrange(readyKey, 0, -1), ['due-envelope']);
        assertEquals(await client.zcard(delayedKey), 0);
      } finally {
        execStubs.forEach((execStub) => execStub.restore());
        await producer.stop();
        await client.del(readyKey, delayedKey);
        client.disconnect();
      }
    },
  });
}

Deno.test({
  name: 'RedisAdapter abandons a fallback snapshot after WATCH is lost on reconnect',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const name = `delayed-epoch-${crypto.randomUUID()}`;
    const client = new Redis(redisUrl, { lazyConnect: true, enableReadyCheck: false });
    const winner = new Redis(redisUrl, { lazyConnect: true, enableReadyCheck: false });
    const queue = new RedisAdapter(redisUrl, name);
    Object.defineProperty(queue, 'promotionClient', { value: client, writable: true });
    using _capability = forceTransactionPromotion(client);
    const readyKey = `netscript:queue:${name}`;
    const delayedKey = `netscript:delayed:${name}`;
    const entry = JSON.stringify({ queueKey: readyKey, envelope: 'due-envelope' });
    const execStubs: Array<{ restore(): void }> = [];
    const pipeline = client.pipeline.bind(client);
    let dropped = false;
    using _pipeline = stub(client, 'pipeline', (...args: Parameters<typeof pipeline>) => {
      const batch = pipeline(...args);
      const exec = batch.exec.bind(batch);
      execStubs.push(stub(batch, 'exec', async () => {
        const result = await exec();
        if (!dropped) {
          dropped = true;
          await client.unwatch(); // Model the fresh connection's lost WATCH state.
          client.emit('close');
          client.emit('ready');
          await winner.multi().zrem(delayedKey, entry).lpush(readyKey, 'due-envelope').exec();
        }
        return result;
      }));
      return batch;
    });
    const multi = client.multi.bind(client);
    let transactions = 0;
    using _multi = stub(client, 'multi', () => {
      transactions++;
      return multi();
    });
    try {
      await client.zadd(delayedKey, 0, entry);
      await queue['moveDueDelayedMessages']();
      assert(dropped);
      assertEquals(await client.llen(readyKey), 1, 'reconnect must not duplicate a promotion');
      assertEquals(transactions, 0, 'stale snapshot must never reach MULTI');
      assertEquals(await client.lrange(readyKey, 0, -1), ['due-envelope']);
      assertEquals(await client.zcard(delayedKey), 0);
    } finally {
      execStubs.forEach((execStub) => execStub.restore());
      await client.del(readyKey, delayedKey);
      client.disconnect();
      winner.disconnect();
    }
  },
});

for (const forceFallback of [false, true]) {
  Deno.test({
    name: `RedisAdapter caches scripting detection across promotion passes (${
      forceFallback ? 'transaction' : 'detected backend'
    })`,
    ignore: !redisUrl,
    async fn() {
      assert(redisUrl);
      const client = new Redis(redisUrl, { lazyConnect: true, enableReadyCheck: false });
      const queue = new RedisAdapter(redisUrl, `delayed-probe-${crypto.randomUUID()}`);
      Object.defineProperty(queue, 'promotionClient', { value: client, writable: true });
      using capability = forceFallback ? forceTransactionPromotion(client) : undefined;
      const evalCommand = client.eval.bind(client);
      let probes = 0;
      using _eval = forceFallback
        ? undefined
        : stub(client, 'eval', (...args: Parameters<typeof evalCommand>) => {
          probes++;
          return evalCommand(...args);
        });
      try {
        await queue['moveDueDelayedMessages']();
        await queue['moveDueDelayedMessages']();
        assertEquals(capability?.calls.length ?? probes, 1);
      } finally {
        client.disconnect();
      }
    },
  });
}

Deno.test({
  name: 'RedisAdapter caches the promotion SHA and retries NOSCRIPT without duplicate insertion',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const client = new Redis(redisUrl, { lazyConnect: true, enableReadyCheck: false });
    const queue = new RedisAdapter(redisUrl, `delayed-sha-${crypto.randomUUID()}`);
    Object.defineProperty(queue, 'promotionClient', { value: client, writable: true });
    // A real Garnet without scripting exercises the fallback in the other tests.
    const supportsLua = await client.eval('return 1', 0).then(() => true, () => false);
    if (!supportsLua) {
      client.disconnect();
      return;
    }
    const delayedKey = queue['delayedKey'];
    const readyKey = queue['queueKey'];
    const script = client.script.bind(client);
    let loads = 0;
    using _script = stub(client, 'script', (...args: Parameters<typeof script>) => {
      loads++;
      return script(...args);
    });
    const pipeline = client.pipeline.bind(client);
    const execStubs: Array<{ restore(): void }> = [];
    let evicted = false;
    using _pipeline = stub(client, 'pipeline', (...args: Parameters<typeof pipeline>) => {
      const batch = pipeline(...args);
      const exec = batch.exec.bind(batch);
      execStubs.push(stub(batch, 'exec', () => {
        if (!evicted) {
          evicted = true;
          // Model NOSCRIPT for an unexecuted command without globally flushing
          // the shared real backend's script cache during parallel test runs.
          return Promise.resolve([[new Error('NOSCRIPT No matching script'), null]]);
        }
        return exec();
      }));
      return batch;
    });
    try {
      const entries = ['first', 'second'].map((envelope) =>
        JSON.stringify({ queueKey: readyKey, envelope })
      );
      await client.zadd(delayedKey, 0, entries[0]);
      await queue['moveDueDelayedMessages']();
      assertEquals(loads, 2, 'initial load and one NOSCRIPT reload');
      await client.zadd(delayedKey, 0, entries[1]);
      await queue['moveDueDelayedMessages']();
      assertEquals(loads, 2, 'a later pass reuses the loaded SHA');
      assertEquals(await client.lrange(readyKey, 0, -1), ['second', 'first']);
      assertEquals(await client.zcard(delayedKey), 0);
    } finally {
      execStubs.forEach((execStub) => execStub.restore());
      await client.del(readyKey, delayedKey);
      client.disconnect();
    }
  },
});
