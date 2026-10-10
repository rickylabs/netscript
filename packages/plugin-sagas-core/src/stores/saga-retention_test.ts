import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { FakeTime } from 'jsr:@std/testing@^1/time';
import { DenoKvAdapter, MemoryKvAdapter } from '@netscript/kv';
import { defineSaga, sagaComplete } from '../../mod.ts';
import { SagaEngine } from '../runtime/saga-engine.ts';
import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaState,
  SagaStateEnvelope,
} from '../domain/mod.ts';
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

for (const pageSize of [100, 1]) {
  Deno.test(`real Deno KV retention fits atomic limits and advances pages of ${pageSize}`, async () => {
    await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
    let now = new Date();
    const store = new KvSagaStore({ kv, now: () => now, completedRetentionDays: 7 });
    const applied = new KvSagaAppliedKeyStore({ kv, now: () => now });
    const definition = defineSaga('real-retained')
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
    try {
      for (let i = 0; i < 120; i++) {
        await engine.handle({
          type: 'Tick',
          payload: {},
          correlationKey: 'one' as SagaCorrelationKey,
          idempotencyKey: `tick-${i}`,
        });
      }
      await engine.handle({
        type: 'Done',
        payload: {},
        correlationKey: 'one' as SagaCorrelationKey,
        idempotencyKey: 'done',
      });
      // First migrate while records remain present: this catches inclusive-start overlap at size one.
      for (let i = 0; i < 250; i++) {
        await new KvSagaStore({ kv, now: () => now }).cleanupRetention(pageSize);
      }
      assertEquals(await kv.get(['sagas', 'retention', 'real-retained:one']), null);
      assertEquals((await store.transitions('real-retained:one' as SagaInstanceId)).length, 121);
      // Re-enqueue migration and advance only the policy clock to prove bounded expired-history deletion.
      const terminal = (await store.load('real-retained:one' as SagaInstanceId))!;
      await store.save(terminal);
      now = new Date(now.getTime() + 8 * 86_400_000);
      for (let i = 0; i < 500; i++) await store.cleanupRetention(pageSize);
      const remaining = [];
      for await (const entry of kv.list({ prefix: ['sagas', 'applied', 'real-retained:one'] })) {
        remaining.push(entry);
      }
      assertEquals(remaining, []);
      assertEquals(await store.transitions('real-retained:one' as SagaInstanceId), []);
      assertEquals(await kv.get(['sagas', 'retention', 'real-retained:one']), null);
    } finally {
      await engine.stop();
    }
  });
}

Deno.test('applied-key atomic checks reject concurrent state changes without recording an unbounded key', async () => {
  class RacingKv extends MemoryKvAdapter {
    override async atomic(
      checks: Parameters<MemoryKvAdapter['atomic']>[0],
      mutations: Parameters<MemoryKvAdapter['atomic']>[1],
    ) {
      await this.set(['sagas', 'state', 'raced'], { changed: true });
      return await super.atomic(checks, mutations);
    }
  }
  await using kv = new RacingKv();
  const applied = new KvSagaAppliedKeyStore({ kv });
  await assertRejects(
    () => applied.recordApplied('raced' as SagaInstanceId, 'key'),
    Error,
    'retry the message',
  );
  assertEquals(await kv.get(['sagas', 'applied', 'raced', 'key']), null);
});

Deno.test('known engine envelope and correlation avoid per-step retention reads', async () => {
  class CountingKv extends MemoryKvAdapter {
    reads: string[] = [];
    override get<T>(key: Parameters<MemoryKvAdapter['get']>[0]) {
      this.reads.push(String(key[1]));
      return super.get<T>(key);
    }
  }
  await using kv = new CountingKv();
  const engine = new SagaEngine({ store: new KvSagaStore({ kv }) });
  const definition = defineSaga('read-budget').state<SagaState>({ count: 0 })
    .on('Tick', () => []).build();
  await engine.register([definition]);
  await engine.start();
  try {
    await engine.handle({ type: 'Tick', payload: {}, correlationKey: 'one' as SagaCorrelationKey });
    // Correlation lookup + engine state + save CAS. No reverse-index or follow-up envelope reads.
    assertEquals(kv.reads, ['correlation', 'state', 'state']);
  } finally {
    await engine.stop();
  }
});

Deno.test('real Deno KV rejects stale open retention context after a concurrent terminal sweep', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  let now = new Date();
  const first = new KvSagaStore({ kv, now: () => now });
  const second = new KvSagaStore({ kv, now: () => now });
  const instanceId = 'concurrent:one' as SagaInstanceId;
  const open: SagaStateEnvelope = {
    state: {},
    metadata: {
      instanceId,
      version: 1,
      status: 'running',
      durability: 't1',
      createdAt: now,
      updatedAt: now,
    },
  };
  const correlation = {
    sagaId: 'concurrent' as SagaId,
    correlationKey: 'one' as SagaCorrelationKey,
    instanceId,
  };
  await first.save(open, { correlation });
  const terminal: SagaStateEnvelope = {
    ...open,
    metadata: {
      ...open.metadata,
      version: 2,
      status: 'completed',
      completedAt: now,
    },
  };
  await second.save(terminal);
  for (let i = 0; i < 8; i++) await second.cleanupRetention();
  assertEquals(await kv.get(['sagas', 'retention', instanceId]), null);
  now = new Date(now.getTime() + 8 * 86_400_000);
  await first.appendTransition(instanceId, {
    version: 1,
    transition: {
      from: {},
      to: {},
      status: 'running',
      message: { type: 'Tick', payload: {} },
      occurredAt: now,
    },
  }, open);
  await first.saveCorrelation(correlation, open);
  assertEquals(await kv.get(['sagas', 'transition', instanceId, 1]), null);
  assertEquals(await kv.get(['sagas', 'correlation', 'concurrent', 'one']), null);
  assertEquals(await kv.get(['sagas', 'correlation-instance', instanceId]), null);
});
