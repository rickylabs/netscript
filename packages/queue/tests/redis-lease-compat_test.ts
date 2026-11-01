import { assert, assertEquals, assertRejects } from '@std/assert';
import type { DeadLetterRecord, DeadLetterStorePort } from '../ports/mod.ts';
import { RedisDeadLetterStore } from '../adapters/redis-dead-letter-store.ts';
import { bounded, leaseBackends, LeaseHarness, until } from './_fixtures/redis-lease-harness.ts';

for (const [backend, url] of leaseBackends) {
  Deno.test({
    name: `${backend} raw JSON keeps its identity and large payload numbers across retries`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      const payload = { value: Number.MAX_SAFE_INTEGER };
      await harness.client.lpush(`netscript:queue:${harness.name}`, JSON.stringify(payload));
      let firstId = '';
      const complete = Promise.withResolvers<void>();
      const { done, controller } = harness.listen(queue, async (message, context) => {
        assertEquals(message, payload);
        firstId ||= context.messageId;
        assertEquals(context.messageId, firstId);
        if (context.deliveryCount === 1) await context.nack({ requeue: true });
        else {
          assertEquals(context.deliveryCount, 2);
          await context.ack();
          controller.abort();
          complete.resolve();
        }
      });
      await bounded(complete.promise);
      await done;
    },
  });

  Deno.test({
    name: `${backend} malformed bytes at the queue tail are quarantined without wedging valid work`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      await harness.client.lpush(`netscript:queue:${harness.name}`, '{not JSON');
      await queue.enqueue({ id: 'valid' });
      const complete = Promise.withResolvers<void>();
      const { done, controller } = harness.listen(queue, async (message, context) => {
        assertEquals(message, { id: 'valid' });
        await context.ack();
        controller.abort();
        complete.resolve();
      });
      await bounded(complete.promise);
      await done;
      const store = new RedisDeadLetterStore({ commands: harness.client, queueName: harness.name });
      const [record] = await store.list();
      assertEquals(record.reason, 'validation_failed');
      assertEquals(record.payload, '{not JSON');
      assertEquals((await queue.getMetrics()).deadLettered, 1);
    },
  });

  Deno.test({
    name: `${backend} thrown handler failures reach the DLQ on the configured last delivery`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      await queue.enqueue('throwing');
      for (let delivery = 1; delivery <= 3; delivery++) {
        const { done } = harness.listen(queue, (_message, context) => {
          assertEquals(context.deliveryCount, delivery);
          return Promise.reject(new Error('handler failed'));
        }, { maxDeliveries: 3 });
        await assertRejects(() => bounded(done), Error, 'handler failed');
      }
      assertEquals((await queue.getHealth()).deadLetterDepth, 1);
      assertEquals((await queue.getMetrics()).deadLettered, 1);
    },
  });

  Deno.test({
    name:
      `${backend} custom DLQ outage retains its outbox while the listener consumes and later drains it`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      let available = false;
      const records: DeadLetterRecord[] = [];
      const store: DeadLetterStorePort = {
        append(record) {
          if (!available) return Promise.reject(new Error('DLQ unavailable'));
          if (!records.some((prior) => prior.messageId === record.messageId)) records.push(record);
          return Promise.resolve();
        },
        list: () => Promise.resolve(records),
        depth: () => Promise.resolve(records.length),
        reprocess: () => Promise.resolve(0),
      };
      const queue = harness.queue(store);
      await queue.enqueue({ id: 'durable-terminal' });
      await queue.enqueue('next');
      const consumedNext = Promise.withResolvers<void>();
      let terminated = false;
      const { done, controller } = harness.listen(queue, async (message, context) => {
        if (message === 'next') {
          await context.ack();
          consumedNext.resolve();
        } else await context.nack({ requeue: false });
      });
      void done.then(() => terminated = true, () => terminated = true);
      await bounded(consumedNext.promise);
      assertEquals(terminated, false);
      assertEquals((await queue.getHealth()).outboxDepth, 1);
      assertEquals((await queue.getHealth()).processing, 0);
      assertEquals((await queue.getMetrics()).staleSettlements, 0);
      available = true;
      await until(async () => records.length === 1 && (await queue.getHealth()).outboxDepth === 0);
      assertEquals(records.length, 1);
      assertEquals(records[0].payload, { id: 'durable-terminal' });
      assertEquals((await queue.getMetrics()).deadLettered, 1);
      assertEquals((await queue.getMetrics()).staleSettlements, 0);
      controller.abort();
      await done;
      assertEquals((await harness.queue(store).getMetrics()).deadLettered, 1);
    },
  });

  Deno.test({
    name:
      `${backend} explicit terminal reason and error metadata survive the last permitted delivery`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      const queue = harness.queue();
      await queue.enqueue('invalid');
      const { done, controller } = harness.listen(queue, async (_message, context) => {
        await context.nack({
          requeue: false,
          reason: 'validation_failed',
          errorCode: 'invalid-input',
        });
        controller.abort();
      }, { maxDeliveries: 1 });
      await bounded(done);
      const store = new RedisDeadLetterStore({ commands: harness.client, queueName: harness.name });
      const [record] = await store.list();
      assertEquals(record.reason, 'validation_failed');
      assertEquals(record.errorCode, 'invalid-input');
      assertEquals(record.deliveryCount, 1);
    },
  });
}

const noLuaUrl = Deno.env.get('NETSCRIPT_TEST_GARNET_NO_LUA_URL');
Deno.test({
  name: 'Garnet without Lua refuses consumption before removing any ready work',
  ignore: !noLuaUrl,
  async fn() {
    assert(noLuaUrl);
    await using harness = new LeaseHarness(noLuaUrl);
    const queue = harness.queue();
    await queue.enqueue('ready');
    const { done } = harness.listen(queue, () => Promise.reject(new Error('Must not consume')));
    await assertRejects(() => bounded(done), Error, 'require Lua');
    assertEquals(await harness.client.llen(`netscript:queue:${harness.name}`), 1);
    assertEquals(await harness.client.llen(`netscript:processing:${harness.name}`), 0);
  },
});
