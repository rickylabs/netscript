import { assert, assertEquals, assertRejects, assertStrictEquals } from 'jsr:@std/assert@^1';

import type {
  SagaCorrelationIndexEntry,
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaState,
  SagaStateEnvelope,
  SagaStorePort,
  SagaStoreWriteOptions,
  SagaTransitionRecord,
} from '@netscript/plugin-sagas-core/runtime';

import { createDurableSagaRuntime } from './create-durable-saga-runtime.ts';
import { KvSagaStore } from './kv-saga-store.ts';
import { PrismaSagaStore, type PrismaSagaStoreClient } from './prisma-saga-store.ts';

Deno.test('createDurableSagaRuntime injects a KvSagaStore by default', async () => {
  const kv = await Deno.openKv(':memory:');
  const durable = await createDurableSagaRuntime({ kv });
  try {
    assertEquals(durable.runtime.adapter, 'native');
    assert(durable.store instanceof KvSagaStore);
    assertStrictEquals(durable.kv, kv);
  } finally {
    await durable.runtime.stop('durable runtime factory test complete');
    await durable.dispose();
  }
});

Deno.test('createDurableSagaRuntime honors injected store and kv', async () => {
  const kv = await Deno.openKv(':memory:');
  const store = new RecordingSagaStore();
  const durable = await createDurableSagaRuntime({ kv, store });
  try {
    assertStrictEquals(durable.store, store);
    assertStrictEquals(durable.kv, kv);
    assertEquals(durable.runtime.adapter, 'native');
  } finally {
    await durable.runtime.stop('durable runtime injected store test complete');
    await durable.dispose();
  }
});

Deno.test('createDurableSagaRuntime creates Prisma store without opening KV', async () => {
  const prisma = createUnusedPrismaClient();
  const durable = await createDurableSagaRuntime({ backend: 'prisma', prisma });
  try {
    assert(durable.store instanceof PrismaSagaStore);
    assertEquals(durable.kv, undefined);
    assertEquals(durable.runtime.adapter, 'native');
  } finally {
    await durable.runtime.stop('durable runtime prisma store test complete');
    await durable.dispose();
  }
});

Deno.test('createDurableSagaRuntime rejects Prisma backend without client', async () => {
  await assertRejects(
    () => createDurableSagaRuntime({ backend: 'prisma' }),
    Error,
    'Prisma saga store backend requires a Prisma client.',
  );
});

class RecordingSagaStore implements SagaStorePort {
  readonly id = 'recording-saga-store';

  load<TState extends SagaState>(
    _instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined> {
    return Promise.resolve(undefined);
  }

  save<TState extends SagaState>(
    _envelope: SagaStateEnvelope<TState>,
    _options?: SagaStoreWriteOptions,
  ): Promise<void> {
    return Promise.resolve();
  }

  appendTransition<TState extends SagaState>(
    _instanceId: SagaInstanceId,
    _record: SagaTransitionRecord<TState>,
  ): Promise<void> {
    return Promise.resolve();
  }

  findByCorrelation(
    _sagaId: SagaId,
    _correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined> {
    return Promise.resolve(undefined);
  }

  saveCorrelation(_entry: SagaCorrelationIndexEntry): Promise<void> {
    return Promise.resolve();
  }

  delete(_instanceId: SagaInstanceId): Promise<void> {
    return Promise.resolve();
  }
}

function createUnusedPrismaClient(): PrismaSagaStoreClient {
  const fail = (): never => {
    throw new Error('Prisma client delegate should not be called during runtime construction.');
  };
  return {
    sagaRuntimeState: {
      findUnique: fail,
      findMany: fail,
      create: fail,
      upsert: fail,
      updateMany: fail,
      deleteMany: fail,
    },
    sagaRuntimeTransition: {
      findMany: fail,
      create: fail,
      deleteMany: fail,
    },
    sagaRuntimeCorrelation: {
      findUnique: fail,
      upsert: fail,
      deleteMany: fail,
    },
    $transaction: fail,
  };
}
