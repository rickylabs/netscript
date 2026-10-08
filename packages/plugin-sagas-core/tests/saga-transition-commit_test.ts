import { assertAtomicTransitionConformance } from './transition-conformance.ts';
import { assertEquals, assertRejects } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { defineSaga } from '../mod.ts';
import { SagaEngine } from '../src/runtime/saga-engine.ts';
import { MemorySagaStore } from '../src/testing/memory-saga-store.ts';
import { KvSagaStore } from '../src/stores/kv-saga-store.ts';
import { PrismaSagaStore, type PrismaSagaStoreClient } from '../src/stores/prisma-saga-store.ts';
import type { SagaCorrelationKey, SagaId, SagaInstanceId, SagaState } from '../src/domain/mod.ts';
const at = new Date('2026-01-01T00:00:00Z');
const instanceId = 'document:one' as SagaInstanceId;
function request(version = 1, identity = 'outbox-one') {
  return {
    expectedVersion: version - 1,
    envelope: {
      metadata: {
        instanceId,
        version,
        status: 'running' as const,
        durability: 't2' as const,
        createdAt: at,
        updatedAt: at,
      },
      state: { count: version },
    },
    correlation: {
      sagaId: 'document' as SagaId,
      correlationKey: 'one' as SagaCorrelationKey,
      instanceId,
    },
    record: {
      version,
      transition: {
        from: { count: version - 1 },
        to: { count: version },
        status: 'running' as const,
        message: { type: 'start', payload: { documentId: 'one' } },
        occurredAt: at,
      },
    },
    commands: [{
      id: identity,
      executionId: identity,
      commandName: 'saga.worker-job.document',
      commandVersion: 1,
      destination: 'workers',
      topic: 'document',
      payloadJson: '{"documentId":"one"}',
      dedupeKey: identity,
      correlationId: 'one',
      availableAt: at,
    }],
    appliedKeyHash: 'a'.repeat(64),
  };
}
async function commit(store: MemorySagaStore, value: ReturnType<typeof request>) {
  return await store.commitTransition(value);
}
function outbox(store: MemorySagaStore) {
  return store.commandIntents();
}

Deno.test('memory atomic transition commits all rows once and rolls back invalid stale or duplicate work', async () => {
  await assertAtomicTransitionConformance(new MemorySagaStore());
  const store = new MemorySagaStore();
  assertEquals(typeof Reflect.get(store, 'commitTransition'), 'function');
  await assertRejects(() =>
    store.commitTransition(request(), AbortSignal.abort(new Error('fault before commit')))
  );
  const invalid = request();
  invalid.record.version = 9;
  await assertRejects(() => commit(store, invalid));
  class NonJsonState {
    [key: string]: unknown;
    count = 1;
  }
  const prototypeState = request();
  const nonJson = new NonJsonState();
  prototypeState.envelope.state = nonJson;
  prototypeState.record.transition.to = nonJson;
  await assertRejects(() => commit(store, prototypeState));
  let getters = 0;
  const accessorState = request();
  Object.defineProperty(accessorState.envelope.state, 'count', {
    enumerable: true,
    get() {
      getters++;
      return 1;
    },
  });
  await assertRejects(() => commit(store, accessorState));
  assertEquals(getters, 0);
  assertEquals(store.entries(), []);
  assertEquals(store.transitions(instanceId), []);
  assertEquals(
    await store.findByCorrelation('document' as SagaId, 'one' as SagaCorrelationKey),
    undefined,
  );
  assertEquals(outbox(store), []);
  const settled = await Promise.allSettled([
    commit(store, request()),
    commit(store, { ...request(1, 'outbox-two'), appliedKeyHash: 'b'.repeat(64) }),
  ]);
  assertEquals(settled.filter((r) => r.status === 'fulfilled').length, 1);
  assertEquals(store.entries().length, 1);
  assertEquals(store.transitions(instanceId).length, 1);
  assertEquals(outbox(store).length, 1);
  assertEquals(
    await store.findByCorrelation('document' as SagaId, 'one' as SagaCorrelationKey),
    instanceId,
  );
  assertEquals(await commit(store, request(2)), { committed: false });
  assertEquals((await store.load(instanceId))?.metadata.version, 1);
  await assertRejects(() => commit(store, { ...request(2), appliedKeyHash: 'c'.repeat(64) }));
  assertEquals((await store.load(instanceId))?.metadata.version, 1);
  assertEquals(store.transitions(instanceId).length, 1);
  assertEquals(outbox(store).length, 1);
  const conflicting = request(1, 'other-command');
  conflicting.envelope.metadata.instanceId = 'document:other' as SagaInstanceId;
  conflicting.correlation.instanceId = conflicting.envelope.metadata.instanceId;
  await assertRejects(() => commit(store, conflicting));
  assertEquals(store.entries().length, 1);
  assertEquals(
    await store.findByCorrelation('document' as SagaId, 'one' as SagaCorrelationKey),
    instanceId,
  );
  const next = { ...request(2, 'outbox-two'), appliedKeyHash: 'c'.repeat(64) };
  assertEquals(await commit(store, next), { committed: true });
  next.envelope.state.count = 99;
  assertEquals((await store.load(instanceId))?.state.count, 2);
});

Deno.test('atomic saga composition refuses KV and unbound Prisma before handler or storage work', async () => {
  let calls = 0;
  const kv = new KvSagaStore({ kv: new MemoryKvAdapter() });
  const prisma = new PrismaSagaStore({
    prisma: new Proxy({} as PrismaSagaStoreClient, {
      get() {
        calls++;
        throw new Error('unexpected database work');
      },
    }),
  });
  const definition = {
    ...defineSaga('document').durableWorkerCommands().state({ count: 0 } as SagaState).on(
      'start' as string,
      () => {
        calls++;
        return [];
      },
    ).build(),
  };
  for (const store of [kv, prisma]) {
    const engine = new SagaEngine({ store });
    await assertRejects(
      async () => await engine.register([definition]),
      Error,
      'atomic transition/outbox',
    );
  }
  assertEquals(calls, 0);
});
