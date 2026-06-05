import { assertEquals, assertRejects } from '@std/assert';
import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaStateEnvelope,
} from '../../src/domain/mod.ts';
import {
  createTestSagaRuntime,
  MemorySagaBus,
  MemorySagaStore,
  RecordingSagaStore,
  TestSagaClock,
} from '../../src/testing/mod.ts';

Deno.test('MemorySagaStore persists state and correlation entries', async () => {
  const store = new MemorySagaStore();
  const instanceId = 'signup:u1' as SagaInstanceId;
  const sagaId = 'signup' as SagaId;
  const correlationKey = 'u1' as SagaCorrelationKey;
  const envelope: SagaStateEnvelope = {
    metadata: {
      instanceId,
      version: 1,
      status: 'running',
      durability: 't1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    state: { email: 'a@example.com' },
  };

  await store.save(envelope);
  await store.saveCorrelation({ sagaId, correlationKey, instanceId });

  assertEquals(await store.load(instanceId), envelope);
  assertEquals(await store.findByCorrelation(sagaId, correlationKey), instanceId);
  await assertRejects(() => store.save(envelope, { expectedVersion: 2 }));
});

Deno.test('RecordingSagaStore records delegated operations', async () => {
  const delegate = new MemorySagaStore();
  const store = new RecordingSagaStore(delegate);
  const instanceId = 'signup:u1' as SagaInstanceId;

  await store.load(instanceId);
  await store.delete(instanceId);

  assertEquals(store.operations().map((operation) => operation.kind), ['load', 'delete']);
});

Deno.test('TestSagaClock advances deterministically', async () => {
  const clock = new TestSagaClock(new Date('2026-01-01T00:00:00.000Z'));

  await clock.sleep(250);
  clock.advanceBy(750);

  assertEquals(clock.now().toISOString(), '2026-01-01T00:00:01.000Z');
  assertEquals(clock.sleeps(), [250]);
});

Deno.test('createTestSagaRuntime records publications on memory bus', async () => {
  const bus = new MemorySagaBus();
  const runtime = createTestSagaRuntime({ bus });

  await runtime.start();
  await runtime.publish({ type: 'UserRegistered', payload: { userId: 'u1' } });

  assertEquals(runtime.adapter, 'native');
  assertEquals(runtime.bus.published()[0]?.message.type, 'UserRegistered');
});
