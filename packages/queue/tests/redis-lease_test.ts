import { assert, assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { RedisDeadLetterStore } from '../adapters/redis-dead-letter-store.ts';
import { bounded, leaseBackends, LeaseHarness, until } from './_fixtures/redis-lease-harness.ts';

Deno.test({
  name: 'CI requires a real Redis backend for queue visibility regressions',
  ignore: !Deno.env.get('CI'),
  fn() {
    assert(Deno.env.get('NETSCRIPT_TEST_REDIS_URL'));
  },
});

for (const [backend, url] of leaseBackends) {
  for (const stopped of [false, true]) {
    Deno.test({
      name: `${backend} ${
        stopped ? 'stopped' : 'killed'
      } process claim is recovered by a new process with delivery count 2`,
      ignore: !url,
      async fn() {
        assert(url);
        await using harness = new LeaseHarness(url);
        const queue = harness.queue();
        await queue.enqueue({ id: 'restart' }, { headers: { traceparent: 'preserved' } });
        const first = harness.worker(stopped ? 'stop' : 'hold');
        const claim = await first.delivered();
        assertEquals(claim.deliveryCount, 1);
        if (stopped) await first.finished();
        else await first.kill();
        const replacement = harness.worker('once');
        assertEquals(await replacement.delivered(), { ...claim, deliveryCount: 2 });
        await replacement.finished();
        const health = await queue.getHealth();
        assertEquals(health.reclaimed, 1);
        assertEquals(health.processing, 0);
        assertEquals(health.ready, 0);
      },
    });
  }

  Deno.test({
    name: `${backend} repeated worker death dead-letters exactly after N deliveries`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      await queue.enqueue({ id: 'crash-loop' });
      let messageId = '';
      for (let delivery = 1; delivery <= 3; delivery++) {
        const worker = harness.worker('hold', 150, 3);
        const claim = await worker.delivered();
        assertEquals(claim.deliveryCount, delivery);
        messageId ||= claim.messageId;
        assertEquals(claim.messageId, messageId);
        await worker.kill();
      }
      const store = new RedisDeadLetterStore({ commands: harness.client, queueName: harness.name });
      await until(async () => {
        await queue.reclaimExpired();
        return await store.depth() === 1;
      });
      const [record] = await store.list();
      assertEquals(record.messageId, messageId);
      assertEquals(record.deliveryCount, 3);
      assertEquals(record.reason, 'max_attempts_exceeded');
      assertEquals(record.payload, { id: 'crash-loop' });
      const health = await queue.getHealth();
      assertEquals(health.reclaimed, 2);
      assertEquals(health.deadLettered, 1);
      assertEquals(health.processing, 0);
      assertEquals(health.deadLetterDepth, 1);
      assertEquals(health.ready, 0);
    },
  });

  Deno.test({
    name:
      `${backend} heartbeat prevents a long job from being reclaimed and expiry resumes after worker death`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      await queue.enqueue({ id: 'long' });
      const worker = harness.worker('heartbeat');
      const claim = await worker.delivered();
      const untilTime = Date.now() + 700;
      while (Date.now() < untilTime) {
        await queue.reclaimExpired();
        assert(!worker.exited, 'Heartbeat consumer remains alive');
        assertEquals((await queue.getHealth()).reclaimed, 0);
        assertEquals((await queue.getHealth()).processing, 1);
        await delay(30);
      }
      await worker.kill();
      const replacement = harness.worker('once');
      assertEquals(await replacement.delivered(), { ...claim, deliveryCount: 2 });
      await replacement.finished();
      assertEquals((await queue.getMetrics()).reclaimed, 1);
    },
  });

  Deno.test({
    name: `${backend} explicit requeue nacks persist delivery count and stop at the delivery limit`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      await queue.enqueue({ id: 'poison' });
      const counts: number[] = [];
      const complete = Promise.withResolvers<void>();
      const { done, controller } = harness.listen(queue, async (_message, context) => {
        counts.push(context.deliveryCount);
        await context.nack({ requeue: true, errorMessage: 'keeps failing' });
        if (counts.length === 3) {
          controller.abort();
          complete.resolve();
        }
      }, { maxDeliveries: 3, visibilityTimeout: 500 });
      await bounded(complete.promise);
      await done;
      assertEquals(counts, [1, 2, 3]);
      const store = new RedisDeadLetterStore({ commands: harness.client, queueName: harness.name });
      const [record] = await store.list();
      assertEquals(record.deliveryCount, 3);
      assertEquals(record.reason, 'max_attempts_exceeded');
      assertEquals(record.errorMessage, 'keeps failing');
      assertEquals((await queue.getMetrics()).deadLettered, 1);
    },
  });
}
