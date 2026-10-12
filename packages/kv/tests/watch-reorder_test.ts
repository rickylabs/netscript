import { assert, assertEquals } from '@std/assert';
import { deadline } from '@std/async';
import { stub } from '@std/testing/mock';
import { DenoKvAdapter, MemoryKvAdapter } from '../mod.ts';
import type { KvKey, WatchEvent, WatchOptions } from '../mod.ts';
import { WatchableKvBridge } from '../adapters/denokv-bridge.ts';
import { runWatchableKvContract } from '../src/testing/mod.ts';

const key = ['reorder', 'state'];
const wait = <T>(promise: Promise<T>): Promise<T> => deadline(promise, 5_000);

Deno.test('watch reorder: a later higher-stamped publish cannot overwrite the stored write', async () => {
  const kv = new MemoryKvAdapter();
  await kv.set(key, 'W2');
  const storedStamp = '01ARZ3NDEKTSV4RRFFQ69G5FAA';
  const staleStamp = '01ARZ3NDEKTSV4RRFFQ69G5FZZ';
  const originalGet = kv.get.bind(kv);
  let reads = 0;
  const get = stub(kv, 'get', async function <T>(requested: KvKey) {
    assertEquals(requested, key);
    reads++;
    const entry = await originalGet<T>(requested);
    return entry ? { ...entry, versionstamp: storedStamp } : null;
  });
  // Storage is real; the portable event port models cross-process publication
  // order independently from commit order, not client failure behavior.
  const watch = stub(kv, 'watch', async function* <T>(): AsyncIterable<WatchEvent<T>[]> {
    for (
      const [value, versionstamp, initial] of [
        ['snapshot', '01ARZ3NDEKTSV4RRFFQ69G5F00', true],
        ['W2', storedStamp, false],
        ['W1', staleStamp, false],
      ] as const
    ) {
      yield [{
        key,
        value: value as T,
        versionstamp,
        type: 'set',
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
    assertEquals(frames, ['snapshot', 'W2']);
    assertEquals(reads, 2, 'each distinct non-duplicate change batch reads the key once');
    assertEquals((await originalGet(key))?.value, 'W2');
  } finally {
    await reader.cancel();
    watch.restore();
    get.restore();
    await kv.close();
  }
});

Deno.test('watch reorder: one batched read covers only distinct affected keys', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const other = ['reorder', 'other'];
  const idle = ['reorder', 'idle'];
  for (const watched of [key, other, idle]) await kv.set(watched, 'before');
  const snapshot = await kv.getMany<string>([key, other, idle]);
  const originalRead = kv.getMany.bind(kv);
  const requests: KvKey[][] = [];
  const read = stub(kv, 'getMany', function <T>(keys: KvKey[]) {
    requests.push(keys);
    return originalRead<T>(keys);
  });
  const watch = stub(kv, 'watch', async function* <T>(): AsyncIterable<WatchEvent<T>[]> {
    yield snapshot.map((entry) => {
      assert(entry);
      return {
        ...entry,
        value: entry.value as T,
        type: 'set' as const,
        timestamp: new Date(),
        initial: true as const,
      };
    });
    await kv.set(key, 'latest');
    await kv.set(other, 'other-latest');
    yield [key, key, other].map((changed, index) => ({
      key: changed,
      value: 'stale-payload' as T,
      versionstamp: `event-${index}`,
      type: 'set' as const,
      timestamp: new Date(),
    }));
  });
  const reader = new WatchableKvBridge(kv).watch<string>([key, other, idle]).getReader();
  try {
    assertEquals((await wait(reader.read())).value?.map((entry) => entry.value), [
      'before',
      'before',
      'before',
    ]);
    assertEquals((await wait(reader.read())).value?.map((entry) => entry.value), [
      'latest',
      'other-latest',
      'before',
    ]);
    assertEquals(await wait(reader.read()), { value: undefined, done: true });
    assertEquals(
      requests,
      [[key, other]],
      'no snapshot read, duplicate key read, or idle key read',
    );
  } finally {
    await reader.cancel();
    watch.restore();
    read.restore();
    await kv.close();
  }
});

runWatchableKvContract({
  name: 'watch reorder: legacy adapter without optional features',
  make() {
    const kv = new MemoryKvAdapter();
    const originalWatch = kv.watch.bind(kv);
    const originalClose = kv.close.bind(kv);
    let handles = 0;
    const watch = stub(kv, 'watch', function <T>(keys: KvKey[], options?: WatchOptions) {
      handles++;
      assertEquals(Object.hasOwn(options ?? {}, 'initial'), false);
      const handle = originalWatch<T>(keys, options);
      return { [Symbol.asyncIterator]: () => handle[Symbol.asyncIterator]() };
    });
    const close = stub(kv, 'close', async () => {
      try {
        await originalClose();
        assertEquals(handles, 1);
      } finally {
        watch.restore();
        close.restore();
      }
    });
    return kv;
  },
});
