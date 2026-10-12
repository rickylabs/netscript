import { assert, assertEquals } from '@std/assert';
import { deadline } from '@std/async';
import { stub } from '@std/testing/mock';
import { ulid } from '@std/ulid';
import { createLazyKv, DenoKvAdapter, MemoryKvAdapter } from '../mod.ts';
import type { KvKey, WatchableKv, WatchEvent, WatchOptions } from '../mod.ts';
import { resetKv } from '../application/mod.ts';
import { RedisKvAdapter } from '../redis.ts';
import { WatchableKvBridge } from '../adapters/denokv-bridge.ts';
import { runWatchableKvContract } from '../src/testing/mod.ts';

const key = ['confirm', 'state'];
const wait = <T>(promise: Promise<T>): Promise<T> => deadline(promise, 5_000);

Deno.test('watch confirm: a later cross-process write with a lower ULID is reconciled', async () => {
  const time = 1_900_000_000_000;
  const [lower, higher] = [ulid(time), ulid(time)].sort();
  assert(lower < higher);
  const kv = new MemoryKvAdapter();
  let versionstamp = ulid(time - 1);
  const originalGet = kv.get.bind(kv);
  let reads = 0;
  const get = stub(kv, 'get', async function <T>(requested: KvKey) {
    reads++;
    assertEquals(requested, key, 'only the affected key is read');
    const entry = await originalGet<T>(requested);
    return entry ? { ...entry, versionstamp } : null;
  });
  // The portable port receives stamps from two independent ulid(t) writers.
  // Values are stored in the real memory adapter; only watch delivery/stamps
  // are controlled. This models ordering, not client failure behavior.
  const watch = stub(kv, 'watch', async function* <T>(): AsyncIterable<WatchEvent<T>[]> {
    for (
      const [value, stamp, initial] of [
        ['snapshot', versionstamp, true],
        ['A', higher, false],
        ['B-latest', lower, false],
      ] as const
    ) {
      await kv.set(key, value);
      versionstamp = stamp;
      yield [{
        key,
        value: value as T,
        type: 'set',
        versionstamp: stamp,
        timestamp: new Date(),
        ...(initial ? { initial: true as const } : {}),
      }];
    }
  });
  const reader = new WatchableKvBridge(kv).watch<string>([key]).getReader();
  try {
    const frames: unknown[] = [];
    while (true) {
      const result = await wait(reader.read());
      if (result.done) break;
      frames.push(result.value[0].value);
    }
    assertEquals(frames, ['snapshot', 'A', 'B-latest']);
    assertEquals(reads, 2);
  } finally {
    await reader.cancel();
    get.restore();
    watch.restore();
    await kv.close();
  }
});

const adapters: { name: string; make: () => WatchableKv | Promise<WatchableKv> }[] = [
  { name: 'memory', make: () => new MemoryKvAdapter() },
  { name: 'Deno KV', make: async () => new DenoKvAdapter(await Deno.openKv(':memory:')) },
  { name: 'Redis', make: () => new RedisKvAdapter({ url: 'redis://127.0.0.1:1' }) },
  {
    name: 'lazy',
    make: async () => {
      await resetKv();
      return createLazyKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
    },
  },
];
for (const adapter of adapters) {
  Deno.test(`watch confirm: ${adapter.name} return before next settles readiness`, async () => {
    const kv = await adapter.make();
    const handle = kv.watch([key]);
    assert(handle.ready);
    const readiness = handle.ready.catch((error: unknown) => error);
    const iterator = handle[Symbol.asyncIterator]();
    try {
      assert(iterator.return);
      assertEquals(await wait(iterator.return()), { done: true, value: undefined });
      const reason = await Promise.race([readiness, Promise.resolve('unresolved')]);
      assert(reason instanceof DOMException);
      assertEquals(reason.name, 'AbortError');
      assertEquals(await wait(iterator.next()), { done: true, value: undefined });
    } finally {
      await kv.close();
      if (adapter.name === 'lazy') await resetKv();
    }
  });
}

runWatchableKvContract({
  name: 'watch confirm: default delivery contract',
  make() {
    const kv = new MemoryKvAdapter();
    const originalWatch = kv.watch.bind(kv);
    const originalClose = kv.close.bind(kv);
    const watch = stub(kv, 'watch', function <T>(keys: KvKey[], options?: WatchOptions) {
      assertEquals(Object.hasOwn(options ?? {}, 'initial'), false);
      return originalWatch<T>(keys, options);
    });
    const close = stub(kv, 'close', async () => {
      await originalClose();
      watch.restore();
      close.restore();
    });
    return kv;
  },
});
