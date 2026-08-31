import { assert, assertEquals, assertRejects, assertStrictEquals } from 'jsr:@std/assert@^1';

import { MemoryKvAdapter } from '@netscript/kv';
import { defineSaga, sagaCompensate, sagaFail, send } from '@netscript/plugin-sagas-core';
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
import {
  SagaInstrumentation,
  SagaSpanNames,
  type SagaTelemetrySpan,
} from '@netscript/plugin-sagas-core/telemetry';

import { createDurableSagaRuntime } from './create-durable-saga-runtime.ts';
import {
  KvSagaStore,
  PrismaSagaStore,
  type PrismaSagaStoreClient,
} from '@netscript/plugin-sagas-core/stores';

Deno.test('createDurableSagaRuntime injects a KvSagaStore by default', async () => {
  const kv = new MemoryKvAdapter();
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
  const kv = new MemoryKvAdapter();
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

Deno.test('createDurableSagaRuntime dispatches returned compensation through its default compensator', async () => {
  const spanNames: string[] = [];
  const instrumentation = new SagaInstrumentation({
    tracer: {
      startSpan(name): SagaTelemetrySpan {
        spanNames.push(name);
        return {
          setAttribute(): void {},
          addEvent(): void {},
          setStatus(): void {},
          recordException(): void {},
          end(): void {},
        };
      },
    },
  });
  const durable = await createDurableSagaRuntime({
    kv: new MemoryKvAdapter(),
    native: { instrumentation },
  });
  const calls: string[] = [];
  const definition = defineSaga('default-compensation')
    .state<SagaState>({ status: 'pending' })
    .on<string, unknown>('Start', () => [
      sagaCompensate({ type: 'Undo', payload: { orderId: 'ord-1' } }, 'rollback'),
    ])
    .on<string, unknown>('Compensated', (_saga, message) => {
      calls.push(`cascade:${String(message.payload)}`);
      return [];
    })
    .compensate<string, unknown>('Undo', (saga, message) => {
      const payload = message.payload as { orderId: string };
      calls.push(`compensate:${payload.orderId}`);
      saga.state = { status: 'compensated' };
      return [send('Compensated', 'ord-1')];
    })
    .build();

  await durable.runtime.start();
  try {
    await durable.runtime.register([definition]);
    await durable.runtime.publish({ type: 'Start', payload: {} });
    assertEquals(calls, ['compensate:ord-1', 'cascade:ord-1']);
    assert(spanNames.includes(SagaSpanNames.CASCADE_COMPENSATE));
  } finally {
    await durable.runtime.stop('default compensation test complete');
    await durable.dispose();
  }
});

Deno.test('createDurableSagaRuntime rejects sagaCompensate without a matching branch', async () => {
  const durable = await createDurableSagaRuntime({ kv: new MemoryKvAdapter() });
  const definition = defineSaga('missing-compensation')
    .state<SagaState>({ status: 'pending' })
    .on<string, unknown>('Start', () => [sagaCompensate({ type: 'Undo', payload: {} })])
    .build();

  await durable.runtime.start();
  try {
    await durable.runtime.register([definition]);
    await assertRejects(
      () => durable.runtime.publish({ type: 'Start', payload: {} }),
      Error,
      'sagaCompensate effect for "Undo" requires a registered .compensate() handler.',
    );
  } finally {
    await durable.runtime.stop('missing compensation test complete');
    await durable.dispose();
  }
});

Deno.test('createDurableSagaRuntime dispatches sagaFail through its compensation branch', async () => {
  const durable = await createDurableSagaRuntime({ kv: new MemoryKvAdapter() });
  const calls: string[] = [];
  const definition = defineSaga('failure-compensation')
    .state<SagaState>({ status: 'pending' })
    .on<string, unknown>('Start', () => [sagaFail('payment declined')])
    .compensate<string, unknown>('Start', (saga, message) => {
      calls.push(`compensate:${message.type}`);
      saga.state = { status: 'compensated' };
      return [];
    })
    .build();

  await durable.runtime.start();
  try {
    await durable.runtime.register([definition]);
    await durable.runtime.publish({ type: 'Start', payload: {} });
    assertEquals(calls, ['compensate:Start']);
  } finally {
    await durable.runtime.stop('failure compensation test complete');
    await durable.dispose();
  }
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
