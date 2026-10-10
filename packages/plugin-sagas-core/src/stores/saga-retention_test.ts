import { assertEquals } from 'jsr:@std/assert@^1';
import { FakeTime } from 'jsr:@std/testing@^1/time';
import { MemoryKvAdapter } from '@netscript/kv';
import { defineSaga, sagaComplete } from '../../mod.ts';
import { SagaEngine } from '../runtime/saga-engine.ts';
import type { SagaCorrelationKey, SagaInstanceId, SagaState } from '../domain/mod.ts';
import { KvSagaStore } from './kv-saga-store.ts';
import { KvSagaAppliedKeyStore } from './kv-saga-runtime-stores.ts';

Deno.test('saga retention preserves open replay safety past the window and expires every terminal KV family', async () => {
  using time = new FakeTime('2026-10-10T00:00:00Z');
  await using kv = new MemoryKvAdapter();
  const store = new KvSagaStore({ kv, completedRetentionDays: 1 });
  const applied = new KvSagaAppliedKeyStore({ kv, completedRetentionDays: 1, activeTtlMs: 1 });
  const definition = defineSaga('retained')
    .state<SagaState>({ count: 0 })
    .on('Tick', (saga) => {
      saga.state = { count: Number(saga.state.count) + 1 };
      return [];
    })
    .on('Done', () => [sagaComplete()])
    .build();
  const engine = new SagaEngine({ store, appliedKeys: applied });
  await engine.register([definition]);
  await engine.start();
  const correlationKey = 'one' as SagaCorrelationKey;
  const instanceId = 'retained:one' as SagaInstanceId;
  await engine.handle({ type: 'Tick', payload: {}, correlationKey, idempotencyKey: 'first' });
  time.tick(2 * 86_400_000);
  const restarted = new SagaEngine({ store, appliedKeys: applied });
  await restarted.register([definition]);
  await restarted.start();
  const [duplicate] = await restarted.handle({
    type: 'Tick',
    payload: {},
    correlationKey,
    idempotencyKey: 'first',
  });
  assertEquals(duplicate?.alreadyApplied, true);
  await restarted.handle({ type: 'Tick', payload: {}, correlationKey, idempotencyKey: 'second' });
  assertEquals((await store.load(instanceId))?.state.count, 2);
  await restarted.handle({ type: 'Done', payload: {}, correlationKey, idempotencyKey: 'done' });
  // Restart the retention store between pages to prove the migration cursor is persisted.
  for (let i = 0; i < 12; i++) {
    await new KvSagaStore({ kv, completedRetentionDays: 1 }).cleanupRetention(1);
  }
  const before = [];
  for await (const entry of kv.list({ prefix: ['sagas'] })) before.push(entry.key[1]);
  assertEquals(
    new Set(before),
    new Set(['state', 'correlation', 'correlation-instance', 'transition', 'applied']),
  );
  time.tick(86_400_001);
  const remaining = [];
  for await (const entry of kv.list({ prefix: ['sagas'] })) remaining.push(entry.key);
  assertEquals(remaining, []);
  assertEquals(await store.load(instanceId), undefined);
  await engine.stop();
  await restarted.stop();
});
