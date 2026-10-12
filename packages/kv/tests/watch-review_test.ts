import { assert, assertEquals, assertStrictEquals } from '@std/assert';
import { deadline } from '@std/async';
import { stub } from '@std/testing/mock';
import { Redis } from 'ioredis';
import { createLazyKv, MemoryKvAdapter } from '../mod.ts';
import type { KvKey, WatchEvent, WatchOptions } from '../mod.ts';
import { registerKvAdapter, resetKv } from '../application/mod.ts';
import { RedisKvAdapter } from '../redis.ts';
import { WatchableKvBridge } from '../adapters/denokv-bridge.ts';
import { WatchBatchQueue } from '../adapters/redis/watch-batch-queue.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');
const key = ['review', 'state'];
const wait = <T>(promise: Promise<T>): Promise<T> => deadline(promise, 5_000);

function registerRedis(): void {
  registerKvAdapter('redis', ({ url, namespace }) => new RedisKvAdapter({ url, namespace }));
}

for (const initial of [undefined, true]) {
  const options = initial === undefined ? {} : { initial };
  const mode = initial === undefined ? 'default' : 'initial';

  Deno.test(`watch review: lazy ${mode} pre-aborted iteration completes cleanly`, async () => {
    await resetKv();
    const kv = createLazyKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
    const abort = new AbortController();
    abort.abort();
    const handle = kv.watch([key], { ...options, signal: abort.signal });
    const readiness = handle.ready?.catch((error: unknown) => error);
    const iterator = handle[Symbol.asyncIterator]();
    try {
      assertEquals(await wait(iterator.next()), { done: true, value: undefined });
      assertEquals(await wait(iterator.next()), { done: true, value: undefined });
      assert(readiness);
      const reason = await wait(readiness);
      assert(reason instanceof DOMException);
      assertEquals(reason.name, 'AbortError');
    } finally {
      await iterator.return?.();
      await resetKv();
    }
  });

  Deno.test({
    name: `watch review: lazy ${mode} abort during real held SUBSCRIBE completes cleanly`,
    ignore: !redisUrl,
    async fn() {
      assert(redisUrl);
      await resetKv();
      registerRedis();
      const entered = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const send = Redis.prototype.sendCommand;
      const subscribe = stub(Redis.prototype, 'sendCommand', function (command, ...args) {
        if (command.name !== 'subscribe') return send.call(this, command, ...args);
        entered.resolve();
        return release.promise.then(() => send.call(this, command, ...args));
      });
      const kv = createLazyKv({
        provider: 'redis',
        redisUrl,
        redisNamespace: `abort-${crypto.randomUUID()}`,
        skipServiceDiscovery: true,
      });
      const abort = new AbortController();
      const handle = kv.watch([key], { ...options, signal: abort.signal });
      const readiness = handle.ready?.catch((error: unknown) => error);
      const iterator = handle[Symbol.asyncIterator]();
      const pending = iterator.next();
      void pending.catch(() => {});
      try {
        await wait(entered.promise);
        abort.abort();
        release.resolve();
        assertEquals(await wait(pending), { done: true, value: undefined });
        assertEquals(await wait(iterator.next()), { done: true, value: undefined });
        assert(readiness);
        const reason = await wait(readiness);
        assert(reason instanceof DOMException);
        assertEquals(reason.name, 'AbortError');
      } finally {
        abort.abort();
        release.resolve();
        await pending.catch(() => {});
        await iterator.return?.();
        subscribe.restore();
        await resetKv();
      }
    },
  });

  Deno.test(`watch review: lazy ${mode} real startup failure still rejects iteration`, async () => {
    await resetKv();
    registerRedis();
    const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    const port = listener.addr.port;
    listener.close();
    const kv = createLazyKv({
      provider: 'redis',
      redisUrl: `redis://127.0.0.1:${port}`,
      skipServiceDiscovery: true,
    });
    const handle = kv.watch([key], options);
    const readiness = handle.ready?.catch((error: unknown) => error);
    const iterator = handle[Symbol.asyncIterator]();
    try {
      const failure = await wait(iterator.next().catch((error: unknown) => error));
      assert(failure instanceof Error);
      assert(readiness);
      assertStrictEquals(await wait(readiness), failure);
    } finally {
      await iterator.return?.();
      await resetKv();
    }
  });

  Deno.test(`watch review: lazy ${mode} plain iterable resolves readiness on its first batch`, async () => {
    await resetKv();
    const memory = new MemoryKvAdapter();
    await memory.set(key, 'snapshot');
    const entered = Promise.withResolvers<void>();
    const original = memory.watch.bind(memory);
    // Strip only the optional property from a real memory watch. Iteration,
    // cancellation, values and listener registration remain unchanged.
    const watch = stub(memory, 'watch', function <T>(keys: KvKey[], options?: WatchOptions) {
      const handle = original<T>(keys, options);
      assert(handle.ready);
      void handle.ready.then(entered.resolve);
      return { [Symbol.asyncIterator]: () => handle[Symbol.asyncIterator]() };
    });
    registerKvAdapter('redis', () => memory);
    const kv = createLazyKv({ provider: 'redis', redisUrl: 'redis://explicit-config.test' });
    const abort = new AbortController();
    const handle = kv.watch<string>([key], { ...options, signal: abort.signal });
    const readiness = handle.ready?.then(() => 'ready', (error: unknown) => error);
    const iterator = handle[Symbol.asyncIterator]();
    const pending = iterator.next();
    try {
      await wait(entered.promise);
      if (!initial) await kv.set(key, 'change');
      const batch = await wait(pending);
      assert(!batch.done);
      assertEquals(batch.value[0].value, initial ? 'snapshot' : 'change');
      assert(readiness);
      assertEquals(await Promise.race([readiness, Promise.resolve('unresolved')]), 'ready');
    } finally {
      abort.abort();
      await pending.catch(() => {});
      await iterator.return?.();
      watch.restore();
      await resetKv();
      registerRedis();
    }
  });
}

Deno.test({
  name: 'watch review: kvdex never regresses a newer Redis snapshot on older or equal replays',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const kv = new RedisKvAdapter({ url: redisUrl, namespace: `replay-${crypto.randomUUID()}` });
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const olderQueued = Promise.withResolvers<void>();
    const newerHeld = Promise.withResolvers<void>();
    const getMany = kv.getMany.bind(kv);
    const read = stub(kv, 'getMany', async function <T>(keys: KvKey[]) {
      entered.resolve();
      await release.promise;
      return await getMany<T>(keys);
    });
    let requests = 0;
    const requested = new Map<number, ReturnType<typeof Promise.withResolvers<void>>>();
    const request = (count: number): Promise<void> => {
      if (requests >= count) return Promise.resolve();
      const signal = Promise.withResolvers<void>();
      requested.set(count, signal);
      return signal.promise;
    };
    const next = WatchBatchQueue.prototype.next;
    const drain = stub(WatchBatchQueue.prototype, 'next', function (...args) {
      requests++;
      requested.get(requests)?.resolve();
      return next.apply(this, args);
    });
    const push = WatchBatchQueue.prototype.push;
    let replayOlder = (): void => {};
    let deliverNewer = (): void => {};
    const queue = stub(WatchBatchQueue.prototype, 'push', function (event) {
      const change = event as WatchEvent<string>;
      if (change.value === 'newer') {
        deliverNewer = () => push.call(this, event);
        newerHeld.resolve();
      } else {
        push.call(this, event);
        if (change.value === 'older') {
          replayOlder = () => push.call(this, event);
          olderQueued.resolve();
        }
      }
    });
    const reader = new WatchableKvBridge(kv).watch<string>([key]).getReader();
    const pending = reader.read();
    try {
      await wait(entered.promise);
      await kv.set(key, 'older');
      await wait(olderQueued.promise);
      await kv.set(key, 'newer');
      await wait(newerHeld.promise);
      const newer = await kv.get(key);
      release.resolve();
      assertEquals((await wait(pending)).value?.[0].value, 'newer');
      const afterReplays = reader.read();
      // A fresh queue wait proves the older replay has been reconciled and
      // suppressed, without relying on a sleep or a pending-promise timeout.
      await wait(request(2));
      deliverNewer();
      await wait(request(3));
      await kv.delete(key);
      const deleted = await wait(afterReplays);
      assertEquals(deleted.value?.[0].value, null);
      assertEquals(deleted.value?.[0].versionstamp, null);
      assert(newer?.versionstamp);
      const afterDeleteReplay = reader.read();
      replayOlder();
      await wait(request(5));
      await kv.set(key, 'latest');
      assertEquals((await wait(afterDeleteReplay)).value?.[0].value, 'latest');
    } finally {
      release.resolve();
      await pending.catch(() => {});
      await reader.cancel();
      queue.restore();
      drain.restore();
      read.restore();
      await kv.close();
    }
  },
});

// Exercise the public harness with a real adapter whose optional readiness is
// hidden. Each scenario must construct exactly one handle and use its snapshot.
const { runWatchableKvContract } = await import('../src/testing/mod.ts');
runWatchableKvContract({
  name: 'watch review: plain iterable contract',
  initial: true,
  make() {
    const kv = new MemoryKvAdapter();
    const originalWatch = kv.watch.bind(kv);
    const originalClose = kv.close.bind(kv);
    let handles = 0;
    const watch = stub(kv, 'watch', function <T>(keys: KvKey[], options?: WatchOptions) {
      handles++;
      const handle = originalWatch<T>(keys, options);
      return { [Symbol.asyncIterator]: () => handle[Symbol.asyncIterator]() };
    });
    const close = stub(kv, 'close', async () => {
      try {
        await originalClose();
        assertEquals(handles, 1, 'the contract must not discard an unused first handle');
      } finally {
        watch.restore();
        close.restore();
      }
    });
    return kv;
  },
});
