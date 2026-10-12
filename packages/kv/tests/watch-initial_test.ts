import { assert, assertEquals } from '@std/assert';
import { deadline } from '@std/async';
import { stub } from '@std/testing/mock';
import { Redis } from 'ioredis';
import { DenoKvAdapter, MemoryKvAdapter } from '../mod.ts';
import type { WatchableKv, WatchEvent, WatchOptions, WatchStream } from '../mod.ts';
import { RedisKvAdapter } from '../redis.ts';
import { WatchBatchQueue } from '../adapters/redis/watch-batch-queue.ts';
import { WatchableKvBridge } from '../adapters/denokv-bridge.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');
const key = ['initial', 'present'];
const missing = ['initial', 'absent'];
const wait = <T>(promise: Promise<T>): Promise<T> => deadline(promise, 5_000);
const backends: {
  name: string;
  make: () => WatchableKv | Promise<WatchableKv>;
  ignore?: boolean;
}[] = [
  { name: 'memory', make: () => new MemoryKvAdapter() },
  { name: 'Deno KV', make: async () => new DenoKvAdapter(await Deno.openKv(':memory:')) },
  {
    name: 'Redis',
    ignore: !redisUrl,
    make: () => new RedisKvAdapter({ url: redisUrl!, namespace: `initial-${crypto.randomUUID()}` }),
  },
];

for (const backend of backends) {
  Deno.test({
    name: `watch initial: ${backend.name} snapshot precedes changes and includes absent keys`,
    ignore: backend.ignore,
    async fn() {
      const kv = await backend.make();
      const abort = new AbortController();
      await kv.set(key, 'before-subscription');
      const entry = await kv.get(key);
      const handle: WatchStream<string> = kv.watch<string>([key, missing], {
        initial: true,
        signal: abort.signal,
      });
      const iterator = handle[Symbol.asyncIterator]();
      const pending = iterator.next();
      try {
        assert(handle.ready, 'first-party watches must expose readiness');
        await wait(handle.ready);
        const batch = await wait(pending);
        assert(!batch.done);
        assertEquals(
          batch.value.map((event) => ({
            key: event.key,
            type: event.type,
            value: event.value,
            versionstamp: event.versionstamp,
            initial: event.initial,
          })),
          [
            {
              key,
              type: 'set',
              value: 'before-subscription',
              versionstamp: entry!.versionstamp,
              initial: true,
            },
            { key: missing, type: 'delete', value: null, versionstamp: null, initial: true },
          ],
        );
        const change = iterator.next();
        await kv.set(key, 'after-snapshot');
        const next = await wait(change);
        assert(!next.done);
        assertEquals(next.value[0].value, 'after-snapshot');
        assertEquals(next.value[0].initial, undefined);
        assertEquals(next.value[0].versionstamp, (await kv.get(key))!.versionstamp);
      } finally {
        abort.abort();
        await kv.set(key, 'cleanup');
        await pending.catch(() => {});
        await iterator.return?.();
        await kv.close();
      }
    },
  });

  Deno.test({
    name: `watch initial: ${backend.name} default emits only a subsequent change`,
    ignore: backend.ignore,
    async fn() {
      const kv = await backend.make();
      const abort = new AbortController();
      // Primitive value avoids the Deno backend's existing object identity semantics.
      await kv.set(key, 'baseline');
      const handle: WatchStream<string> = kv.watch<string>([key], { signal: abort.signal });
      const iterator = handle[Symbol.asyncIterator]();
      const pending = iterator.next();
      try {
        assert(handle.ready);
        await wait(handle.ready);
        await kv.set(key, 'changed');
        const batch = await wait(pending);
        assert(!batch.done);
        assertEquals(batch.value.map((event) => event.value), ['changed']);
        assertEquals(batch.value[0].initial, undefined);
      } finally {
        abort.abort();
        await kv.set(key, 'cleanup');
        await pending.catch(() => {});
        await iterator.return?.();
        await kv.close();
      }
    },
  });
}

// Hold the actual ioredis SUBSCRIBE command before it reaches the real server.
// Every read, write, notification, acknowledgement and decoder stays real.
async function startupWindow(initial: boolean): Promise<WatchEvent<string>[]> {
  assert(redisUrl);
  const kv = new RedisKvAdapter({ url: redisUrl, namespace: `startup-${crypto.randomUUID()}` });
  const abort = new AbortController();
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const baseline = Promise.withResolvers<void>();
  const parked = Promise.withResolvers<void>();
  const send = Redis.prototype.sendCommand;
  const subscribe = stub(Redis.prototype, 'sendCommand', function (command, ...args) {
    if (command.name !== 'subscribe') return send.call(this, command, ...args);
    entered.resolve();
    return release.promise.then(() => send.call(this, command, ...args));
  });
  const getMany = kv.getMany.bind(kv);
  const read = stub(kv, 'getMany', async function <T>(keys: Deno.KvKey[]) {
    const result = await getMany<T>(keys);
    baseline.resolve();
    return result;
  });
  const next = WatchBatchQueue.prototype.next;
  const queue = stub(WatchBatchQueue.prototype, 'next', function (...args) {
    parked.resolve();
    return next.apply(this, args);
  });
  let iterator: AsyncIterator<WatchEvent<string>[]> | undefined;
  let pending: Promise<IteratorResult<WatchEvent<string>[]>> | undefined;
  try {
    await kv.set(key, 'before');
    iterator = kv.watch<string>([key], { initial, signal: abort.signal })[Symbol.asyncIterator]();
    pending = iterator.next();
    await wait(entered.promise);
    // The consumer loads while SUBSCRIBE is pending; this subsequent write has no recipient.
    assertEquals((await kv.get(key))?.value, 'before');
    await kv.set(key, 'startup-write');
    release.resolve();
    await wait(baseline.promise);
    // On main the watch parks without delivering its baseline. End it through abort,
    // using queue arrival as the event signal rather than a timing assumption.
    const first = await wait(Promise.race([
      pending.then((result) => ({ result })),
      parked.promise.then(() => ({ result: undefined })),
    ]));
    if (first.result) return first.result.value ?? [];
    abort.abort();
    return (await wait(pending)).value ?? [];
  } finally {
    release.resolve();
    abort.abort();
    await pending?.catch(() => {});
    await iterator?.return?.();
    queue.restore();
    read.restore();
    subscribe.restore();
    await kv.close();
  }
}

Deno.test({
  name: 'watch initial: real Redis delivers the write before SUBSCRIBE acknowledgement',
  ignore: !redisUrl,
  async fn() {
    assertEquals((await startupWindow(true)).map((event) => event.value), ['startup-write']);
  },
});

Deno.test({
  name: 'watch initial: real Redis negative control default loses the startup write',
  ignore: !redisUrl,
  async fn() {
    assertEquals(await startupWindow(false), []);
  },
});

Deno.test({
  name: 'watch initial: kvdex bridge subscribes before its first state and receives changes',
  async fn() {
    const kv = new MemoryKvAdapter();
    const bridge = new WatchableKvBridge(kv);
    await kv.set(key, 'before');
    const originalWatch = kv.watch.bind(kv);
    const watch = stub(kv, 'watch', function <T>(keys: Deno.KvKey[], options?: WatchOptions) {
      // Real memory write in the startup window: the old bridge has already read.
      void kv.set(key, 'startup-write');
      return originalWatch<T>(keys, options);
    });
    const reader = bridge.watch<string>([key, missing]).getReader();
    try {
      const first = await wait(reader.read());
      assertEquals(first.value?.map((entry) => entry.value), ['startup-write', null]);
      assertEquals(first.value?.[0].versionstamp, (await kv.get(key))?.versionstamp);
      const next = reader.read();
      await kv.set(key, 'after');
      assertEquals((await wait(next)).value?.map((entry) => entry.value), ['after', null]);
    } finally {
      watch.restore();
      await reader.cancel();
      await bridge.close();
    }
  },
});

for (const backend of backends) {
  Deno.test({
    name: `watch initial: ${backend.name} idle abort drains without a wake write`,
    ignore: backend.ignore,
    async fn() {
      const kv = await backend.make();
      const abort = new AbortController();
      const handle = kv.watch([missing], { signal: abort.signal });
      const iterator = handle[Symbol.asyncIterator]();
      const pending = iterator.next();
      try {
        assert(handle.ready);
        await wait(handle.ready);
        abort.abort();
        assertEquals((await wait(pending)).done, true);
      } finally {
        abort.abort();
        await iterator.return?.();
        await kv.close();
      }
    },
  });

  Deno.test({
    name: `watch initial: ${backend.name} abort before startup rejects readiness`,
    ignore: backend.ignore,
    async fn() {
      const kv = await backend.make();
      const abort = new AbortController();
      abort.abort();
      const handle = kv.watch([missing], { initial: true, signal: abort.signal });
      try {
        assert(handle.ready);
        const error = handle.ready.catch((error: unknown) => error);
        assertEquals((await handle[Symbol.asyncIterator]().next()).done, true);
        const reason = await wait(error);
        assert(reason instanceof DOMException);
        assertEquals(reason.name, 'AbortError');
      } finally {
        await kv.close();
      }
    },
  });
}

Deno.test('watch initial: real ioredis connection failure rejects readiness and iteration', async () => {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const port = listener.addr.port;
  listener.close();
  const kv = new RedisKvAdapter({ url: `redis://127.0.0.1:${port}` });
  const handle = kv.watch([key], { initial: true });
  assert(handle.ready);
  const readiness = handle.ready.catch((error: unknown) => error);
  try {
    const failure = await wait(
      handle[Symbol.asyncIterator]().next().catch((error: unknown) => error),
    );
    assert(failure instanceof Error);
    assertEquals(await wait(readiness), failure);
  } finally {
    await kv.close();
  }
});

Deno.test({
  name: 'watch initial: real Redis queues a write racing its snapshot read',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const kv = new RedisKvAdapter({ url: redisUrl, namespace: `race-${crypto.randomUUID()}` });
    const abort = new AbortController();
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const buffered = Promise.withResolvers<void>();
    const getMany = kv.getMany.bind(kv);
    const read = stub(kv, 'getMany', async function <T>(keys: Deno.KvKey[]) {
      entered.resolve();
      await release.promise;
      return await getMany<T>(keys);
    });
    const push = WatchBatchQueue.prototype.push;
    const queue = stub(WatchBatchQueue.prototype, 'push', function (event) {
      push.call(this, event);
      buffered.resolve();
    });
    const handle = kv.watch<string>([key], { initial: true, signal: abort.signal });
    const iterator = handle[Symbol.asyncIterator]();
    const pending = iterator.next();
    try {
      await wait(entered.promise);
      assert(handle.ready);
      await wait(handle.ready);
      await kv.set(key, 'snapshot-and-change');
      await wait(buffered.promise);
      release.resolve();
      const snapshot = await wait(pending);
      assert(!snapshot.done);
      assertEquals(snapshot.value[0].initial, true);
      const change = await wait(iterator.next());
      assert(!change.done);
      assertEquals(change.value[0].value, snapshot.value[0].value);
      assertEquals(change.value[0].versionstamp, snapshot.value[0].versionstamp);
      assertEquals(change.value[0].initial, undefined);
    } finally {
      release.resolve();
      abort.abort();
      await pending.catch(() => {});
      await iterator.return?.();
      queue.restore();
      read.restore();
      await kv.close();
    }
  },
});

for (const backend of backends) {
  Deno.test({
    name: `watch initial: kvdex ${backend.name} preserves the full entry array through deletion`,
    ignore: backend.ignore,
    async fn() {
      const kv = await backend.make();
      await kv.set(key, 'present');
      const reader = new WatchableKvBridge(kv).watch<string>([key, missing]).getReader();
      try {
        const first = await wait(reader.read());
        assertEquals(first.value?.map((entry) => entry.value), ['present', null]);
        const next = reader.read();
        await kv.delete(key);
        const deleted = await wait(next);
        assertEquals(deleted.value?.map((entry) => entry.value), [null, null]);
        assertEquals(deleted.value?.map((entry) => entry.versionstamp), [null, null]);
        assertEquals(deleted.value?.map((entry) => entry.key), [key, missing]);
      } finally {
        await reader.cancel();
        await kv.close();
      }
    },
  });
}

Deno.test('watch initial: lazy adapter forwards subscription readiness and snapshots', async () => {
  const { createLazyKv } = await import('../mod.ts');
  const { registerKvAdapter, resetKv } = await import('../application/mod.ts');
  await resetKv();
  const memory = new MemoryKvAdapter();
  registerKvAdapter('redis', () => memory);
  const kv = createLazyKv({ provider: 'redis', redisUrl: 'redis://explicit-config.test' });
  const abort = new AbortController();
  await kv.set(key, 'lazy');
  const handle = kv.watch<string>([key], { initial: true, signal: abort.signal });
  const iterator = handle[Symbol.asyncIterator]();
  const pending = iterator.next();
  try {
    assert(handle.ready);
    await wait(handle.ready);
    const batch = await wait(pending);
    assert(!batch.done);
    assertEquals(batch.value[0].value, 'lazy');
    assertEquals(batch.value[0].initial, true);
  } finally {
    abort.abort();
    await iterator.return?.();
    await resetKv();
  }
});
