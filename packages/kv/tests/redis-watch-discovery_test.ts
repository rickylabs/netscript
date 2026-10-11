import { assert, assertEquals } from '@std/assert';
import { stub } from '@std/testing/mock';
import { FakeTime } from '@std/testing/time';
import { RedisKvAdapter } from '../redis.ts';
import { WatchBatchQueue } from '../adapters/redis/watch-batch-queue.ts';
import { WatchSubscriptions } from '../adapters/redis/watch-subscriptions.ts';
import type { KvKey, KvListOptions } from '../mod.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');
const A: KvKey = ['busy', 'expiring'];
const B: KvKey = ['busy', 'sibling'];
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;

// A real-time failure deadline remains active while scheduling uses FakeTime.
function wait<T>(promise: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof realSetTimeout>;
  const failure = new Promise<never>((_, reject) => {
    timeout = realSetTimeout(() => reject(new Error('Redis event did not arrive')), 5_000);
  });
  return Promise.race([promise, failure]).finally(() => realClearTimeout(timeout));
}

function fixture() {
  assert(redisUrl);
  const kv = new RedisKvAdapter({ url: redisUrl, namespace: `discovery-${crypto.randomUUID()}` });
  const controller = new AbortController();
  return { kv, controller };
}

Deno.test({
  name: 'Redis watch: busy sibling writes cannot starve prefix discovery',
  ignore: !redisUrl,
  async fn() {
    const { kv, controller } = fixture();
    await kv.set(A, 'baseline');
    const originalList = kv.list.bind(kv);
    let scans = 0;
    const listStub = stub(kv, 'list', async function* <T>(options: KvListOptions) {
      scans++;
      yield* originalList<T>(options);
    });
    let waiting = Promise.withResolvers<void>();
    const originalNext = WatchBatchQueue.prototype.next;
    const nextStub = stub(WatchBatchQueue.prototype, 'next', function (...args) {
      waiting.resolve();
      return originalNext.apply(this, args);
    });
    const iterator = kv.watchPrefix(['busy'], { signal: controller.signal, pollInterval: 100 })
      [Symbol.asyncIterator]();
    let time: FakeTime | undefined;
    try {
      assertEquals((await wait(iterator.next())).value?.value, 'baseline');
      time = new FakeTime();
      // Every gap is less than pollInterval. A reset-on-message timer never scans.
      for (let index = 1; index <= 3; index++) {
        waiting = Promise.withResolvers<void>();
        const next = iterator.next();
        await wait(waiting.promise);
        time.tick(40);
        await kv.set(B, index);
        assertEquals((await wait(next)).value?.value, index);
      }
      waiting = Promise.withResolvers<void>();
      const pending = iterator.next();
      await wait(waiting.promise);
      assertEquals(scans, 2, 'discovery must run at its deadline despite matching writes');
      controller.abort();
      assert((await wait(pending)).done);
    } finally {
      controller.abort();
      await iterator.return?.();
      time?.restore();
      nextStub.restore();
      listStub.restore();
      await kv.close();
    }
  },
});

Deno.test({
  name: 'Redis watch: discovery timeout preserves debounce and emits a queued delete once',
  ignore: !redisUrl,
  async fn() {
    const { kv, controller } = fixture();
    await kv.set(A, 'baseline');
    const originalList = kv.list.bind(kv);
    let scans = 0;
    const listStub = stub(kv, 'list', async function* <T>(options: KvListOptions) {
      scans++;
      yield* originalList<T>(options);
    });
    let waiting = Promise.withResolvers<void>();
    const originalNext = WatchBatchQueue.prototype.next;
    const nextStub = stub(WatchBatchQueue.prototype, 'next', function (...args) {
      waiting.resolve();
      return originalNext.apply(this, args);
    });
    let buffered = Promise.withResolvers<void>();
    const originalPush = WatchBatchQueue.prototype.push;
    const pushStub = stub(WatchBatchQueue.prototype, 'push', function (event) {
      originalPush.call(this, event);
      buffered.resolve();
    });
    const iterator = kv.watchPrefix(['busy'], {
      signal: controller.signal,
      pollInterval: 100,
      debounce: 200,
    })[Symbol.asyncIterator]();
    let time: FakeTime | undefined;
    try {
      assertEquals((await wait(iterator.next())).value?.value, 'baseline');
      time = new FakeTime();
      const pending = iterator.next();
      await wait(waiting.promise);
      let delivered = false;
      pending.then(() => delivered = true);
      await kv.delete(A);
      await wait(buffered.promise);
      await time.runMicrotasks();
      await time.tickAsync(100);
      await time.runMicrotasks();
      assertEquals(delivered, false, 'polling cannot truncate the debounce window');
      assertEquals(scans, 1, 'queued notifications must drain before discovery');
      await time.tickAsync(100);
      const deletion = await wait(pending);
      assert(!deletion.done);
      assertEquals(deletion.value.type, 'delete');
      assert(deletion.value.versionstamp !== null, 'deliver the published delete, not a scan copy');

      waiting = Promise.withResolvers<void>();
      buffered = Promise.withResolvers<void>();
      const next = iterator.next();
      await wait(waiting.promise);
      assertEquals(scans, 2);
      await kv.set(B, 'after-delete');
      await wait(buffered.promise);
      await time.tickAsync(200);
      assertEquals((await wait(next)).value?.value, 'after-delete', 'no second delete is queued');
    } finally {
      controller.abort();
      await iterator.return?.();
      time?.restore();
      pushStub.restore();
      nextStub.restore();
      listStub.restore();
      await kv.close();
    }
  },
});

Deno.test({
  name: 'Redis watch: newer startup snapshot cannot precede an older buffered message',
  ignore: !redisUrl,
  async fn() {
    const { kv, controller } = fixture();
    const scanning = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    const firstBuffered = Promise.withResolvers<void>();
    const secondHeld = Promise.withResolvers<void>();
    const originalList = kv.list.bind(kv);
    const listStub = stub(kv, 'list', async function* <T>(options: KvListOptions) {
      scanning.resolve();
      await resume.promise;
      yield* originalList<T>(options);
    });
    const originalAcquire = WatchSubscriptions.prototype.acquire;
    let deliverSecond = () => {};
    // Delay the real V2 pub/sub notification before the watch handler sees it.
    const acquireStub = stub(WatchSubscriptions.prototype, 'acquire', function (channel, listener) {
      return originalAcquire.call(this, channel, (message) => {
        if (typeof message === 'object' && message !== null && 'value' in message) {
          if (message.value === 'v2') {
            deliverSecond = () => listener(message);
            secondHeld.resolve();
            return;
          }
          listener(message);
          if (message.value === 'v1') firstBuffered.resolve();
        }
      });
    });
    const iterator = kv.watchPrefix(['busy'], {
      signal: controller.signal,
      pollInterval: 60_000,
    })[Symbol.asyncIterator]();
    const pending = iterator.next();
    try {
      await wait(scanning.promise);
      await kv.set(A, 'v1');
      await wait(firstBuffered.promise);
      await kv.set(A, 'v2');
      await wait(secondHeld.promise);
      resume.resolve();
      assertEquals((await wait(pending)).value?.value, 'v1');
      deliverSecond();
      assertEquals((await wait(iterator.next())).value?.value, 'v2');
      const next = iterator.next();
      await kv.set(A, 'v3');
      assertEquals((await wait(next)).value?.value, 'v3');
    } finally {
      resume.resolve();
      deliverSecond();
      controller.abort();
      await iterator.return?.();
      acquireStub.restore();
      listStub.restore();
      await kv.close();
    }
  },
});
