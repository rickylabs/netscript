import { assert, assertEquals, assertRejects } from '@std/assert';
import { DenoKvAdapter, type KvStore, MemoryKvAdapter } from '@netscript/kv';
import { RedisKvAdapter } from '@netscript/kv/redis';
import { defineSaga, sagaCompensate } from '../mod.ts';
import { createSagaRuntime } from '../src/runtime/create-saga-runtime.ts';
import { SagaCompensator } from '../src/runtime/saga-compensator.ts';
import { TestSagaClock } from '../src/testing/mod.ts';
import { KvSagaStore } from '../src/stores/kv-saga-store.ts';
import { transitionRequest } from './transition-conformance.ts';

for (const backend of ['memory', 'kv', 'redis']) {
  for (const proof of ['dates', 'compensation']) {
    Deno.test({
      name: `KV saga ${backend} round trip preserves ${proof}`,
      ignore: backend === 'redis' && !Deno.env.get('NETSCRIPT_TEST_REDIS_URL'),
      async fn() {
        const root = await Deno.makeTempDir();
        const kv: KvStore = backend === 'memory'
          ? new MemoryKvAdapter()
          : backend === 'kv'
          ? new DenoKvAdapter(await Deno.openKv(root + '/state.kv'))
          : new RedisKvAdapter({
            url: Deno.env.get('NETSCRIPT_TEST_REDIS_URL')!,
            namespace: crypto.randomUUID(),
          });
        const store = new KvSagaStore({
          kv,
          now: () => proof === 'dates' ? new Date(0) : new Date(),
        });
        try {
          if (proof === 'dates') await proveDates(store);
          else await proveCompensation(store);
        } finally {
          await store.close();
          await Deno.remove(root, { recursive: true });
        }
      },
    });
  }
}

Deno.test('KV saga rejects invalid persisted metadata dates', async () => {
  const kv = new MemoryKvAdapter();
  const store = new KvSagaStore({ kv });
  const { envelope } = transitionRequest();
  try {
    await kv.set(['sagas', 'state', envelope.metadata.instanceId], {
      ...envelope,
      metadata: { ...envelope.metadata, createdAt: 'invalid-date' },
    });
    await assertRejects(
      () => store.load(envelope.metadata.instanceId),
      TypeError,
      'Invalid persisted saga date',
    );
  } finally {
    await store.close();
  }
});

async function proveDates(store: KvSagaStore): Promise<void> {
  const request = { ...transitionRequest(), commands: [] };
  request.envelope.metadata.status = 'completed';
  request.envelope.metadata.completedAt = new Date(0);
  request.record.transition.status = 'completed';
  await store.commitTransition(request);
  const id = request.envelope.metadata.instanceId;
  const envelopes = [
    await store.load(id),
    ...(await store.loadMany([id])),
    ...(await store.entries()),
  ];
  for (const envelope of envelopes) {
    assert(envelope);
    assert(envelope.metadata.createdAt instanceof Date);
    assert(envelope.metadata.updatedAt instanceof Date);
    assert(envelope.metadata.completedAt instanceof Date);
    assertEquals(envelope.metadata.createdAt.getTime(), 0);
    assertEquals(envelope.metadata.updatedAt.getTime(), 0);
    assertEquals(envelope.metadata.completedAt.getTime(), 0);
    assertEquals(envelope.state.createdAt, 'business-string');
  }
  const [record] = await store.transitions(id);
  assert(record.transition.occurredAt instanceof Date);
  assert(record.transition.message.occurredAt instanceof Date);
  assertEquals(record.transition.occurredAt.getTime(), 0);
  assertEquals(record.transition.message.occurredAt.getTime(), 0);
}

async function proveCompensation(store: KvSagaStore): Promise<void> {
  const definition = defineSaga('roundtrip-compensation').state({ compensated: false })
    .on('requested', () => [sagaCompensate({ type: 'undo', payload: {} }, 'round trip')])
    .compensate('undo', (saga) => {
      saga.state = { compensated: true };
      return [];
    }).build();
  const runtime = createSagaRuntime({
    native: { store, compensator: new SagaCompensator({ clock: new TestSagaClock() }) },
  });
  try {
    await runtime.register([definition]);
    await runtime.start();
    const message = { type: 'requested', payload: {}, idempotencyKey: 'same-request' };
    await runtime.publish(message);
    await runtime.publish(message);
    const [envelope] = await store.entries();
    assertEquals(envelope.state, { compensated: true });
    assertEquals(envelope.metadata.version, 2);
    assertEquals((await store.transitions(envelope.metadata.instanceId)).length, 2);
  } finally {
    await runtime.stop();
  }
}
