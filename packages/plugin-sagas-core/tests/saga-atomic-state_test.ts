import { assert, assertEquals, assertRejects } from '@std/assert';
import { DenoKvAdapter, type KvStore, MemoryKvAdapter } from '@netscript/kv';
import { RedisKvAdapter } from '@netscript/kv/redis';
import { KvSagaStore } from '../src/stores/kv-saga-store.ts';
import { createSagaRuntime } from '../src/runtime/create-saga-runtime.ts';
import {
  KvSagaAppliedKeyStore,
  KvSagaIdempotencyStore,
} from '../src/stores/kv-saga-runtime-stores.ts';
import { SagasError } from '../src/domain/mod.ts';
import { defineSaga } from '../mod.ts';
import { isSagaAtomicStore, isSagaTransitionStore } from '../src/ports/mod.ts';
import { transitionRequest } from './transition-conformance.ts';

for (const backend of ['memory', 'kv', 'redis']) {
  Deno.test({
    name: `atomic saga ${backend} commits one replay and retries CAS losers without reserving keys`,
    ignore: backend === 'redis' && !Deno.env.get('NETSCRIPT_TEST_REDIS_URL'),
    async fn() {
      const root = await Deno.makeTempDir();
      const kv: KvStore = backend === 'memory'
        ? new MemoryKvAdapter()
        : backend === 'kv'
        ? new DenoKvAdapter(await Deno.openKv(root + '/test.db'))
        : new RedisKvAdapter({
          url: Deno.env.get('NETSCRIPT_TEST_REDIS_URL')!,
          namespace: crypto.randomUUID(),
        });
      const store = new KvSagaStore({ kv });
      const request = { ...transitionRequest(), commands: [] };
      try {
        assert(isSagaAtomicStore(store));
        assertEquals(isSagaTransitionStore(store), false);
        const replay = await Promise.all(
          Array.from({ length: 12 }, () => store.commitTransition(request)),
        );
        assertEquals(replay.filter((result) => result.committed).length, 1);
        assertEquals((await store.transitions(request.correlation.instanceId)).length, 1);
        const stale = { ...request, appliedKeyHash: 'c'.repeat(64) };
        const conflict = await assertRejects(() => store.commitTransition(stale), SagasError);
        assertEquals(conflict.retryable, true);
        assertEquals(
          await store.hasAppliedTransition(request.correlation.instanceId, stale.appliedKeyHash),
          false,
        );
        const next = { ...transitionRequest(2, 'unused', stale.appliedKeyHash), commands: [] };
        assertEquals(await store.commitTransition(next), { committed: true });
        assertEquals((await store.load(request.correlation.instanceId))?.metadata.version, 2);
        assertEquals((await store.transitions(request.correlation.instanceId)).length, 2);
      } finally {
        await store.close();
        await Deno.remove(root, { recursive: true });
      }
    },
  });
}

Deno.test('persisted KV handler and commit failures leave the same message retryable through the bridge', async () => {
  const root = await Deno.makeTempDir();
  const kv = new DenoKvAdapter(await Deno.openKv(root + '/test.db'));
  let failCommit = false;
  const store = new KvSagaStore({
    kv: new Proxy(kv, {
      get(target, key) {
        const member = Reflect.get(target, key);
        if (key === 'atomic') {
          return (...args: Parameters<NonNullable<KvStore['atomic']>>) => {
            if (failCommit) throw new Error('injected store failure');
            return target.atomic(...args);
          };
        }
        return typeof member === 'function' ? member.bind(target) : member;
      },
    }),
  });
  let handled = 0;
  const definition = defineSaga('retry').state({ count: 0 }).on('start', (saga) => {
    handled++;
    if (handled === 1) throw new Error('injected handler failure');
    saga.state.count++;
    return [];
  }).build();
  const runtime = createSagaRuntime({
    native: {
      store,
      idempotency: new KvSagaIdempotencyStore({ kv }),
      engineOptions: { appliedKeys: new KvSagaAppliedKeyStore({ kv }) },
    },
  });
  try {
    await runtime.register([definition]);
    await runtime.start();
    const message = { type: 'start', payload: {}, idempotencyKey: 'same-message' };
    await assertRejects(() => runtime.publish(message), Error, 'injected handler failure');
    failCommit = true;
    await assertRejects(() => runtime.publish(message), Error, 'injected store failure');
    assertEquals(await store.entries(), []);
    failCommit = false;
    await runtime.publish(message);
    await runtime.publish(message);
    assertEquals(handled, 3);
    const [envelope] = await store.entries();
    assertEquals(envelope.state, { count: 1 });
    assertEquals((await store.transitions(envelope.metadata.instanceId)).length, 1);
  } finally {
    await runtime.stop();
    await store.close();
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('KV rejects unsupported worker commands and correlation theft without any partial rows', async () => {
  const kv = new MemoryKvAdapter();
  const store = new KvSagaStore({ kv });
  try {
    await assertRejects(
      () => store.commitTransition(transitionRequest()),
      TypeError,
      'worker commands',
    );
    assertEquals(await store.entries(), []);
    const request = { ...transitionRequest(), commands: [] };
    await store.saveCorrelation({
      ...request.correlation,
      instanceId: 'other:owner' as typeof request.correlation.instanceId,
    });
    await assertRejects(() => store.commitTransition(request));
    assertEquals(await store.entries(), []);
    assertEquals(await store.transitions(request.correlation.instanceId), []);
    assertEquals(
      await store.hasAppliedTransition(request.correlation.instanceId, request.appliedKeyHash!),
      false,
    );
  } finally {
    await store.close();
  }
});
