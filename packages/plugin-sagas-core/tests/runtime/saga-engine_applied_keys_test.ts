import { assertEquals } from '@std/assert';

import { defineSaga } from '../../mod.ts';
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
import { createSagaEngine, MemorySagaAppliedKeyStore } from '../../src/runtime/mod.ts';

Deno.test('SagaEngine short-circuits duplicate applied keys before handler effects persist', async () => {
  let handled = 0;
  const store = new MemorySagaStore();
  const engine = createSagaEngine({
    store,
    appliedKeys: new MemorySagaAppliedKeyStore(),
  });
  const definition = countingSaga('applied-guard', 'order.created', () => {
    handled += 1;
  });

  await engine.register([definition]);
  await engine.start();
  try {
    const first = await engine.handle({
      type: 'order.created',
      payload: {},
      correlationKey: 'order-1' as SagaCorrelationKey,
      idempotencyKey: 'request-1',
    });
    const second = await engine.handle({
      type: 'order.created',
      payload: {},
      correlationKey: 'order-1' as SagaCorrelationKey,
      idempotencyKey: 'request-1',
    });

    assertEquals(first[0].alreadyApplied, false);
    assertEquals(second[0].alreadyApplied, true);
    assertEquals(handled, 1);
    assertEquals(store.saveCount, 1);
    assertEquals(store.transitions.length, 1);
    assertEquals(second[0].state, { count: 1 });
  } finally {
    await engine.stop('applied-key test complete');
  }
});

Deno.test('SagaEngine applies messages without idempotency keys unchanged', async () => {
  let handled = 0;
  const store = new MemorySagaStore();
  const engine = createSagaEngine({ store });
  const definition = countingSaga('unguarded', 'order.created', () => {
    handled += 1;
  });

  await engine.register([definition]);
  await engine.start();
  try {
    await engine.handle({
      type: 'order.created',
      payload: {},
      correlationKey: 'order-1' as SagaCorrelationKey,
    });
    await engine.handle({
      type: 'order.created',
      payload: {},
      correlationKey: 'order-1' as SagaCorrelationKey,
    });

    assertEquals(handled, 2);
    assertEquals(store.saveCount, 2);
    assertEquals(store.transitions.length, 2);
  } finally {
    await engine.stop('unguarded applied-key test complete');
  }
});

Deno.test('SagaEngine scopes applied keys by saga instance', async () => {
  let handled = 0;
  const store = new MemorySagaStore();
  const appliedKeys = new MemorySagaAppliedKeyStore();
  const engine = createSagaEngine({ store, appliedKeys });
  const definition = countingSaga('scope', 'order.created', () => {
    handled += 1;
  });

  await engine.register([definition]);
  await engine.start();
  try {
    await engine.handle({
      type: 'order.created',
      payload: {},
      correlationKey: 'order-1' as SagaCorrelationKey,
      idempotencyKey: 'request-1',
    });
    await engine.handle({
      type: 'order.created',
      payload: {},
      correlationKey: 'order-2' as SagaCorrelationKey,
      idempotencyKey: 'request-1',
    });
    await engine.handle({
      type: 'order.created',
      payload: {},
      correlationKey: 'order-1' as SagaCorrelationKey,
      idempotencyKey: 'request-2',
    });

    assertEquals(handled, 3);
    assertEquals(store.saveCount, 3);
  } finally {
    await engine.stop('applied-key scoping test complete');
  }
});

Deno.test('SagaEngine publish options supply idempotency keys for raw engine consumers', async () => {
  let handled = 0;
  const store = new MemorySagaStore();
  const engine = createSagaEngine({ store });
  const definition = countingSaga('publish-options', 'order.created', () => {
    handled += 1;
  });

  await engine.register([definition]);
  await engine.start();
  try {
    await engine.publish({
      type: 'order.created',
      payload: {},
      correlationKey: 'order-1' as SagaCorrelationKey,
    }, { idempotencyKey: 'request-1' });
    await engine.publish({
      type: 'order.created',
      payload: {},
      correlationKey: 'order-1' as SagaCorrelationKey,
    }, { idempotencyKey: 'request-1' });

    assertEquals(handled, 1);
    assertEquals(store.saveCount, 1);
  } finally {
    await engine.stop('publish options applied-key test complete');
  }
});

Deno.test('MemorySagaAppliedKeyStore records first application and rejects duplicates', async () => {
  const store = new MemorySagaAppliedKeyStore();
  const instanceId = 'memory:test' as SagaInstanceId;

  assertEquals((await store.recordApplied(instanceId, 'request-1')).applied, true);
  assertEquals((await store.recordApplied(instanceId, 'request-1')).applied, false);
  assertEquals((await store.recordApplied(instanceId, 'request-2')).applied, true);
  assertEquals(
    (await store.recordApplied('memory:other' as SagaInstanceId, 'request-1')).applied,
    true,
  );
});

function countingSaga(
  sagaId: string,
  eventType: string,
  observe: () => void,
): SagaDefinition {
  return defineSaga(sagaId)
    .state<SagaState>({ count: 0 })
    .on(eventType, (saga) => {
      observe();
      saga.state = { count: Number(saga.state.count ?? 0) + 1 };
      return [];
    })
    .build() as SagaDefinition;
}

class MemorySagaStore implements SagaStorePort {
  readonly id = 'memory-saga-applied-key-test';
  readonly envelopes = new Map<SagaInstanceId, SagaStateEnvelope>();
  readonly correlations = new Map<string, SagaInstanceId>();
  readonly transitions: Array<{
    instanceId: SagaInstanceId;
    record: SagaTransitionRecord;
  }> = [];
  saveCount = 0;

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
    this.saveCount += 1;
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
