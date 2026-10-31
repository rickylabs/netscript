import { assert, assertEquals } from '@std/assert';
import { RedisAdapter } from '../adapters/redis.adapter.ts';
import { leaseBackends, LeaseHarness, until } from './_fixtures/redis-lease-harness.ts';

for (const [backend, url] of leaseBackends) {
  Deno.test({
    name:
      `${backend} prefixed receipts recover, renew, settle and dead-letter without double prefix`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const prefix = `tenant:${harness.name}:`;
      const queue = new RedisAdapter(url, harness.name, { keyPrefix: prefix });
      harness.queues.push(queue);
      try {
        const leases = queue['ensureLeases']();
        leases.configure({ visibilityTimeout: 60, recoveryGrace: 0, maxDeliveries: 2 });
        await queue.enqueue('prefixed');
        const first = await leases.claim();
        assert(first);
        assertEquals(await leases.extend(first, 120), true);
        await until(async () => {
          await queue.reclaimExpired();
          return (await queue.getHealth()).ready === 1;
        });
        const second = await leases.claim();
        assert(second);
        assertEquals(second.envelope.deliveryCount, 2);
        await until(async () => {
          await queue.reclaimExpired();
          return (await queue.getHealth()).deadLetterDepth === 1;
        });
        assertEquals((await queue.getHealth()).processing, 0);
        assertEquals((await queue.getMetrics()).reclaimed, 1);
        const index = `${prefix}netscript:leases:${harness.name}`;
        assertEquals(await harness.client.zcard(index), 0);
        await harness.client.zadd(index, 0, `netscript:lease:${harness.name}:missing`);
        await queue.reclaimExpired();
        assertEquals(await harness.client.zcard(index), 0, 'prune also uses logical members');
        await queue.enqueue('ack');
        const last = await leases.claim();
        assert(last);
        await leases.settle(last);
        assertEquals((await queue.getHealth()).processing, 0);
      } finally {
        const keys = await harness.client.keys(`${prefix}*`);
        if (keys.length) await harness.client.del(...keys);
      }
    },
  });
}
