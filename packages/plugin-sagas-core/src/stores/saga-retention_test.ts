import type { AtomicCheck, AtomicMutation, KvEntry, KvListOptions } from '@netscript/kv';
import { SagaKvRetention } from './saga-kv-retention.ts';
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

Deno.test('real Deno KV retention pages fit the mutation byte budget for large history values', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = new KvSagaStore({ kv });
  const now = new Date();
  const instanceId = 'large' as SagaInstanceId;
  for (let i = 0; i < 40; i++) {
    await kv.set(['sagas', 'transition', instanceId, i], { payload: 'x'.repeat(50_000) });
  }
  await store.save({
    state: {},
    metadata: {
      instanceId,
      version: 1,
      status: 'completed',
      durability: 't1',
      createdAt: now,
      updatedAt: now,
      completedAt: now,
    },
  });
  for (let i = 0; i < 20; i++) await store.cleanupRetention();
  assertEquals(await kv.get(['sagas', 'retention', instanceId]), null);
  const records = [];
  for await (const record of kv.list({ prefix: ['sagas', 'transition', instanceId] })) {
    records.push(record);
  }
  assertEquals(records.length, 40);
});

const now = new Date('2030-10-10T00:00:00Z');
function envelope(id: string, status: SagaStateEnvelope['metadata']['status']): SagaStateEnvelope {
  return {
    state: { value: 1 },
    metadata: {
      instanceId: id as SagaStateEnvelope['metadata']['instanceId'],
      sagaId: 'legacy',
      status,
      version: 1,
      durability: 't3',
      createdAt: new Date('2030-10-01'),
      updatedAt: new Date('2030-10-01'),
    },
  };
}

async function seed(
  kv: DenoKvAdapter,
  id: string,
  status: SagaStateEnvelope['metadata']['status'],
) {
  await kv.set(['sagas', 'state', id], envelope(id, status));
  // Old forward correlation has no reverse index.
  await kv.set(['sagas', 'correlation', 'legacy', id], id);
  await kv.set(['sagas', 'transition', id, 1], { large: new Uint8Array(63_000) });
  await kv.set(['sagas', 'applied', id, 'first'], { appliedAt: now });
  await kv.set(['saga_instances', 'legacy', id], {
    instanceId: id,
    sagaId: 'legacy',
    status,
    updatedAt: '2030-10-01',
  });
}

Deno.test('legacy saga backfill retires all proven terminal families, resumes and is idempotent on real KV', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  for (const status of ['completed', 'failed', 'cancelled', 'compensated'] as const) {
    await seed(kv, status, status);
  }
  await kv.set(['sagas', 'correlation-instance', 'completed'], { instanceId: 'completed' });
  for (const status of ['pending', 'running', 'compensating'] as const) {
    await seed(kv, status, status);
  }
  await kv.set(['sagas', 'applied', 'unknown-owner', 'keep'], { value: 1 });
  await kv.set(['saga_instances', 'legacy', 'orphan-terminal'], {
    instanceId: 'orphan-terminal',
    sagaId: 'legacy',
    status: 'completed',
    updatedAt: '2030-10-01',
  });
  const first = await new SagaKvRetention(kv, ['sagas'], () => now).backfill(7, 'proof', 1);
  assertEquals(first.scanned, 1);
  assertEquals(first.changed, 1);
  assertEquals(first.done, false);
  assert(await kv.get(['sagas', 'retention-backfill', 'proof']));
  // Recreate the migration owner after every page: no in-memory scan state is required.
  let done = false;
  for (let pass = 0; pass < 100 && !done; pass++) {
    done = (await new SagaKvRetention(kv, ['sagas'], () => now).backfill(7, 'proof', 1)).done;
  }
  assert(done);
  for (const id of ['completed', 'failed', 'cancelled', 'compensated']) {
    for (const family of ['state', 'transition', 'applied']) {
      const keys = [];
      for await (const entry of kv.list({ prefix: ['sagas', family, id] })) keys.push(entry.key);
      // state keys equal the prefix, so get them directly below.
      assertEquals(keys, []);
    }
    assertEquals(await kv.get(['sagas', 'state', id]), null);
    assertEquals(await kv.get(['sagas', 'correlation', 'legacy', id]), null);
    assertEquals(await kv.get(['saga_instances', 'legacy', id]), null);
  }
  assertEquals(await kv.get(['sagas', 'correlation-instance', 'completed']), null);
  assertEquals(await kv.get(['saga_instances', 'legacy', 'orphan-terminal']), null);
  for (const id of ['pending', 'running', 'compensating']) {
    assertEquals(
      (await kv.get<SagaStateEnvelope>(['sagas', 'state', id]))?.value,
      envelope(id, id as SagaStateEnvelope['metadata']['status']),
    );
    assert(await kv.get(['sagas', 'correlation', 'legacy', id]));
    assert(await kv.get(['sagas', 'transition', id, 1]));
    assert(await kv.get(['sagas', 'applied', id, 'first']));
    assert(await kv.get(['saga_instances', 'legacy', id]));
  }
  assert(await kv.get(['sagas', 'applied', 'unknown-owner', 'keep']));
  assertEquals(await new SagaKvRetention(kv, ['sagas'], () => now).backfill(7, 'proof'), {
    done: true,
    scanned: 0,
    changed: 0,
    retained: 0,
    conflicted: false,
  });
});

Deno.test('real KV saga backfill guards open rewrites and leaves checkpoint retryable', async () => {
  class RacingKv extends DenoKvAdapter {
    race = true;
    override async atomic(checks: AtomicCheck[], mutations: AtomicMutation[]) {
      if (this.race && mutations.some((mutation) => mutation.key.includes('retention-backfill'))) {
        this.race = false;
        await this.set(['sagas', 'state', 'completed'], envelope('completed', 'running'));
      }
      return await super.atomic(checks, mutations);
    }
  }
  await using kv = new RacingKv(await Deno.openKv(':memory:'));
  await seed(kv, 'completed', 'completed');
  const migration = new SagaKvRetention(kv, ['sagas'], () => now);
  const raced = await migration.backfill(7, 'race');
  assertEquals(raced.conflicted, true);
  assertEquals(raced.changed, 0);
  assertEquals(await kv.get(['sagas', 'retention-backfill', 'race']), null);
  for (let i = 0; i < 10; i++) await migration.backfill(7, 'race');
  assert(await kv.get(['sagas', 'correlation', 'legacy', 'completed']));
  assert(await kv.get(['sagas', 'transition', 'completed', 1]));
  assert(await kv.get(['sagas', 'applied', 'completed', 'first']));
});

Deno.test('real KV saga backfill caps reads and mutation bytes, uses original per-topic deadlines', async () => {
  class BoundedKv extends DenoKvAdapter {
    listed = 0;
    override async *list<T>(options: KvListOptions): AsyncIterable<KvEntry<T>> {
      assert(options.limit !== undefined && options.limit <= 10);
      for await (const entry of super.list<T>(options)) {
        this.listed++;
        yield entry;
      }
    }
    override async atomic(checks: AtomicCheck[], mutations: AtomicMutation[]) {
      assert(checks.length <= 21);
      assert(mutations.length <= 11);
      return await super.atomic(checks, mutations);
    }
  }
  await using kv = new BoundedKv(await Deno.openKv(':memory:'));
  for (let i = 0; i < 12; i++) await seed(kv, `terminal-${i}`, 'completed');
  const retention = new SagaKvRetention(kv, ['sagas'], () => now);
  let done = false;
  for (let pass = 0; pass < 40 && !done; pass++) {
    kv.listed = 0;
    const result = await retention.backfill(() => 30, 'bounded');
    assert(result.scanned <= 10);
    assertEquals(kv.listed, result.scanned);
    done = result.done;
  }
  assert(done);
  assert(await kv.get(['sagas', 'transition', 'terminal-0', 1]));
  // Re-running with a new identity and clock past the original deadline deletes, never extends.
  const later = new SagaKvRetention(kv, ['sagas'], () => new Date('2030-11-02'));
  for (let i = 0; i < 40; i++) await later.backfill(() => 30, 'later');
  assertEquals(await kv.get(['sagas', 'transition', 'terminal-0', 1]), null);
});

Deno.test('real KV backfill assigns backend TTL to recent legacy saga families without extending settlement', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const settled = new Date(Date.now() - 86_400_000 + 800);
  await seed(kv, 'recent', 'completed');
  await kv.set(['sagas', 'state', 'recent'], {
    ...envelope('recent', 'completed'),
    metadata: { ...envelope('recent', 'completed').metadata, updatedAt: settled },
  });
  const retention = new SagaKvRetention(kv, ['sagas'], () => new Date());
  for (let i = 0; i < 12; i++) await retention.backfill(1, 'ttl');
  assert(await kv.get(['sagas', 'state', 'recent']));
  assert(await kv.get(['sagas', 'transition', 'recent', 1]));
  // Native backend expiry is asynchronous; wait a bounded five seconds for its sweep.
  for (let attempt = 0; attempt < 50 && await kv.has(['sagas', 'state', 'recent']); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assertEquals(await kv.get(['sagas', 'state', 'recent']), null);
  assertEquals(await kv.get(['sagas', 'transition', 'recent', 1]), null);
  assertEquals(await kv.get(['sagas', 'applied', 'recent', 'first']), null);
  assertEquals(await kv.get(['sagas', 'correlation', 'legacy', 'recent']), null);
  assertEquals(await kv.get(['saga_instances', 'legacy', 'recent']), null);
});
