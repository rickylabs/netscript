import { assert, assertEquals } from '@std/assert';
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
import { type SagaDeliveryMessage, SagaQueueScheduler } from './saga-delivery.ts';
import { createDurableSagaRuntime } from './create-durable-saga-runtime.ts';
import { defineSaga, sagaComplete, schedule } from '@netscript/plugin-sagas-core';

const origin = 'orders:origin' as SagaInstanceId;
const pendingPrefix = ['queue:pending', 'sagas-scheduled'];

Deno.test('scheduled KV keys survive open state and cancel every active-to-terminal transition', async () => {
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
      await store.save(envelope(status));
      assertEquals(await scheduler.cleanupRetention(), false);
      assertEquals(await count(kv, pendingPrefix), 0);
      // A delayed enqueue after the terminal write must not revive a timer.
      await scheduler.scheduleCascaded(cascade(), { instanceId: origin });
      assertEquals(await count(kv, pendingPrefix), 0);
    }
    for (const status of ['pending', 'running', 'compensating'] as const) {
      await store.save(envelope(status));
      await scheduler.scheduleCascaded(cascade(), { instanceId: origin });
      await scheduler.cleanupRetention();
    }
    assertEquals(await count(kv, pendingPrefix), 3);
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

Deno.test('durable saga service cancels scoped timers in the background after terminal transition', async () => {
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
    const deadline = Date.now() + 3_000;
    while (await count(kv, pendingPrefix) > 0 && Date.now() < deadline) await delay(10);
    assertEquals(await count(kv, pendingPrefix), 0);
  } finally {
    await durable.runtime.stop();
    await durable.dispose();
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
