import { SagaEventFeedError } from '../../src/domain/mod.ts';
import { assert, assertEquals, assertInstanceOf, assertRejects } from '@std/assert';
import { spy, stub } from '@std/testing/mock';
import { KvSagaEventFeed } from '../../src/adapters/mod.ts';
import { backends, cursor, event, next, storage } from '../fixtures/event-feed-backends.ts';

const headKey = ['saga', 'event-feed', 'v1', 'head'];

for (const backend of backends) {
  Deno.test(`event feed ${backend}: concurrent writers, independent readers and stable replay`, async () => {
    await using kv = await storage(backend);
    const first = new KvSagaEventFeed(kv);
    const second = new KvSagaEventFeed(kv);
    const fast = first.subscribe();
    const slow = second.subscribe();
    try {
      assertEquals(await next(fast), { type: 'ready' });
      assertEquals(await next(slow), { type: 'ready' });
      const written = await Promise.all(
        Array.from({ length: 20 }, (_, i) => (i % 2 ? first : second).append(event(i))),
      );
      const ordered = [...written].sort((a, b) =>
        Number(a.id.split(':')[1]) - Number(b.id.split(':')[1])
      );
      assertEquals(new Set(written.map((entry) => entry.id.split(':')[0])).size, 1);
      for (const entry of ordered) assertEquals(await next(fast), { type: 'event', ...entry });
      for (const entry of ordered) assertEquals(await next(slow), { type: 'event', ...entry });
      const replay = new KvSagaEventFeed(kv).subscribe({ afterId: ordered[9].id });
      try {
        assertEquals(await next(replay), { type: 'ready' });
        for (const entry of ordered.slice(10)) {
          assertEquals(await next(replay), { type: 'event', ...entry });
        }
        const tail = await second.append(event(99));
        assertEquals(await next(replay), { type: 'event', ...tail });
      } finally {
        await replay.return(undefined);
      }
    } finally {
      await fast.return(undefined);
      await slow.return(undefined);
    }
  });

  Deno.test(`event feed ${backend}: retention is 257 keys and exact replay boundary is valid`, async () => {
    await using kv = await storage(backend);
    const feed = new KvSagaEventFeed(kv);
    let epoch = '';
    for (let i = 1; i <= 300; i++) epoch = (await feed.append(event(i))).id.split(':')[0];
    let count = 0;
    for await (const _entry of kv.list({ prefix: ['saga', 'event-feed', 'v1'] })) count++;
    assertEquals(count, 257);
    const replay = feed.subscribe({ afterId: cursor(epoch, 44) });
    try {
      await next(replay);
      for (let i = 45; i <= 300; i++) {
        const item = await next(replay);
        assert(item.type === 'event');
        assertEquals(item.id, cursor(epoch, i));
        assertEquals(item.event.data?.ordinal, i);
      }
    } finally {
      await replay.return(undefined);
    }
    const lost = feed.subscribe({ afterId: cursor(epoch, 43) });
    const error = await assertRejects(() => lost.next(), SagaEventFeedError);
    assertEquals(error.reason, 'history-lost');
    assertEquals(error.oldestId, cursor(epoch, 45));
    assertEquals(error.latestId, cursor(epoch, 300));
  });

  Deno.test(`event feed ${backend}: invalid, foreign, reset and corrupt cursors fail distinctly`, async () => {
    await using kv = await storage(backend);
    const feed = new KvSagaEventFeed(kv);
    const entry = await feed.append(event(1));
    const epoch = entry.id.split(':')[0];
    for (
      const bad of [
        '1',
        cursor(epoch, 2),
        cursor(epoch, -1),
        `${epoch}:01`,
        `${epoch}:1:2`,
        `${epoch}:${Number.MAX_SAFE_INTEGER + 1}`,
        'x'.repeat(101),
      ]
    ) {
      const error = await assertRejects(
        () => feed.subscribe({ afterId: bad }).next(),
        SagaEventFeedError,
      );
      assertEquals(error.reason, 'invalid-cursor', bad);
    }
    const foreign = await assertRejects(
      () => feed.subscribe({ afterId: cursor(crypto.randomUUID(), 1) }).next(),
      SagaEventFeedError,
    );
    assertEquals(foreign.reason, 'history-lost');
    await kv.delete(headKey);
    const reset = await assertRejects(
      () => feed.subscribe({ afterId: entry.id }).next(),
      SagaEventFeedError,
    );
    assertEquals(reset.reason, 'history-lost');
    const recreated = await feed.append(event(2));
    assert(recreated.id.split(':')[0] !== epoch);
    await kv.set(headKey, { format: 1, epoch, sequence: 'corrupt' });
    const corrupt = await assertRejects(() => feed.append(event(3)), SagaEventFeedError);
    assertEquals(corrupt.reason, 'unavailable');
    await kv.set(headKey, { format: 1, epoch, sequence: Number.MAX_SAFE_INTEGER });
    assertEquals(
      (await assertRejects(() => feed.append(event(3)), SagaEventFeedError)).reason,
      'unavailable',
    );
  });

  Deno.test(`event feed ${backend}: detached events and large per-record values`, async () => {
    await using kv = await storage(backend);
    const feed = new KvSagaEventFeed(kv);
    const payload = { ordinal: 1 };
    const first = await feed.append({ ...event(1), data: payload });
    payload.ordinal = 999;
    const returned = first.event.data;
    if (returned) Reflect.set(returned, 'ordinal', 888);
    for (let i = 2; i <= 12; i++) await feed.append(event(i, 'x'.repeat(16_384)));
    const replay = feed.subscribe({ afterId: cursor(first.id.split(':')[0], 0) });
    try {
      await next(replay);
      const original = await next(replay);
      assert(original.type === 'event');
      assertEquals(original.event.data?.ordinal, 1);
      for (let i = 2; i <= 12; i++) {
        const item = await next(replay);
        assert(item.type === 'event');
        assertEquals(item.event.data?.payload, 'x'.repeat(16_384));
      }
    } finally {
      await replay.return(undefined);
    }
  });
}

Deno.test('event feed only retries explicit CAS conflicts, never ambiguous native failure', async () => {
  await using kv = await storage('memory');
  const feed = new KvSagaEventFeed(kv);
  {
    using busy = stub(kv, 'atomic', () => Promise.resolve({ ok: false, versionstamp: null }));
    assertEquals(
      (await assertRejects(() => feed.append(event(1)), SagaEventFeedError)).reason,
      'unavailable',
    );
    assertEquals(busy.calls.length, 64);
  }
  const cause = new Error('unknown commit outcome');
  using failed = stub(kv, 'atomic', () => Promise.reject(cause));
  const error = await assertRejects(() => feed.append(event(2)), SagaEventFeedError);
  assertInstanceOf(error, SagaEventFeedError);
  assertEquals(error.cause, cause);
  assertEquals(failed.calls.length, 1);
});

Deno.test('append abort abandons backend IO without closing host KV or retrying', async () => {
  await using kv = await storage('memory');
  const controller = new AbortController();
  const pending = Promise.withResolvers<never>();
  using commits = stub(kv, 'atomic', () => pending.promise);
  using closes = spy(kv, 'close');
  const operation = new KvSagaEventFeed(kv).append(event(1), { signal: controller.signal });
  while (commits.calls.length === 0) await Promise.resolve();
  controller.abort(new Error('stop waiting'));
  await assertRejects(() => operation, Error, 'stop waiting');
  assertEquals(commits.calls.length, 1);
  assertEquals(closes.calls.length, 0);
  pending.reject(new Error('late native failure'));
});
