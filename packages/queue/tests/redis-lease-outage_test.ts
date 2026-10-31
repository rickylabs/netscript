import { assert, assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { RedisAdapter } from '../adapters/redis.adapter.ts';
import { bounded, leaseBackends, LeaseHarness, until } from './_fixtures/redis-lease-harness.ts';
import { LeaseProxy } from './_fixtures/redis-lease-proxy.ts';

for (const [backend, url] of leaseBackends) {
  Deno.test({
    name: `${backend} an open connection with missing replies does not terminate consumption`,
    ignore: !url,
    async fn() {
      assert(url);
      await using proxy = new LeaseProxy(new URL(url));
      await using harness = new LeaseHarness(url);
      const producer = harness.queue();
      const consumer = new RedisAdapter(proxy.url, harness.name);
      harness.queues.push(consumer);
      const first = Promise.withResolvers<void>();
      const second = Promise.withResolvers<void>();
      let terminated = false;
      const { done, controller } = harness.listen(consumer, async (message, context) => {
        await context.ack();
        if (message === 'before') first.resolve();
        else second.resolve();
      });
      void done.then(() => terminated = true, () => terminated = true);
      await producer.enqueue('before');
      await bounded(first.promise);
      proxy.stalled = true;
      await delay(7_000);
      assertEquals(terminated, false, 'ioredis Command timed out must remain retryable');
      proxy.stalled = false;
      await producer.enqueue('after');
      await bounded(second.promise, 10_000);
      controller.abort();
      await bounded(done);
    },
  });

  Deno.test({
    name:
      `${backend} an outage during a handler preserves consumption and expired work is redelivered`,
    ignore: !url,
    async fn() {
      assert(url);
      await using proxy = new LeaseProxy(new URL(url));
      await using harness = new LeaseHarness(url);
      const producer = harness.queue();
      const consumer = new RedisAdapter(proxy.url, harness.name);
      harness.queues.push(consumer);
      const entered = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const after = Promise.withResolvers<void>();
      const deliveries: number[] = [];
      let terminated = false;
      const { done, controller } = harness.listen(consumer, async (message, context) => {
        if (message === 'before') {
          deliveries.push(context.deliveryCount);
          if (context.deliveryCount === 1) {
            entered.resolve();
            await release.promise;
          }
        } else {
          await context.ack();
          after.resolve();
        }
      }, { visibilityTimeout: 200, recoveryGrace: 20 });
      void done.then(() => terminated = true, () => terminated = true);
      try {
        await producer.enqueue('before');
        await bounded(entered.promise);
        proxy.drop();
        await delay(50);
        release.resolve();
        await delay(4_000);
        assertEquals(terminated, false, 'automatic settlement must ride out availability loss');
        proxy.enabled = true;
        await producer.enqueue('after');
        await bounded(after.promise);
        await until(async () =>
          deliveries.includes(2) && (await producer.getHealth()).processing === 0
        );
        assertEquals(deliveries, [1, 2]);
        controller.abort();
        await bounded(done);
      } finally {
        release.resolve();
      }
    },
  });

  Deno.test({
    name: `${backend} listener survives an outage longer than its bounded command retry budget`,
    ignore: !url,
    async fn() {
      assert(url);
      await using proxy = new LeaseProxy(new URL(url));
      await using harness = new LeaseHarness(url);
      const producer = harness.queue();
      const consumer = new RedisAdapter(proxy.url, harness.name);
      harness.queues.push(consumer);
      const first = Promise.withResolvers<void>();
      const second = Promise.withResolvers<void>();
      let finished = false;
      const { done, controller } = harness.listen(consumer, async (message, context) => {
        await context.ack();
        if (message === 'before') first.resolve();
        else if (message === 'after') second.resolve();
      });
      void done.then(() => finished = true, () => finished = true);
      await producer.enqueue('before');
      await bounded(first.promise);
      proxy.drop();
      await delay(4_000);
      assertEquals(finished, false, 'availability loss must not terminate the consumer');
      proxy.enabled = true;
      await producer.enqueue('after');
      await bounded(second.promise);
      controller.abort();
      await bounded(done);
      assertEquals((await producer.getHealth()).processing, 0);
    },
  });

  Deno.test({
    name: `${backend} abort interrupts availability retries during listener startup`,
    ignore: !url,
    async fn() {
      assert(url);
      await using proxy = new LeaseProxy(new URL(url));
      proxy.enabled = false;
      await using harness = new LeaseHarness(url);
      const consumer = new RedisAdapter(proxy.url, harness.name);
      harness.queues.push(consumer);
      const { done, controller } = harness.listen(consumer, () => Promise.resolve());
      await delay(150);
      controller.abort();
      await bounded(done, 2_000);
      assertEquals(consumer['listening'], false);
      assertEquals(consumer['leaseTimer'], undefined);
    },
  });
}
