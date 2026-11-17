import { assertEquals, assertRejects } from '@std/assert';
import { stub } from '@std/testing/mock';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvPollingAdapter } from '../adapters/kv-polling.adapter.ts';
import { bounded } from './_fixtures/redis-lease-harness.ts';

Deno.test('polling settlement failure rejects the listener and retains the durable delivery', async () => {
  await using kv = new MemoryKvAdapter();
  const queue = new KvPollingAdapter({ kv, queueName: 'settlement-outage', pollInterval: 1 });
  await queue.enqueue('retain');
  const entered = Promise.withResolvers<void>();
  const settle = Promise.withResolvers<void>();
  const controller = new AbortController();
  const done = queue.listen(async (_message, delivery) => {
    entered.resolve();
    await settle.promise;
    await delivery.nack({ preserveDeliveryCount: true });
  }, { signal: controller.signal });
  void done.catch(() => {});
  try {
    await bounded(entered.promise);
    using _broken = stub(kv, 'atomic', () => Promise.reject(new Error('settlement outage')));
    settle.resolve();
    await assertRejects(() => bounded(done), Error, 'settlement outage');
    assertEquals(await queue.getStats(), { pending: 0, processing: 1, dlq: 0 });
  } finally {
    controller.abort();
    settle.resolve();
    await bounded(done).catch(() => {});
    await queue.stop();
  }
});
