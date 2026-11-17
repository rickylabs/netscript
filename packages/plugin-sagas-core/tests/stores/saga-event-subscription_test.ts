import { SagaEventFeedError } from '../../src/domain/mod.ts';
import { assert, assertEquals, assertRejects } from '@std/assert';
import { delay } from '@std/async';
import { spy, stub } from '@std/testing/mock';
import type { KvEntry, WatchEvent, WatchStream } from '@netscript/kv';
import { KvSagaEventFeed } from '../../src/adapters/mod.ts';
import { backends, cursor, event, next, storage } from '../fixtures/event-feed-backends.ts';

const headKey = ['saga', 'event-feed', 'v1', 'head'];

for (const backend of backends) {
  Deno.test(`event subscription ${backend}: idle watches one fixed key, never scans`, async () => {
    await using kv = await storage(backend);
    using listing = spy(kv, 'list');
    using prefix = spy(kv, 'watchPrefix');
    using watches = spy(kv, 'watch');
    const reader = new KvSagaEventFeed(kv).subscribe();
    try {
      assertEquals(await next(reader), { type: 'ready' });
      await delay(200);
      assertEquals(listing.calls.length, 0);
      assertEquals(prefix.calls.length, 0);
      assertEquals(watches.calls.length, 1);
      assertEquals(watches.calls[0].args[0], [headKey]);
      assertEquals(watches.calls[0].args[1]?.initial, true);
    } finally {
      await reader.return(undefined);
    }
  });

  Deno.test(`event subscription ${backend}: a slow reader gets an explicit gap`, async () => {
    await using kv = await storage(backend);
    const feed = new KvSagaEventFeed(kv);
    const reader = feed.subscribe();
    try {
      await next(reader);
      for (let i = 1; i <= 257; i++) await feed.append(event(i));
      const error = await assertRejects(() => next(reader), SagaEventFeedError);
      assertEquals(error.reason, 'history-lost');
      assert(error.oldestId?.endsWith(':2'));
    } finally {
      await reader.return(undefined);
    }
  });

  Deno.test(`event subscription ${backend}: returning one reader preserves another and host KV`, async () => {
    await using kv = await storage(backend);
    using closes = spy(kv, 'close');
    const feed = new KvSagaEventFeed(kv);
    const first = feed.subscribe();
    const second = feed.subscribe();
    try {
      await next(first);
      await next(second);
      await first.return(undefined);
      const entry = await feed.append(event(1));
      assertEquals(await next(second), { type: 'event', ...entry });
      assertEquals(closes.calls.length, 0);
    } finally {
      await second.return(undefined);
    }
  });

  Deno.test(`event subscription ${backend}: aborting a blocked next releases owned watch`, async () => {
    await using kv = await storage(backend);
    const controller = new AbortController();
    const reader = new KvSagaEventFeed(kv).subscribe({ signal: controller.signal });
    await next(reader);
    const pending = reader.next();
    controller.abort(new Error('reader cancelled'));
    await assertRejects(() => pending, Error, 'reader cancelled');
    await kv.set(['host', 'still-open'], true);
    assertEquals((await kv.get(['host', 'still-open']))?.value, true);
  });
}

Deno.test('subscribe-first barrier retains writes racing the initial head reread', async () => {
  await using kv = await storage('memory');
  const feed = new KvSagaEventFeed(kv);
  const get = kv.get.bind(kv);
  let reads = 0;
  using reading = stub(
    kv,
    'get',
    async <T>(key: Parameters<typeof kv.get>[0]): Promise<KvEntry<T> | null> => {
      const entry = await get<T>(key);
      // Memory's native initial watch snapshot reads first, feed's reread second.
      if (++reads === 2) await feed.append(event(1));
      return entry;
    },
  );
  const reader = feed.subscribe();
  try {
    assertEquals(await next(reader), { type: 'ready' });
    const item = await next(reader);
    assert(item.type === 'event');
    assertEquals(item.event.data?.ordinal, 1);
    assert(reading.calls.length >= 3);
  } finally {
    await reader.return(undefined);
  }
});

Deno.test('coalesced/duplicate native notifications do not duplicate records or stall slow yields', async () => {
  await using kv = await storage('memory');
  const watch = kv.watch.bind(kv);
  let batches = 0;
  using duplicate = stub(
    kv,
    'watch',
    <T>(
      keys: Parameters<typeof kv.watch>[0],
      options?: Parameters<typeof kv.watch>[1],
    ): WatchStream<T> => ({
      // A third-party handle with no ready property must use its first snapshot.
      async *[Symbol.asyncIterator]() {
        for await (const batch of watch<T>(keys, options)) {
          batches++;
          yield batch;
          yield batch;
        }
      },
    }),
  );
  const feed = new KvSagaEventFeed(kv);
  const reader = feed.subscribe();
  try {
    await next(reader);
    const one = await feed.append(event(1));
    assertEquals(await next(reader), { type: 'event', ...one });
    const entries = [];
    for (let i = 2; i <= 5; i++) entries.push(await feed.append(event(i)));
    for (const entry of entries) assertEquals(await next(reader), { type: 'event', ...entry });
    assert(batches >= 2, 'the pump must drain native notifications while consumer is paused');
    assertEquals(duplicate.calls.length, 1);
  } finally {
    await reader.return(undefined);
  }
});

for (const termination of ['end', 'error'] as const) {
  Deno.test(`unexpected native watch ${termination} is a structured unavailable failure`, async () => {
    await using kv = await storage('memory');
    const cause = new Error('watch failed');
    const watch = kv.watch.bind(kv);
    using ended = stub(
      kv,
      'watch',
      <T>(
        keys: Parameters<typeof kv.watch>[0],
        options?: Parameters<typeof kv.watch>[1],
      ): WatchStream<T> => ({
        async *[Symbol.asyncIterator](): AsyncGenerator<WatchEvent<T>[]> {
          for await (const batch of watch<T>(keys, options)) {
            yield batch;
            if (termination === 'error') throw cause;
            return;
          }
        },
      }),
    );
    const reader = new KvSagaEventFeed(kv).subscribe();
    try {
      // Failure can race the initial ready item; neither path may hang or reset live.
      const first = await reader.next();
      assertEquals(first.value, { type: 'ready' });
      await assertRejects(() => reader.next(), SagaEventFeedError);
    } catch (error) {
      assert(error instanceof SagaEventFeedError);
      assertEquals(error.reason, 'unavailable');
      if (termination === 'error') assertEquals(error.cause, cause);
    } finally {
      await reader.return(undefined);
    }
    assertEquals(ended.calls.length, 1);
  });
}

Deno.test('missing and concurrently overwritten slots never produce incomplete replay', async () => {
  await using kv = await storage('deno-kv');
  const feed = new KvSagaEventFeed(kv);
  const one = await feed.append(event(1));
  await feed.append(event(2));
  await kv.delete(['saga', 'event-feed', 'v1', 'slot', 1]);
  const missing = feed.subscribe({ afterId: one.id });
  await next(missing);
  assertEquals(
    (await assertRejects(() => next(missing), SagaEventFeedError)).reason,
    'history-lost',
  );
  await feed.append(event(3));
  const getMany = kv.getMany!.bind(kv);
  using overwritten = stub(
    Object.assign(kv, { getMany }),
    'getMany',
    async <T>(keys: Parameters<typeof getMany>[0]): Promise<(KvEntry<T> | null)[]> => {
      for (let i = 4; i <= 260; i++) await feed.append(event(i));
      return await getMany<T>(keys);
    },
  );
  const reader = feed.subscribe({ afterId: cursor(one.id.split(':')[0], 2) });
  await next(reader);
  assertEquals(
    (await assertRejects(() => next(reader), SagaEventFeedError)).reason,
    'history-lost',
  );
  assertEquals(overwritten.calls.length, 1);
});

Deno.test('abort during readiness and head IO releases watch without closing shared KV', async () => {
  for (const boundary of ['ready', 'head']) {
    await using kv = await storage('memory');
    const watch = kv.watch.bind(kv);
    const get = kv.get.bind(kv);
    const entered = Promise.withResolvers<void>();
    const blocked = Promise.withResolvers<never>();
    using watching = stub(
      kv,
      'watch',
      <T>(
        keys: Parameters<typeof kv.watch>[0],
        options?: Parameters<typeof kv.watch>[1],
      ): WatchStream<T> => {
        const native = watch<T>(keys, options);
        if (boundary === 'ready') {
          entered.resolve();
          return {
            [Symbol.asyncIterator]: () => native[Symbol.asyncIterator](),
            ready: blocked.promise,
          };
        }
        return native;
      },
    );
    let reads = 0;
    using reading = stub(
      kv,
      'get',
      <T>(key: Parameters<typeof kv.get>[0]): Promise<KvEntry<T> | null> => {
        if (boundary === 'head' && ++reads === 2) {
          entered.resolve();
          return blocked.promise;
        }
        return get<T>(key);
      },
    );
    const controller = new AbortController();
    const reader = new KvSagaEventFeed(kv).subscribe({ signal: controller.signal });
    const pending = reader.next();
    await entered.promise;
    controller.abort(new Error('stop subscription'));
    await assertRejects(() => pending, Error, 'stop subscription');
    blocked.reject(new Error('late IO'));
    assertEquals(watching.calls.length, 1);
    assert(reading.calls.length >= 1);
  }
});

Deno.test('unsupported custom KV capabilities fail explicitly', async () => {
  await using kv = await storage('memory');
  Reflect.set(kv, 'atomic', undefined);
  const feed = new KvSagaEventFeed(kv);
  assertEquals(
    (await assertRejects(() => feed.append(event(1)), SagaEventFeedError)).reason,
    'unavailable',
  );
  assertEquals(
    (await assertRejects(() => feed.subscribe().next(), SagaEventFeedError)).reason,
    'unavailable',
  );
});
