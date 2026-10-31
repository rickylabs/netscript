import { assert, assertEquals, assertRejects } from '@std/assert';
import { FakeTime } from '@std/testing/time';
import type { MessageContext } from '@netscript/queue';
import { WorkerDeliveryLease } from './delivery-lease.ts';

for (const failure of [false, new Error('Command timed out')]) {
  Deno.test(`worker lease renewal cancels execution on ${String(failure)} and stops its timer`, async () => {
    using time = new FakeTime();
    let calls = 0;
    const context: MessageContext = {
      messageId: 'lease-loss',
      deliveryCount: 1,
      enqueuedAt: new Date(),
      headers: {},
      ack: () => Promise.resolve(),
      nack: () => Promise.resolve(),
      extendVisibility: () => {
        if (++calls === 1) return Promise.resolve(true);
        return failure instanceof Error ? Promise.reject(failure) : Promise.resolve(failure);
      },
    };
    const lease = new WorkerDeliveryLease(context, undefined);
    await lease.start();
    assertEquals(lease.signal.aborted, false);
    await time.tickAsync(20_000);
    assert(lease.signal.aborted);
    await assertRejects(() => Promise.resolve().then(() => lease.assertOwned()));
    await lease.stop();
    await time.tickAsync(120_000);
    assertEquals(calls, 2);
  });
}

Deno.test('an already-lost queue lease rejects execution before admitting effects', async () => {
  const lease = new WorkerDeliveryLease({
    messageId: 'lost',
    deliveryCount: 1,
    enqueuedAt: new Date(),
    headers: {},
    ack: () => Promise.resolve(),
    nack: () => Promise.resolve(),
    extendVisibility: () => Promise.resolve(false),
  }, undefined);
  await assertRejects(() => lease.start(), DOMException, 'no longer owned');
  await lease.stop();
});
