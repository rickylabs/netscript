import { assertEquals } from '@std/assert';

import { defineSaga, sagaCompensate, sagaFail } from '../../mod.ts';
import type {
  SagaCorrelationKey,
  SagaDefinition,
  SagaInstanceId,
  SagaState,
  SagaStateEnvelope,
  SagaTransitionRecord,
} from '../../src/domain/mod.ts';
import type {
  SagaCorrelationIndexEntry,
  SagaStorePort,
  SagaStoreWriteOptions,
} from '../../src/ports/mod.ts';
import { createSagaRuntime } from '../../src/runtime/mod.ts';

Deno.test('native runtime loads and saves saga state between correlated messages', async () => {
  const observedCounts: number[] = [];
  const store = new MemorySagaStore();
  const runtime = createSagaRuntime({
    native: { store },
  });
  const definition = defineSaga('persistent-state')
    .state<SagaState>({ count: 0 })
    .on('counter.incremented', (saga) => {
      const count = Number(saga.state.count ?? 0) + 1;
      observedCounts.push(count);
      saga.state = { count };
      return [];
    })
    .build() as SagaDefinition;

  await runtime.register([definition]);
  await runtime.start();
  try {
    await runtime.publish({
      type: 'counter.incremented',
      payload: {},
      correlationKey: 'counter-1' as SagaCorrelationKey,
    });
    await runtime.publish({
      type: 'counter.incremented',
      payload: {},
      correlationKey: 'counter-1' as SagaCorrelationKey,
    });

    const envelope = await store.load('persistent-state:counter-1' as SagaInstanceId);
    assertEquals(observedCounts, [1, 2]);
    assertEquals(envelope?.state, { count: 2 });
    assertEquals(envelope?.metadata.version, 2);
    assertEquals(store.transitions.length, 2);
  } finally {
    await runtime.stop('saga store test complete');
  }
});

Deno.test('native runtime persists transition from snapshot before in-place mutation', async () => {
  const store = new MemorySagaStore();
  const runtime = createSagaRuntime({
    native: { store },
  });
  const definition = defineSaga('mutable-state')
    .state<SagaState>({ nested: { count: 0 } })
    .on('counter.mutated', (saga) => {
      const nested = saga.state.nested as { count: number };
      nested.count += 1;
      return [];
    })
    .build() as SagaDefinition;

  await runtime.register([definition]);
  await runtime.start();
  try {
    await runtime.publish({
      type: 'counter.mutated',
      payload: {},
      correlationKey: 'counter-1' as SagaCorrelationKey,
    });

    assertEquals(store.transitions[0].record.transition.from, { nested: { count: 0 } });
    assertEquals(store.transitions[0].record.transition.to, { nested: { count: 1 } });
  } finally {
    await runtime.stop('mutable state test complete');
  }
});

Deno.test('native runtime persists terminal status from failure and compensation cascades', async () => {
  const store = new MemorySagaStore();
  const runtime = createSagaRuntime({
    native: { store },
  });
  const definition = defineSaga('terminal-status')
    .state<SagaState>({})
    .on('order.failed', () => [sagaFail('payment declined')])
    .on('order.compensating', () => [
      sagaCompensate({ type: 'payment.refund', payload: {} }, 'inventory unavailable'),
    ])
    .build() as SagaDefinition;

  await runtime.register([definition]);
  await runtime.start();
  try {
    await runtime.publish({
      type: 'order.failed',
      payload: {},
      correlationKey: 'failed-1' as SagaCorrelationKey,
    });
    await runtime.publish({
      type: 'order.compensating',
      payload: {},
      correlationKey: 'compensating-1' as SagaCorrelationKey,
    });

    const failed = await store.load('terminal-status:failed-1' as SagaInstanceId);
    const compensating = await store.load('terminal-status:compensating-1' as SagaInstanceId);

    assertEquals(failed?.metadata.status, 'failed');
    assertEquals(store.transitions[0].record.transition.status, 'failed');
    assertEquals(compensating?.metadata.status, 'compensating');
    assertEquals(store.transitions[1].record.transition.status, 'compensating');
  } finally {
    await runtime.stop('terminal status test complete');
  }
});

class MemorySagaStore implements SagaStorePort {
  readonly id = 'memory-saga-store-test';
  readonly envelopes = new Map<SagaInstanceId, SagaStateEnvelope>();
  readonly correlations = new Map<string, SagaInstanceId>();
  readonly transitions: Array<{
    instanceId: SagaInstanceId;
    record: SagaTransitionRecord;
  }> = [];

  load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined> {
    return Promise.resolve(this.envelopes.get(instanceId) as SagaStateEnvelope<TState> | undefined);
  }

  save<TState extends SagaState>(
    envelope: SagaStateEnvelope<TState>,
    options: SagaStoreWriteOptions = {},
  ): Promise<void> {
    const current = this.envelopes.get(envelope.metadata.instanceId);
    if (
      options.expectedVersion !== undefined &&
      current?.metadata.version !== options.expectedVersion
    ) {
      throw new Error('version conflict');
    }
    this.envelopes.set(envelope.metadata.instanceId, envelope);
    return Promise.resolve();
  }

  appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void> {
    this.transitions.push({ instanceId, record });
    return Promise.resolve();
  }

  findByCorrelation(
    sagaId: string,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined> {
    return Promise.resolve(this.correlations.get(`${sagaId}:${correlationKey}`));
  }

  saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void> {
    this.correlations.set(`${entry.sagaId}:${entry.correlationKey}`, entry.instanceId);
    return Promise.resolve();
  }

  delete(instanceId: SagaInstanceId): Promise<void> {
    this.envelopes.delete(instanceId);
    return Promise.resolve();
  }
}
