import { assert, assertEquals, assertRejects } from '@std/assert';
import { delay } from '@std/async';
import { stub } from '@std/testing/mock';
import { createEnvelope } from '../adapters/_envelope.ts';
import { bounded, leaseBackends, LeaseHarness, until } from './_fixtures/redis-lease-harness.ts';

for (const [backend, url] of leaseBackends) {
  Deno.test({
    name:
      `${backend} dangling deadline entries cannot starve live expired claims behind a full page`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      const leases = queue['ensureLeases']();
      leases.configure({ visibilityTimeout: 30, recoveryGrace: 0 });
      await queue.enqueue('after-dangling-index');
      const claim = await leases.claim();
      assert(claim);
      const index = `netscript:leases:${harness.name}`;
      for (let i = 0; i < 100; i++) {
        await harness.client.zadd(index, 0, `netscript:lease:${harness.name}:missing-${i}`);
      }
      await until(async () => {
        await queue.reclaimExpired();
        return (await queue.getHealth()).ready === 1;
      });
      assertEquals((await queue.getMetrics()).reclaimed, 1);
      assertEquals(await harness.client.zcard(index), 0);
    },
  });

  Deno.test({
    name: `${backend} expiry grace and stale receipts cannot settle a replacement delivery`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      const leases = queue['ensureLeases']();
      leases.configure({ visibilityTimeout: 80, recoveryGrace: 200 });
      await queue.enqueue({ id: 'fenced' });
      const first = await leases.claim();
      assert(first);
      await until(() => Promise.resolve(Date.now() > first.deadline));
      assertEquals(await leases.extend(first), false);
      await leases.settle(first);
      assertEquals(await queue.reclaimExpired(), 0, 'grace delays recovery, not stale ownership');
      assertEquals((await queue.getHealth()).processing, 1);
      await until(async () => {
        await queue.reclaimExpired();
        return (await queue.getHealth()).ready === 1;
      });
      const second = await leases.claim();
      assert(second);
      assertEquals(second.envelope.deliveryCount, 2);
      await leases.settle(first, { requeue: false });
      assertEquals(await leases.extend(first), false);
      assertEquals((await queue.getHealth()).processing, 1);
      await leases.settle(second);
      assertEquals((await queue.getMetrics()).staleSettlements, 4);
      assertEquals((await queue.getHealth()).deadLetterDepth, 0);
    },
  });

  Deno.test({
    name:
      `${backend} competing reclaimers requeue once and recheck heartbeat after reading a fence`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      const leases = queue['ensureLeases']();
      leases.configure({ visibilityTimeout: 100, recoveryGrace: 0 });
      await queue.enqueue('race');
      const first = await leases.claim();
      assert(first);
      assertEquals(await leases.extend(first, 250), true);
      await until(() => Promise.resolve(Date.now() > first.deadline + 10));
      assertEquals(
        await leases['connection'].transition(leases['keys'](first.key), {
          op: 'reclaim',
          fence: first.fence,
        }),
        0,
        'a previously read fence must still respect the updated deadline',
      );
      await delay(250);
      await Promise.all(Array.from({ length: 8 }, () => harness.queue().reclaimExpired()));
      assertEquals((await queue.getHealth()).ready, 1);
      assertEquals((await queue.getMetrics()).reclaimed, 1);
    },
  });

  Deno.test({
    name:
      `${backend} mixed legacy and live claims get one orphan lease and survive an old worker ack`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      const leases = queue['ensureLeases']();
      leases.configure({ visibilityTimeout: 100, recoveryGrace: 80 });
      await queue.enqueue('live');
      const live = await leases.claim();
      assert(live);
      await leases.extend(live, 2_000);
      const legacy = createEnvelope({ id: 'legacy' });
      const encoded = JSON.stringify(legacy);
      const processing = `netscript:processing:${harness.name}`;
      await harness.client.lpush(processing, encoded);
      const observers = [queue, ...Array.from({ length: 5 }, () => harness.queue())];
      observers.forEach((observer) =>
        observer['ensureLeases']().configure({
          visibilityTimeout: 100,
          recoveryGrace: 80,
        })
      );
      await Promise.all(observers.map((observer) => observer.reclaimExpired()));
      assertEquals((await queue.getMetrics()).observedOrphans, 1);
      assertEquals((await queue.getHealth()).ready, 0, 'observation grants a full lease');
      await harness.client.lrem(processing, 1, encoded); // A still-running pre-upgrade worker.
      await until(async () => {
        await queue.reclaimExpired();
        return (await queue.getHealth()).ready === 1;
      });
      const recovered = await leases.claim();
      assert(recovered);
      assertEquals(recovered.envelope.messageId, legacy.messageId);
      assertEquals(recovered.envelope.deliveryCount, 2);
      assertEquals(recovered.envelope.payload, { id: 'legacy' });
      await leases.settle(recovered);
      await leases.settle(live);
      assertEquals((await queue.getHealth()).processing, 0);
    },
  });

  Deno.test({
    name: `${backend} destination type errors retain the source claim for a later retry`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      const leases = queue['ensureLeases']();
      await queue.enqueue('preserve');
      const claim = await leases.claim();
      assert(claim);
      const ready = `netscript:queue:${harness.name}`;
      await harness.client.set(ready, 'not a list');
      await assertRejects(() => leases.settle(claim, { requeue: true }), Error, 'WRONGTYPE');
      assertEquals(await harness.client.llen(`netscript:processing:${harness.name}`), 1);
      assert(await harness.client.get(claim.key));
      await harness.client.del(ready);
      const dlq = `netscript:dlq:${harness.name}`;
      await harness.client.set(dlq, 'not a list');
      await assertRejects(() => leases.settle(claim, { requeue: false }), Error, 'WRONGTYPE');
      assert(await harness.client.get(claim.key));
      await harness.client.del(dlq);
      await leases.settle(claim, { requeue: false });
      assertEquals((await queue.getHealth()).processing, 0);
      assertEquals((await queue.getHealth()).deadLetterDepth, 1);
    },
  });

  Deno.test({
    name: `${backend} a lost committed ack reply reconnects without requeuing the message`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      const leases = queue['ensureLeases']();
      await queue.enqueue('unknown-outcome');
      const claim = await leases.claim();
      assert(claim);
      const client = leases['connection'].client;
      const execute = client.evalsha.bind(client);
      let dropped = false;
      using _lost = stub(client, 'evalsha', async (...args: Parameters<typeof execute>) => {
        const result = await execute(...args);
        if (!dropped) {
          dropped = true;
          client.disconnect();
          throw new Error('ECONNRESET after committed acknowledgement');
        }
        return result;
      });
      await leases.settle(claim);
      assert(dropped);
      assertEquals((await queue.getHealth()).processing, 0);
      assertEquals((await queue.getHealth()).ready, 0);
      assertEquals((await queue.getMetrics()).staleSettlements, 1);
    },
  });

  Deno.test({
    name: `${backend} steady producers and eight consumers make progress without false adoption`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const producer = harness.queue();
      const delivered = new Set<number>();
      const complete = Promise.withResolvers<void>();
      const runs = Array.from(
        { length: 8 },
        () =>
          harness.listen(harness.queue(), async (message, context) => {
            assert(typeof message === 'number');
            assert(!delivered.has(message), 'one delivery per non-failing message');
            assertEquals(context.deliveryCount, 1);
            assertEquals(await context.extendVisibility?.(), true);
            delivered.add(message);
            await context.ack();
            if (delivered.size === 120) complete.resolve();
          }, { visibilityTimeout: 5_000, recoveryGrace: 20 }),
      );
      for (let id = 0; id < 120; id++) {
        await producer.enqueue(id);
        if (id % 4 === 0) await delay(2);
      }
      await bounded(complete.promise);
      runs.forEach((run) => run.controller.abort());
      await Promise.all(runs.map((run) => run.done));
      assertEquals(delivered.size, 120);
      const health = await producer.getHealth();
      assertEquals(health.processing, 0);
      assertEquals(health.observedOrphans, 0);
      assertEquals(health.staleSettlements, 0);
      assertEquals(health.reclaimed, 0);
    },
  });
}
