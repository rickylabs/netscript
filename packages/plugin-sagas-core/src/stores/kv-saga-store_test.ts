import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import { SagasError } from '../domain/mod.ts';
import { DenoKvAdapter, type KvStore, MemoryKvAdapter } from '@netscript/kv';
import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaState,
  SagaStateEnvelope,
  SagaTransitionRecord,
} from '../runtime/mod.ts';

import { KvSagaStore } from './kv-saga-store.ts';

for (const backend of ['memory', 'deno-kv'] as const) {
  Deno.test(`KvSagaStore round-trips state envelopes with ${backend}`, async () => {
    await using fixture = await createStoreFixture(backend);
    const envelope = createEnvelope({ count: 1 }, 1);

    await fixture.store.save(envelope);

    assertEquals(await fixture.store.load(envelope.metadata.instanceId), envelope);
    assertEquals(await fixture.store.entries(), [envelope]);
  });
}

Deno.test('KvSagaStore saves and resolves correlations', async () => {
  await using fixture = await createStoreFixture('memory');
  const sagaId = 'billing-saga' as SagaId;
  const correlationKey = 'order-1' as SagaCorrelationKey;
  const instanceId = 'billing-saga:order-1' as SagaInstanceId;

  await fixture.store.saveCorrelation({ sagaId, correlationKey, instanceId });

  assertEquals(await fixture.store.findByCorrelation(sagaId, correlationKey), instanceId);
});

Deno.test('KvSagaStore appends transition log records in version order', async () => {
  await using fixture = await createStoreFixture('memory');
  const instanceId = 'billing-saga:order-1' as SagaInstanceId;
  const first = createTransition(1, { status: 'started' }, { status: 'charged' });
  const second = createTransition(2, { status: 'charged' }, { status: 'completed' });

  await fixture.store.appendTransition(instanceId, first);
  await fixture.store.appendTransition(instanceId, second);

  assertEquals(await fixture.store.transitions(instanceId), [first, second]);
});

for (const backend of ['memory', 'deno-kv'] as const) {
  Deno.test(`KvSagaStore rejects stale expected versions with ${backend}`, async () => {
    await using fixture = await createStoreFixture(backend);
    const first = createEnvelope({ count: 1 }, 1);
    const second = createEnvelope({ count: 2 }, 2);

    await fixture.store.save(first);

    const error = await assertRejects(
      () => fixture.store.save(second, { expectedVersion: 0 }),
      SagasError,
      'Saga store version mismatch',
    );
    assertEquals(error.code, 'SAGA_VALIDATION_FAILED');
  });
}

Deno.test('KvSagaStore deletes state, transitions, and matching correlations', async () => {
  await using fixture = await createStoreFixture('memory');
  const envelope = createEnvelope({ count: 1 }, 1);
  const sagaId = 'billing-saga' as SagaId;
  const correlationKey = 'order-1' as SagaCorrelationKey;
  const transition = createTransition(1, { status: 'started' }, { status: 'charged' });

  await fixture.store.save(envelope);
  await fixture.store.saveCorrelation({
    sagaId,
    correlationKey,
    instanceId: envelope.metadata.instanceId,
  });
  await fixture.store.appendTransition(envelope.metadata.instanceId, transition);

  await fixture.store.delete(envelope.metadata.instanceId);

  assertEquals(await fixture.store.load(envelope.metadata.instanceId), undefined);
  assertEquals(await fixture.store.findByCorrelation(sagaId, correlationKey), undefined);
  assertEquals(await fixture.store.transitions(envelope.metadata.instanceId), []);
});

type StoreFixture =
  & AsyncDisposable
  & Readonly<{
    store: KvSagaStore;
  }>;

async function createStoreFixture(backend: 'memory' | 'deno-kv'): Promise<StoreFixture> {
  const kv = await createKvStore(backend);
  const store = new KvSagaStore({ kv, prefix: ['test-sagas', crypto.randomUUID()] });
  return {
    store,
    async [Symbol.asyncDispose](): Promise<void> {
      await store.close();
    },
  };
}

async function createKvStore(backend: 'memory' | 'deno-kv'): Promise<KvStore> {
  if (backend === 'memory') {
    return new MemoryKvAdapter();
  }
  return new DenoKvAdapter(await Deno.openKv(':memory:'));
}

function createEnvelope<TState extends SagaState>(
  state: TState,
  version: number,
): SagaStateEnvelope<TState> {
  const now = new Date('2026-06-20T10:00:00.000Z');
  return Object.freeze({
    metadata: Object.freeze({
      instanceId: 'billing-saga:order-1' as SagaInstanceId,
      version,
      status: 'running',
      durability: 't1',
      createdAt: now,
      updatedAt: now,
    }),
    state,
  });
}

function createTransition<TState extends SagaState>(
  version: number,
  from: TState,
  to: TState,
): SagaTransitionRecord<TState> {
  return Object.freeze({
    version,
    transition: Object.freeze({
      from,
      to,
      status: 'running',
      message: Object.freeze({
        type: 'billing.updated',
        payload: {},
        occurredAt: new Date('2026-06-20T10:00:00.000Z'),
      }),
      occurredAt: new Date('2026-06-20T10:00:00.000Z'),
    }),
  });
}
