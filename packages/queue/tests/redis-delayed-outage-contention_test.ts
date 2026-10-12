import { assert, assertEquals } from '@std/assert';
import { deadline } from '@std/async';
import { stub } from '@std/testing/mock';
import { EventEmitter } from 'node:events';
import { Redis } from 'ioredis';
import { RedisAdapter } from '../adapters/redis.adapter.ts';
import { forceTransactionPromotion } from './_fixtures/redis-promotion-capability.ts';

class OfflinePromotionClient extends EventEmitter {
  status = 'ready';
  readonly started = Promise.withResolvers<void>();
  readonly pending = Promise.withResolvers<never>();
  constructor(private readonly scripting: boolean) {
    super();
  }
  eval(): Promise<number> {
    return this.scripting
      ? Promise.resolve(1)
      : Promise.reject(new Error('ERR unknown command EVAL'));
  }
  zrangebyscore(): Promise<string[]> {
    return Promise.resolve([JSON.stringify({
      queueKey: 'netscript:queue:default',
      envelope: 'offline-envelope',
    })]);
  }
  pipeline() {
    const started = this.started;
    const pending = this.pending;
    return {
      eval() {
        return this;
      },
      exec(): Promise<never> {
        started.resolve();
        return pending.promise;
      },
    };
  }
  watch(): Promise<never> {
    this.started.resolve();
    return this.pending.promise;
  }
  unwatch(): Promise<never> {
    throw new Error('Disconnected cleanup must not queue another offline command');
  }
  disconnect(): void {
    this.status = 'end';
    this.emit('close');
    this.emit('end');
    this.pending.reject(new Error('Connection is closed'));
  }
}

for (const scripting of [false, true]) {
  Deno.test(`RedisAdapter stop cancels an offline ${scripting ? 'EVAL' : 'WATCH'} without awaiting reconnect`, async () => {
    const queue = new RedisAdapter('redis://example');
    const client = new OfflinePromotionClient(scripting);
    Object.defineProperty(queue, 'promotionClient', { value: client, writable: true });
    const errors: unknown[][] = [];
    using _log = stub(console, 'error', (...args: unknown[]) => errors.push(args));
    const pass = queue['moveDueDelayedMessages']().catch((error: unknown) => error);
    await client.started.promise;
    const stopped = queue.stop();
    try {
      // This is a failure deadline, not a polling wait. The command only rejects
      // when stop disconnects; waiting first reproduces the reviewed outage hang.
      await deadline(stopped, 1_000);
      const error = await pass;
      assert(error instanceof Error);
      assertEquals(error.message, 'Connection is closed');
      assertEquals(errors, []);
      assertEquals(client.status, 'end');
      assertEquals(client.listenerCount('ready'), 0);
      assertEquals(queue['promotionClient'], undefined);
    } finally {
      client.disconnect();
      await pass;
      await stopped;
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
