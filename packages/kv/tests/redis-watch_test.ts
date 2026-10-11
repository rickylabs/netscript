import { assert, assertEquals } from '@std/assert';
import { deadline } from '@std/async';
import { stub } from '@std/testing/mock';
import { RedisKvAdapter } from '../redis.ts';
import { WatchBatchQueue } from '../adapters/redis/watch-batch-queue.ts';
import type { KvKey, KvListOptions, WatchEvent } from '../mod.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');
const A: KvKey = ['prepared', 'session'];
const B: KvKey = ['prepared', 'repository'];
const TIMEOUT_MS = 5_000;

function fixture() {
  assert(redisUrl, 'real Redis is required');
  const kv = new RedisKvAdapter({ url: redisUrl, namespace: `watch-${crypto.randomUUID()}` });
  const controller = new AbortController();
  return { kv, controller };
}

// Queue entry proves subscription acknowledgement, handler installation and
// baseline reads finished, without a sleep or consumer polling loop.
async function open(kv: RedisKvAdapter, key: KvKey, signal: AbortSignal) {
  const waiting = Promise.withResolvers<void>();
  const original = WatchBatchQueue.prototype.next;
  const nextStub = stub(WatchBatchQueue.prototype, 'next', function (debounce, signal) {
    waiting.resolve();
    return original.call(this, debounce, signal);
  });
  const iterator = kv.watch([key], { signal })[Symbol.asyncIterator]();
  const pending = iterator.next();
  try {
    await deadline(waiting.promise, TIMEOUT_MS);
    return { iterator, pending };
  } finally {
    nextStub.restore();
  }
}

async function values(pending: Promise<IteratorResult<WatchEvent[]>>) {
  const batch = await deadline(pending, TIMEOUT_MS);
  assert(!batch.done);
  return batch.value.map((event) => event.value);
}

Deno.test({
  name: 'Redis watch: returning one of two different-key watches preserves the other',
  ignore: !redisUrl,
  async fn() {
    const { kv, controller } = fixture();
    const watches = [];
    try {
      // Exact adopter repro: one process, two keys, return first, write second.
      watches.push(await open(kv, A, controller.signal));
      await kv.set(A, 'first');
      assertEquals(await values(watches[0].pending), ['first']);
      watches.push(await open(kv, B, controller.signal));
      await watches[0].iterator.return?.();
      await kv.set(B, 'still-live');
      assertEquals(await values(watches[1].pending), ['still-live']);
    } finally {
      controller.abort();
      await Promise.all(watches.map((watch) => watch.iterator.return?.()));
      await kv.close();
    }
  },
});

Deno.test({
  name: 'Redis watch: startup mutation after baseline read is delivered exactly once',
  ignore: !redisUrl,
  async fn() {
    const { kv, controller } = fixture();
    await kv.set(A, 'before');
    const captured = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    const buffered = Promise.withResolvers<void>();
    const originalPush = WatchBatchQueue.prototype.push;
    const pushStub = stub(WatchBatchQueue.prototype, 'push', function (event) {
      originalPush.call(this, event);
      buffered.resolve();
    });
    const original = kv.getMany.bind(kv);
    const originalGet = kv.get.bind(kv);
    const singleGetStub = stub(kv, 'get', async function <T>(key: KvKey) {
      const entry = await originalGet<T>(key);
      captured.resolve();
      await resume.promise;
      return entry;
    });
    const getStub = stub(kv, 'getMany', async function <T>(keys: KvKey[]) {
      const entry = await original<T>(keys);
      captured.resolve();
      await resume.promise;
      return entry;
    });
    const iterator = kv.watch([A], { signal: controller.signal })[Symbol.asyncIterator]();
    const pending = iterator.next();
    try {
      await deadline(captured.promise, TIMEOUT_MS);
      await kv.set(A, 'during-startup');
      await deadline(buffered.promise, TIMEOUT_MS);
      resume.resolve();
      const startup = await deadline(pending, TIMEOUT_MS);
      assert(!startup.done);
      assertEquals(startup.value.map((event) => event.value), ['during-startup']);
      // A subscribed message preceding baseline completion has no established
      // prior state. The baseline might already contain this write or a newer one.
      assertEquals(startup.value[0].previousValue, null);
      getStub.restore();
      singleGetStub.restore();
      const next = iterator.next();
      await kv.set(A, 'after');
      const after = await deadline(next, TIMEOUT_MS);
      assert(!after.done);
      assertEquals(after.value[0].value, 'after');
      assertEquals(after.value[0].previousValue, 'during-startup');
    } finally {
      resume.resolve();
      pushStub.restore();
      if (!getStub.restored) getStub.restore();
      if (!singleGetStub.restored) singleGetStub.restore();
      controller.abort();
      await iterator.return?.();
      await kv.close();
    }
  },
});

Deno.test({
  name: 'Redis watch: returning a prefix watcher preserves a fixed-key watcher',
  ignore: !redisUrl,
  async fn() {
    const { kv, controller } = fixture();
    await kv.set(A, 'snapshot');
    const prefixController = new AbortController();
    const prefix = kv.watchPrefix(['prepared'], { signal: prefixController.signal })
      [Symbol.asyncIterator]();
    const fixed = await open(kv, B, controller.signal);
    try {
      const initial = await deadline(prefix.next(), TIMEOUT_MS);
      assert(!initial.done);
      assertEquals(initial.value.value, 'snapshot');
      const pending = prefix.next();
      prefixController.abort();
      assert((await deadline(pending, TIMEOUT_MS)).done);
      await prefix.return?.();
      await kv.set(B, 'still-live');
      assertEquals(await values(fixed.pending), ['still-live']);
    } finally {
      controller.abort();
      prefixController.abort();
      await prefix.return?.();
      await fixed.iterator.return?.();
      await kv.close();
    }
  },
});

Deno.test({
  name: 'Redis watch: simultaneous first watches share a subscriber and idle abort ends both',
  ignore: !redisUrl,
  async fn() {
    const { kv, controller } = fixture();
    const waiting = Promise.withResolvers<void>();
    const original = WatchBatchQueue.prototype.next;
    let waiters = 0;
    const nextStub = stub(WatchBatchQueue.prototype, 'next', function (debounce, signal) {
      if (++waiters === 2) waiting.resolve();
      return original.call(this, debounce, signal);
    });
    const iterators = [A, B].map((key) =>
      kv.watch([key], { signal: controller.signal })[Symbol.asyncIterator]()
    );
    const pending = iterators.map((iterator) => iterator.next());
    try {
      await deadline(waiting.promise, TIMEOUT_MS);
      controller.abort();
      assertEquals((await deadline(Promise.all(pending), TIMEOUT_MS)).map((r) => r.done), [
        true,
        true,
      ]);
    } finally {
      nextStub.restore();
      controller.abort();
      await Promise.all(iterators.map((iterator) => iterator.return?.()));
      await kv.close();
    }
  },
});

for (const skipInitial of [false, true]) {
  Deno.test({
    name:
      `Redis watch: prefix startup mutation survives baseline scan (skipInitial=${skipInitial})`,
    ignore: !redisUrl,
    async fn() {
      const { kv, controller } = fixture();
      await kv.set(A, 'before');
      const captured = Promise.withResolvers<void>();
      const resume = Promise.withResolvers<void>();
      const buffered = Promise.withResolvers<void>();
      const originalPush = WatchBatchQueue.prototype.push;
      const pushStub = stub(WatchBatchQueue.prototype, 'push', function (event) {
        originalPush.call(this, event);
        buffered.resolve();
      });
      const original = kv.list.bind(kv);
      let scans = 0;
      const listStub = stub(kv, 'list', async function* <T>(options: KvListOptions) {
        assertEquals(++scans, 1, 'startup mutation must arrive through subscription, not polling');
        const entries = [];
        for await (const entry of original<T>(options)) entries.push(entry);
        captured.resolve();
        await resume.promise;
        yield* entries;
      });
      const iterator = kv.watchPrefix(['prepared'], {
        signal: controller.signal,
        skipInitial,
        pollInterval: 60_000,
      })
        [Symbol.asyncIterator]();
      const pending = iterator.next();
      try {
        await deadline(captured.promise, TIMEOUT_MS);
        await kv.set(A, 'during-startup');
        await deadline(buffered.promise, TIMEOUT_MS);
        resume.resolve();
        const change = await deadline(pending, TIMEOUT_MS);
        assert(!change.done);
        assertEquals(change.value.value, 'during-startup');
        assertEquals(change.value.versionstamp, (await kv.get(A))?.versionstamp);
      } finally {
        resume.resolve();
        pushStub.restore();
        listStub.restore();
        controller.abort();
        await iterator.return?.();
        await kv.close();
      }
    },
  });
}

Deno.test({
  name: 'Redis watch: prefix snapshot deduplicates its buffered versionstamp',
  ignore: !redisUrl,
  async fn() {
    const { kv, controller } = fixture();
    const captured = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    const original = kv.list.bind(kv);
    const listStub = stub(kv, 'list', async function* <T>(options: KvListOptions) {
      captured.resolve();
      await resume.promise;
      yield* original<T>(options);
    });
    const iterator = kv.watchPrefix(['prepared'], {
      signal: controller.signal,
      pollInterval: 60_000,
    })
      [Symbol.asyncIterator]();
    const pending = iterator.next();
    try {
      await deadline(captured.promise, TIMEOUT_MS);
      await kv.set(A, 'snapshot-and-message');
      resume.resolve();
      const initial = await deadline(pending, TIMEOUT_MS);
      assert(!initial.done);
      assertEquals(initial.value.value, 'snapshot-and-message');
      const next = iterator.next();
      await kv.set(A, 'after');
      const change = await deadline(next, TIMEOUT_MS);
      assert(!change.done);
      assertEquals(change.value.value, 'after');
    } finally {
      resume.resolve();
      listStub.restore();
      controller.abort();
      await iterator.return?.();
      await kv.close();
    }
  },
});
