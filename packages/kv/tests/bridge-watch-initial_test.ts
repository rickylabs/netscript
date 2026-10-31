/** Third-party snapshot compatibility at the public kvdex bridge boundary. */
import { assert, assertEquals, assertRejects } from '@std/assert';
import { deadline } from '@std/async';
import { stub } from '@std/testing/mock';
import { WatchableKvBridge } from '../adapters/denokv-bridge.ts';
import { MemoryKvAdapter } from '../adapters/memory.adapter.ts';
import type { KvKey, WatchEvent, WatchOptions } from '../mod.ts';

const keys = [['third-party', 'a'], ['third-party', 'b'], ['third-party', 'missing']];
const wait = <T>(promise: Promise<T>): Promise<T> => deadline(promise, 5_000);

Deno.test('bridge fallback: plain iterable that ignores initial seeds stored keys and retains them', async () => {
  const memory = new MemoryKvAdapter();
  const reads: KvKey[][] = [];
  const kv = Object.assign(memory, {
    getMany<T>(requested: KvKey[]) {
      reads.push(requested);
      return Promise.all(requested.map((key) => memory.get<T>(key)));
    },
  });
  await kv.set(keys[0], 'a-before');
  await kv.set(keys[1], 'b-retained');
  const untouched = await kv.get(keys[1]);
  const subscribed = Promise.withResolvers<void>();
  const original = kv.watch.bind(kv);
  const watch = stub(kv, 'watch', function <T>(watched: KvKey[], options?: WatchOptions) {
    assertEquals(options?.initial, true);
    const handle = original<T>(watched, { ...options, initial: false });
    assert(handle.ready);
    void handle.ready.then(subscribed.resolve);
    // Deliberately omit the optional ready property and ignore the initial request.
    return { [Symbol.asyncIterator]: () => handle[Symbol.asyncIterator]() };
  });
  const reader = new WatchableKvBridge(kv).watch<string>(keys).getReader();
  try {
    const pending = reader.read();
    await wait(subscribed.promise);
    await kv.set(keys[0], 'first-change');
    const first = await wait(pending);
    assertEquals(first.value?.map((entry) => entry.value), ['first-change', 'b-retained', null]);
    assertEquals(first.value?.map((entry) => entry.key), keys);
    assertEquals(first.value?.map((entry) => entry.versionstamp), [
      (await kv.get(keys[0]))?.versionstamp,
      untouched?.versionstamp,
      null,
    ]);
    assertEquals(reads, [keys], 'matching first-batch stamps reuse the full baseline read');
    const next = reader.read();
    await kv.set(keys[0], 'second-change');
    assertEquals((await wait(next)).value?.map((entry) => entry.value), [
      'second-change',
      'b-retained',
      null,
    ]);
    const deleted = reader.read();
    await kv.delete(keys[0]);
    const frame = await wait(deleted);
    assertEquals(frame.value?.map((entry) => entry.value), [null, 'b-retained', null]);
    assertEquals(frame.value?.map((entry) => entry.versionstamp), [
      null,
      untouched?.versionstamp,
      null,
    ]);
    assertEquals(reads, [keys, [keys[0]], [keys[0]]], 'later frames read only affected keys');
  } finally {
    await reader.cancel();
    watch.restore();
    await kv.close();
  }
});

for (const batchRead of [false, true]) {
  Deno.test(`bridge fallback: empty first batch seeds unchanged keys with getMany=${batchRead}`, async () => {
    const kv = new MemoryKvAdapter();
    await kv.set(keys[1], 'unchanged');
    const reads: KvKey[] = [];
    const batches: KvKey[][] = [];
    const originalGet = kv.get.bind(kv);
    const read = stub(kv, 'get', function <T>(key: KvKey) {
      reads.push(key);
      return originalGet<T>(key);
    });
    if (batchRead) {
      Object.assign(kv, {
        getMany<T>(requested: KvKey[]) {
          batches.push(requested);
          return Promise.all(requested.map((key) => kv.get<T>(key)));
        },
      });
    }
    const watch = stub(kv, 'watch', function <T>(): AsyncIterable<WatchEvent<T>[]> {
      return {
        async *[Symbol.asyncIterator]() {
          yield [];
        },
      };
    });
    const reader = new WatchableKvBridge(kv).watch<string>(keys).getReader();
    try {
      assertEquals((await wait(reader.read())).value?.map((entry) => entry.value), [
        null,
        'unchanged',
        null,
      ]);
      assertEquals((await wait(reader.read())).done, true);
      assertEquals(reads, keys);
      assertEquals(batches, batchRead ? [keys] : []);
    } finally {
      await reader.cancel();
      watch.restore();
      read.restore();
      await kv.close();
    }
  });
}

Deno.test('bridge fallback: acknowledged snapshots incur no extra bridge read', async () => {
  const memory = new MemoryKvAdapter();
  await memory.set(keys[1], 'snapshot');
  const reads: KvKey[] = [];
  const originalGet = memory.get.bind(memory);
  const read = stub(memory, 'get', function <T>(key: KvKey) {
    reads.push(key);
    return originalGet<T>(key);
  });
  const batches: KvKey[][] = [];
  const kv = Object.assign(memory, {
    getMany<T>(requested: KvKey[]) {
      batches.push(requested);
      return Promise.all(requested.map((key) => memory.get<T>(key)));
    },
  });
  const reader = new WatchableKvBridge(kv).watch<string>(keys).getReader();
  try {
    assertEquals((await wait(reader.read())).value?.map((entry) => entry.value), [
      null,
      'snapshot',
      null,
    ]);
    assertEquals(batches, []);
    assertEquals(reads, keys, 'only the adapter itself reads its acknowledged snapshot');
  } finally {
    await reader.cancel();
    read.restore();
    await kv.close();
  }
});

for (const failure of [false, true]) {
  Deno.test(`bridge fallback: held baseline read handles ${failure ? 'failure' : 'cancellation'}`, async () => {
    const memory = new MemoryKvAdapter();
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const closed = Promise.withResolvers<void>();
    let signal: AbortSignal | undefined;
    const kv = Object.assign(memory, {
      async getMany<T>(requested: KvKey[]) {
        assertEquals(requested, keys, 'the full fallback read is the operation being exercised');
        entered.resolve();
        await release.promise;
        if (failure) throw new Error('baseline unavailable');
        return Promise.all(requested.map((key) => memory.get<T>(key)));
      },
    });
    const watch = stub(
      kv,
      'watch',
      function <T>(_keys: KvKey[], options?: WatchOptions): AsyncIterable<WatchEvent<T>[]> {
        signal = options?.signal;
        return {
          async *[Symbol.asyncIterator]() {
            try {
              yield [];
            } finally {
              closed.resolve();
            }
          },
        };
      },
    );
    const reader = new WatchableKvBridge(kv).watch<string>(keys).getReader();
    const pending = reader.read();
    try {
      await wait(entered.promise);
      if (failure) {
        release.resolve();
        await assertRejects(() => wait(pending), Error, 'baseline unavailable');
      } else {
        await wait(reader.cancel());
        assertEquals(signal?.aborted, true);
        await wait(closed.promise);
        release.resolve();
        assertEquals((await wait(pending)).done, true);
      }
    } finally {
      release.resolve();
      await pending.catch(() => {});
      watch.restore();
      await kv.close();
    }
  });
}
