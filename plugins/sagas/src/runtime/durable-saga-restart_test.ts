import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import { SagasError } from '@netscript/plugin-sagas-core/domain';
import type {
  SagaCorrelationKey,
  SagaDefinition,
  SagaInstanceId,
  SagaMessage,
  SagaState,
} from '@netscript/plugin-sagas-core/runtime';
import { defineSaga } from '../../../../packages/plugin-sagas-core/mod.ts';

import { createDurableSagaRuntime } from './create-durable-saga-runtime.ts';

Deno.test('createDurableSagaRuntime resumes saga state across runtime restart', async () => {
  const kv = await Deno.openKv(':memory:');
  const observedCounts: number[] = [];
  const definition = createCounterSaga(observedCounts);

  const first = await createDurableSagaRuntime({ kv });
  await first.runtime.register([definition]);
  await first.runtime.start();
  try {
    await first.runtime.publish(counterMessage('counter-1'));
  } finally {
    await first.runtime.stop('first durable runtime stopped');
  }

  const second = await createDurableSagaRuntime({ kv });
  await second.runtime.register([definition]);
  await second.runtime.start();
  try {
    await second.runtime.publish(counterMessage('counter-1'));

    const envelope = await second.store.load(
      'restart-durable-counter:counter-1' as SagaInstanceId,
    );
    assertEquals(observedCounts, [1, 2]);
    assertEquals(envelope?.state, { count: 2 });
    assertEquals(envelope?.metadata.version, 2);
  } finally {
    await second.runtime.stop('second durable runtime stopped');
    await second.dispose();
  }
});

Deno.test('createDurableSagaRuntime store rejects stale expected versions', async () => {
  const kv = await Deno.openKv(':memory:');
  const durable = await createDurableSagaRuntime({ kv });
  const first = createEnvelope(1, { count: 1 });
  const second = createEnvelope(2, { count: 2 });

  try {
    await durable.store.save(first);
    const error = await assertRejects(
      () => durable.store.save(second, { expectedVersion: 0 }),
      SagasError,
      'Saga store version mismatch',
    );
    assertEquals(error.code, 'SAGA_VALIDATION_FAILED');
  } finally {
    await durable.runtime.stop('stale expected version test complete');
    await durable.dispose();
  }
});

function createCounterSaga(observedCounts: number[]): SagaDefinition {
  return defineSaga('restart-durable-counter')
    .state<SagaState>({ count: 0 })
    .on('counter.incremented', (saga) => {
      const count = Number(saga.state.count ?? 0) + 1;
      observedCounts.push(count);
      saga.state = { count };
      return [];
    })
    .build() as SagaDefinition;
}

function counterMessage(correlationKey: string): SagaMessage {
  return {
    type: 'counter.incremented',
    payload: {},
    correlationKey: correlationKey as SagaCorrelationKey,
  };
}

function createEnvelope(version: number, state: SagaState) {
  const now = new Date('2026-06-20T10:00:00.000Z');
  return Object.freeze({
    metadata: Object.freeze({
      instanceId: 'restart-durable-counter:counter-1' as SagaInstanceId,
      version,
      status: 'running',
      durability: 't1',
      createdAt: now,
      updatedAt: now,
    }),
    state,
  });
}
