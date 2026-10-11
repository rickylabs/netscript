import { assert, assertEquals, assertThrows } from '@std/assert';
import { delay } from '@std/async';
import { DenoKvAdapter, type KvKey } from '@netscript/kv';
import { KvPollingAdapter } from '@netscript/queue/adapters/kv-polling';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import { KvSagaStore } from '@netscript/plugin-sagas-core/stores';
import type {
  SagaCorrelationKey,
  SagaInstanceId,
  SagaStateEnvelope,
} from '@netscript/plugin-sagas-core/domain';
import {
  type SagaDeliveryMessage,
  SagaQueueDelivery,
  SagaQueueScheduler,
} from './saga-delivery.ts';
import { createDurableSagaRuntime } from './create-durable-saga-runtime.ts';
import { defineSaga, sagaComplete, schedule } from '@netscript/plugin-sagas-core';

const origin = 'orders:origin' as SagaInstanceId;
const pendingPrefix = ['queue:pending', 'sagas-scheduled'];

Deno.test('scheduled KV keys survive every terminal transition until the completed retention deadline', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = new KvSagaStore({ kv });
  const delayed = new KvPollingAdapter<SagaDeliveryMessage>({
    kv,
    queueName: 'sagas-scheduled',
    pollInterval: 1,
  });
  const scheduler = new SagaQueueScheduler(new MemoryQueueAdapter(), delayed);
  scheduler.bindRetentionStore(store);
  await scheduler.start();
  try {
    for (const status of ['completed', 'failed', 'cancelled', 'compensated'] as const) {
      await store.save(envelope('running'));
      await scheduler.scheduleCascaded(cascade(), { instanceId: origin });
      assertEquals(await count(kv, pendingPrefix), 1);
      assertEquals(await scheduler.cleanupRetention(), false);
      assertEquals(await count(kv, pendingPrefix), 1);
      const terminal = envelope(status);
      await store.save(terminal);
      assertEquals(await scheduler.cleanupRetention(), false);
      assertEquals(await count(kv, pendingPrefix), 1);
      // Terminal persistence precedes effect dispatch; completion must still accept follow-ups.
      await scheduler.scheduleCascaded(cascade(), { instanceId: origin });
      assertEquals(await count(kv, pendingPrefix), 2);
      await store.save({
        ...terminal,
        metadata: { ...terminal.metadata, completedAt: new Date(Date.now() - 8 * 86_400_000) },
      });
      await scheduler.cleanupRetention();
      assertEquals(await count(kv, pendingPrefix), 0);
    }
    for (const status of ['pending', 'running', 'compensating'] as const) {
      await store.save(envelope(status));
      await scheduler.scheduleCascaded(cascade(), { instanceId: origin });
      await scheduler.cleanupRetention();
    }
    assertEquals(await count(kv, pendingPrefix), 3);
    assertEquals(scheduler.retentionDrops, 8);
  } finally {
    await scheduler.stop();
    await kv.close();
  }
});

Deno.test('scheduled KV keys cancel when the canonical terminal deadline has already expired', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = new KvSagaStore({ kv, completedRetentionDays: 100 / 86_400_000 });
  const delayed = new KvPollingAdapter<SagaDeliveryMessage>({
    kv,
    queueName: 'sagas-scheduled',
    pollInterval: 1,
  });
  const scheduler = new SagaQueueScheduler(new MemoryQueueAdapter(), delayed);
  scheduler.bindRetentionStore(store);
  await scheduler.start();
  try {
    await store.save(envelope('running'));
    await scheduler.scheduleCascaded(cascade(), { instanceId: origin });
    const expired = envelope('completed');
    await store.save({
      ...expired,
      metadata: { ...expired.metadata, completedAt: new Date(Date.now() - 200) },
    });
    // The deadline is already expired: canonical persistence deletes the real KV key.
    assertEquals(await kv.get(['sagas', 'state', origin]), null);
    assertEquals(await count(kv, pendingPrefix), 1);
    await scheduler.cleanupRetention();
    assertEquals(await count(kv, pendingPrefix), 0);
  } finally {
    await scheduler.stop();
    await kv.close();
  }
});

Deno.test('scheduled KV cleanup is bounded, resumes across adapters, and preserves unscoped/other queues', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  try {
    const delayed = new KvPollingAdapter<SagaDeliveryMessage>({ kv, queueName: 'sagas-scheduled' });
    const other = new KvPollingAdapter<SagaDeliveryMessage>({ kv, queueName: 'other' });
    for (let index = 0; index < 205; index++) {
      await delayed.enqueue({ type: 'timer', payload: {} }, {
        delay: 86_400_000,
        retentionId: 'expired',
      });
    }
    await other.enqueue({ type: 'timer', payload: {} }, { retentionId: 'expired' });
    let largestBatch = 0;
    const resolve = (ids: readonly string[]): Promise<readonly string[]> => {
      largestBatch = Math.max(largestBatch, ids.length);
      return Promise.resolve(ids);
    };
    assertEquals(await delayed.cancelPending(resolve), true);
    assertEquals(await count(kv, pendingPrefix), 105);
    assert(await kv.get(['queue:retention-cursor', 'sagas-scheduled']));
    const restarted = new KvPollingAdapter<SagaDeliveryMessage>({
      kv,
      queueName: 'sagas-scheduled',
    });
    assertEquals(await restarted.cancelPending(resolve), true);
    assertEquals(await count(kv, pendingPrefix), 5);
    assertEquals(await restarted.cancelPending(resolve), false);
    assertEquals(await count(kv, pendingPrefix), 0);
    assertEquals(await kv.get(['queue:retention-cursor', 'sagas-scheduled']), null);
    await restarted.enqueue({ type: 'legacy', payload: {} }, { delay: 86_400_000 });
    await restarted.cancelPending(resolve);
    assertEquals(await count(kv, pendingPrefix), 1);
    assertEquals(await count(kv, ['queue:pending', 'other']), 1);
    assert(largestBatch <= 100);
  } finally {
    await kv.close();
  }
});

Deno.test('durable saga service cancels scoped timers in the background after the retention deadline', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const delayed = new KvPollingAdapter<SagaDeliveryMessage>({
    kv,
    queueName: 'sagas-scheduled',
    pollInterval: 1,
  });
  const scheduler = new SagaQueueScheduler(new MemoryQueueAdapter(), delayed);
  const durable = await createDurableSagaRuntime({
    kv,
    completedRetentionDays: 1 / 86_400,
    native: { scheduler },
  });
  const definition = defineSaga('retention-integration')
    .state({ status: 'running' })
    .on(
      'Start',
      () => [
        schedule({
          type: 'Timer',
          payload: {},
          correlationKey: 'destination' as SagaCorrelationKey,
        }, '1d'),
      ],
    )
    .on('Finish', () => [sagaComplete()])
    .on('Timer', () => [])
    .correlate((message) =>
      String((message.payload as { orderId: string }).orderId) as SagaCorrelationKey
    )
    .build();
  try {
    await durable.runtime.register([definition]);
    await durable.runtime.start();
    await durable.runtime.publish({ type: 'Start', payload: { orderId: 'order-1' } });
    assertEquals(await count(kv, pendingPrefix), 1);
    await durable.runtime.publish({ type: 'Finish', payload: { orderId: 'order-1' } });
    assertEquals(await count(kv, pendingPrefix), 1);
    const deadline = Date.now() + 3_000;
    while (await count(kv, pendingPrefix) > 0 && Date.now() < deadline) await delay(10);
    assertEquals(await count(kv, pendingPrefix), 0);
    assertEquals(scheduler.retentionDrops, 1);
  } finally {
    await durable.runtime.stop();
    await durable.dispose();
  }
});

Deno.test('terminal transition schedules a cross-saga follow-up that is delivered over real KV', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const delayed = new KvPollingAdapter<SagaDeliveryMessage>({
    kv,
    queueName: 'sagas-scheduled',
    pollInterval: 1,
  });
  const ready = new KvPollingAdapter<SagaDeliveryMessage>({
    kv,
    queueName: 'ready',
    pollInterval: 1,
  });
  const scheduler = new SagaQueueScheduler(ready, delayed);
  const delivery = new SagaQueueDelivery(ready);
  const durable = await createDurableSagaRuntime({ kv, native: { scheduler } });
  const received: string[] = [];
  const source = defineSaga('orders')
    .state({ status: 'running' })
    .on('Finish', () => [
      sagaComplete(),
      schedule({
        type: 'ReviewRequest',
        payload: {},
        correlationKey: 'review-1' as SagaCorrelationKey,
      }, 100),
    ])
    .build();
  const destination = defineSaga('reviews')
    .state({ status: 'pending' })
    .on('ReviewRequest', (_saga, message) => {
      received.push(String(message.correlationKey));
      return [sagaComplete()];
    })
    .build();
  try {
    await durable.runtime.register([source]);
    await durable.runtime.register([destination]);
    await durable.runtime.start();
    await durable.runtime.publish({
      type: 'Finish',
      payload: {},
      correlationKey: 'order-1' as SagaCorrelationKey,
    });
    assertEquals(await count(kv, pendingPrefix), 1);
    const states = await Array.fromAsync(
      kv.list<SagaStateEnvelope>({ prefix: ['sagas', 'state'] }),
    );
    assertEquals(
      states.find((entry) => entry.value.metadata.sagaId === 'orders')?.value.metadata.status,
      'completed',
    );
    await scheduler.cleanupRetention();
    assertEquals(await count(kv, pendingPrefix), 1);
    await delivery.start(durable.runtime);
    const deadline = Date.now() + 3_000;
    while (received.length === 0 && Date.now() < deadline) await delay(10);
    assertEquals(received, ['review-1']);
    assertEquals(scheduler.retentionDrops, 0);
  } finally {
    await delivery.stop();
    await durable.runtime.stop();
    await durable.dispose();
  }
});

Deno.test('due timers past the configured retention deadline are counted without forwarding', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = new KvSagaStore({ kv });
  const delayed = new KvPollingAdapter<SagaDeliveryMessage>({
    kv,
    queueName: 'sagas-scheduled',
    pollInterval: 1,
  });
  const ready = new KvPollingAdapter<SagaDeliveryMessage>({ kv, queueName: 'ready' });
  const scheduler = new SagaQueueScheduler(ready, delayed);
  scheduler.bindRetentionStore(store, { completedRetentionDays: () => 100 / 86_400_000 });
  // Canonical state is still physically present: due delivery must check the configured deadline.
  const terminal = envelope('failed');
  await store.save({
    ...terminal,
    metadata: { ...terminal.metadata, completedAt: new Date(Date.now() - 200) },
  });
  await scheduler.start();
  try {
    await scheduler.scheduleCascaded({ ...cascade(), scheduledFor: new Date(Date.now() + 30) }, {
      instanceId: origin,
    });
    assertEquals(await count(kv, pendingPrefix), 1);
    const deadline = Date.now() + 3_000;
    while (scheduler.retentionDrops === 0 && Date.now() < deadline) await delay(10);
    assertEquals(scheduler.retentionDrops, 1);
    assertEquals(await count(kv, ['queue:pending', 'ready']), 0);
  } finally {
    await scheduler.stop();
    await kv.close();
  }
});

Deno.test('scheduler cleanup before binding is safe and double start cannot duplicate listeners', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const queue = new KvPollingAdapter<SagaDeliveryMessage>({
    kv,
    queueName: 'sagas-scheduled',
    pollInterval: 1,
  });
  const scheduler = new SagaQueueScheduler(new MemoryQueueAdapter(), queue);
  try {
    await queue.enqueue({ type: 'Timer', payload: {} }, { delay: 86_400_000, retentionId: origin });
    assertEquals(await scheduler.cleanupRetention(), false);
    assertEquals(await count(kv, pendingPrefix), 1);
    scheduler.bindRetentionStore(new KvSagaStore({ kv }));
    await scheduler.start();
    const error = assertThrows(() => scheduler.start(), Error, 'already running');
    assertEquals((error as { code?: string }).code, 'SAGA_VALIDATION_FAILED');
  } finally {
    await scheduler.stop();
    await kv.close();
  }
});

function cascade() {
  return {
    kind: 'scheduled' as const,
    message: { type: 'Timer', payload: {}, correlationKey: 'destination' as SagaCorrelationKey },
    scheduledFor: new Date(Date.now() + 86_400_000),
  };
}

function envelope(status: SagaStateEnvelope['metadata']['status']): SagaStateEnvelope {
  const now = new Date();
  return {
    state: { status },
    metadata: {
      instanceId: origin,
      sagaId: 'orders',
      status,
      version: 1,
      durability: 't2',
      createdAt: now,
      updatedAt: now,
      ...(['completed', 'failed', 'cancelled', 'compensated'].includes(status)
        ? { completedAt: now }
        : {}),
    },
  };
}

async function count(kv: DenoKvAdapter, prefix: KvKey): Promise<number> {
  let result = 0;
  for await (const _entry of kv.list({ prefix })) result++;
  return result;
}
