import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { DenoKvAdapter, type KvStore, MemoryKvAdapter } from '@netscript/kv';
import type {
  SagaCorrelationKey,
  SagaInstanceId,
  SagaMessageId,
  SagaStateEnvelope,
} from '../../src/domain/mod.ts';
import {
  type SagaScheduledMessageRecord,
  SagaScheduler,
} from '../../src/runtime/saga-scheduler.ts';
import { KvSagaSchedulerStore } from '../../src/stores/kv-saga-scheduler-store.ts';
import { KvSagaStore } from '../../src/stores/kv-saga-store.ts';
import { KvSagaAppliedKeyStore } from '../../src/stores/kv-saga-runtime-stores.ts';
import { defineSaga } from '../../mod.ts';
import { SagaEngine } from '../../src/runtime/saga-engine.ts';

const DAY = 86_400_000;
const BASE = new Date('2030-01-01T00:00:00Z');
const PREFIX = ['sagas', 'scheduler', 'records'];

function envelope(id: string, status: SagaStateEnvelope['metadata']['status']): SagaStateEnvelope {
  return {
    state: { count: 1 },
    metadata: {
      instanceId: id as SagaInstanceId,
      sagaId: id,
      status,
      version: 1,
      durability: 't3',
      createdAt: BASE,
      updatedAt: BASE,
      ...(status === 'completed' ? { completedAt: BASE } : {}),
    },
  };
}

function fixture(kv: KvStore) {
  let now = BASE;
  const clock = { id: 'retention-test', now: () => now, sleep: () => Promise.resolve() };
  const canonical = new KvSagaStore({ kv, now: clock.now, completedRetentionDays: 1 });
  const store = new KvSagaSchedulerStore({ kv, now: clock.now });
  const deliveries: string[] = [];
  const create = () => {
    const scheduler = new SagaScheduler({
      clock,
      store: new KvSagaSchedulerStore({ kv, now: clock.now }),
      dispatch: (message) => {
        deliveries.push('type' in message ? message.type : message.kind);
        return Promise.resolve();
      },
    });
    scheduler.bindRetentionStore?.(canonical, { completedRetentionDays: 1 });
    return scheduler;
  };
  return {
    canonical,
    store,
    create,
    deliveries,
    clock,
    advance: (ms: number) => now = new Date(BASE.getTime() + ms),
  };
}

async function records(kv: KvStore): Promise<SagaScheduledMessageRecord[]> {
  const result: SagaScheduledMessageRecord[] = [];
  for await (const entry of kv.list<SagaScheduledMessageRecord>({ prefix: PREFIX })) {
    result.push(entry.value);
  }
  return result;
}

for (const backend of ['real-kv', 'memory'] as const) {
  Deno.test(`core scheduler ${backend}: all terminal families delete at origin deadline; open and legacy survive restart`, async () => {
    await using kv = backend === 'real-kv'
      ? new DenoKvAdapter(await Deno.openKv(':memory:'))
      : new MemoryKvAdapter();
    const f = fixture(kv);
    const scheduler = f.create();
    const statuses = [
      'completed',
      'failed',
      'cancelled',
      'compensated',
      'pending',
      'running',
      'compensating',
    ] as const;
    for (const status of statuses) {
      // Schedule while open, then transition; a sweep must discover the terminal deadline.
      await f.canonical.save(envelope(status, 'running'));
      const scheduled = await scheduler.schedule(
        {
          type: status,
          payload: {},
          idempotencyKey: status,
          correlationKey: 'other-destination' as SagaCorrelationKey,
        },
        new Date(BASE.getTime() + 30 * DAY),
        status as SagaInstanceId,
      );
      await f.canonical.save(envelope(status, status));
      if (['completed', 'failed', 'cancelled', 'compensated'].includes(status)) {
        for (const outcome of ['claimed', 'dispatched', 'failed'] as const) {
          await f.store.save({
            ...scheduled,
            id: `${scheduled.id}:${outcome}` as SagaMessageId,
            status: outcome,
          });
        }
      }
    }
    await scheduler.schedule({ type: 'legacy', payload: {} }, BASE);
    while (await f.create().cleanupRetention?.()) { /* assign deadlines in bounded pages */ }
    const before = await records(kv);
    for (const status of statuses) {
      const record = before.find((record) => record.instanceId === status)!;
      assertEquals(
        record.expiresAt?.getTime(),
        ['pending', 'running', 'compensating'].includes(status) ? undefined : BASE.getTime() + DAY,
      );
    }
    f.advance(DAY + 1);
    // Re-create the scheduler for every pass: cleanup progress is durable, no app read drives it.
    while (await f.create().cleanupRetention?.()) {
      /* each awaited pass advances a bounded page */
    }
    assertEquals(
      (await records(kv)).map((record) => 'type' in record.message ? record.message.type : '')
        .sort(),
      ['compensating', 'legacy', 'pending', 'running'],
    );
    assertEquals((await f.canonical.load('running' as SagaInstanceId))?.state.count, 1);
    // Replaying old terminal schedules must neither recreate records nor renew their deadlines.
    for (const status of statuses.slice(0, 4)) {
      await f.create().schedule(
        { type: status, payload: {}, idempotencyKey: status },
        new Date(BASE.getTime() + 30 * DAY),
        status as SagaInstanceId,
      );
    }
    assertEquals((await records(kv)).length, 4);
  });
}

Deno.test('core scheduler real-kv: due delivery checks origin, keeps terminal followups inside window and withholds expired origins', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const f = fixture(kv);
  const scheduler = f.create();
  await f.canonical.save(envelope('inside', 'completed'));
  await scheduler.schedule(
    { type: 'followup', payload: {}, idempotencyKey: 'followup' },
    BASE,
    'inside' as SagaInstanceId,
  );
  await f.canonical.save(envelope('outside', 'running'));
  await scheduler.schedule({ type: 'expired', payload: {} }, BASE, 'outside' as SagaInstanceId);
  await f.canonical.save(envelope('outside', 'failed'));
  f.advance(DAY + 1);
  // Fresh completion is still inside its window; the old origin is past its window.
  await f.canonical.save({
    ...envelope('inside', 'completed'),
    metadata: { ...envelope('inside', 'completed').metadata, completedAt: f.clock.now() },
  });
  // Replace the earlier scheduled record with a fresh open-origin schedule to test dispatch within window.
  await f.canonical.save(envelope('live', 'running'));
  await scheduler.schedule(
    { type: 'live-followup', payload: {} },
    f.clock.now(),
    'live' as SagaInstanceId,
  );
  await f.canonical.save({
    ...envelope('live', 'completed'),
    metadata: { ...envelope('live', 'completed').metadata, completedAt: f.clock.now() },
  });
  await scheduler.start();
  const result = await scheduler.drainDue();
  assertEquals(result.cancelled, 1);
  assertEquals(f.deliveries, ['live-followup']);
  assertEquals((await records(kv)).some((record) => record.instanceId === 'outside'), false);
  await scheduler.stop();
});

Deno.test('core scheduler real-kv: replay preserves dispatched and failed outcomes and their absolute deadlines', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const f = fixture(kv);
  await f.canonical.save(envelope('origin', 'completed'));
  const scheduler = f.create();
  const message = { type: 'replay', payload: {}, idempotencyKey: 'same-effect' };
  const original = await scheduler.schedule(message, BASE, 'origin' as SagaInstanceId);
  await scheduler.start();
  await scheduler.drainDue();
  f.advance(DAY / 2);
  const replay = await scheduler.schedule(message, BASE, 'origin' as SagaInstanceId);
  assertEquals(replay.id, original.id);
  assertEquals((await records(kv))[0]?.status, 'dispatched');
  assertEquals((await records(kv))[0]?.expiresAt?.getTime(), BASE.getTime() + DAY);
  await scheduler.drainDue();
  assertEquals(f.deliveries, ['replay']);
  const failure = await scheduler.schedule(
    { ...message, idempotencyKey: 'failure' },
    BASE,
    'origin' as SagaInstanceId,
  );
  const [claim] = await f.store.claimDue(f.clock.now(), 10);
  assert(claim);
  await f.store.markFailed(failure.id, f.clock.now(), 'unavailable', claim);
  await scheduler.schedule(
    { ...message, idempotencyKey: 'failure' },
    BASE,
    'origin' as SagaInstanceId,
  );
  assertEquals((await records(kv)).find((record) => record.id === failure.id)?.status, 'failed');
  f.advance(DAY + 1);
  while (await f.create().cleanupRetention?.()) { /* durable pages */ }
  assertEquals(await records(kv), []);
  await scheduler.stop();
});

Deno.test('core scheduler real-kv: bounded pages advance past an active prefix across restart and respect full-size values', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const f = fixture(kv);
  await f.canonical.save(envelope('active', 'running'));
  await f.canonical.save(envelope('terminal', 'failed'));
  for (let i = 0; i < 23; i++) {
    const record: SagaScheduledMessageRecord = {
      id: String(i).padStart(3, '0') as SagaMessageId,
      message: { type: 'bounded', payload: { data: 'x'.repeat(60_000) } },
      instanceId: (i < 12 ? 'active' : 'terminal') as SagaInstanceId,
      status: 'pending',
      attempts: 0,
      createdAt: BASE,
      scheduledFor: new Date(BASE.getTime() + 30 * DAY),
    };
    await f.store.save(record);
  }
  f.advance(DAY + 1);
  assertEquals(await f.create().cleanupRetention?.(), true);
  assertEquals((await records(kv)).length, 23); // first ten are active
  assertEquals(await f.create().cleanupRetention?.(), true);
  assertEquals((await records(kv)).length, 15); // bounded second page removes eight
  assertEquals(await f.create().cleanupRetention?.(), false);
  assertEquals((await records(kv)).length, 12);
  assertEquals((await records(kv)).every((record) => record.instanceId === 'active'), true);
});

Deno.test('core scheduler real-kv: cancellation and retention CAS preserve concurrent rewrites; late outcomes never resurrect deletion', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const f = fixture(kv);
  await f.canonical.save(envelope('origin', 'running'));
  const record = await f.create().schedule(
    { type: 'race', payload: {} },
    BASE,
    'origin' as SagaInstanceId,
  );
  const [claim] = await f.store.claimDue(BASE, 10);
  assert(claim);
  const key = [...PREFIX, record.id];
  const rewritten = {
    ...claim,
    revision: 'rewritten',
    instanceId: 'replacement' as SagaInstanceId,
  };
  await kv.set(key, rewritten);
  assertEquals(await f.store.cancel(claim), false);
  await f.store.markDispatched(record.id, BASE, claim);
  assertEquals((await kv.get<SagaScheduledMessageRecord>(key))?.value.status, 'claimed');
  // Pause by an explicit promise signal from the storage callback, never timing/polling.
  let observed!: () => void;
  let resume!: () => void;
  const observedPromise = new Promise<void>((resolve) => observed = resolve);
  const resumePromise = new Promise<void>((resolve) => resume = resolve);
  const sweep = f.store.cleanupRetention(async () => {
    observed();
    await resumePromise;
    return [BASE];
  }, BASE);
  await observedPromise;
  await kv.set(key, { ...rewritten, revision: 'newer', status: 'pending' });
  resume();
  await sweep;
  assertEquals((await kv.get<SagaScheduledMessageRecord>(key))?.value.revision, 'newer');
  const latest = (await kv.get<SagaScheduledMessageRecord>(key))!.value;
  assertEquals(await f.store.cancel(latest), true);
  await f.store.markFailed(record.id, BASE, 'late', claim);
  await f.store.markDispatched(record.id, BASE, claim);
  assertEquals(await kv.get(key), null);
});

Deno.test('core scheduler real-kv: failed canonical reads retain recoverable claims; expired leases retry after restart', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const f = fixture(kv);
  await f.canonical.save(envelope('open', 'running'));
  await f.create().schedule({ type: 'retry', payload: {} }, BASE, 'open' as SagaInstanceId);
  const scheduler = f.create();
  scheduler.bindRetentionStore({
    id: 'unavailable',
    load: () => Promise.reject(new Error('canonical unavailable')),
    save: () => Promise.resolve(),
    appendTransition: () => Promise.resolve(),
    findByCorrelation: () => Promise.resolve(undefined),
    saveCorrelation: () => Promise.resolve(),
    delete: () => Promise.resolve(),
  });
  await scheduler.start();
  await assertRejects(() => scheduler.drainDue(), Error, 'canonical unavailable');
  assertEquals((await records(kv))[0]?.status, 'claimed');
  await scheduler.stop();
  f.advance(30_001);
  const restarted = f.create();
  await restarted.start();
  await restarted.drainDue();
  assertEquals(f.deliveries, ['retry']);
  assertEquals((await records(kv))[0]?.attempts, 2);
  assertThrows(() => restarted.bindRetentionStore(f.canonical), Error, 'before startup');
  assertThrows(() => restarted.start(), Error, 'already running');
  await restarted.stop();
});

Deno.test('core scheduler real-kv: outer cascade keys replay stably and separate identical timers from different origins', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const f = fixture(kv);
  await f.canonical.save(envelope('one', 'running'));
  await f.canonical.save(envelope('two', 'running'));
  const scheduler = f.create();
  const cascade = {
    kind: 'scheduled' as const,
    message: { type: 'same', payload: {} },
    scheduledFor: new Date(BASE.getTime() + 30 * DAY),
    idempotencyKey: 'outer-key',
  };
  const one = await scheduler.scheduleCascaded(cascade, { instanceId: 'one' as SagaInstanceId });
  const two = await scheduler.scheduleCascaded(cascade, { instanceId: 'two' as SagaInstanceId });
  assert(one.id !== two.id);
  f.advance(DAY);
  const replay = await f.create().scheduleCascaded(cascade, {
    instanceId: 'one' as SagaInstanceId,
  });
  assertEquals(replay.id, one.id);
  assertEquals((await records(kv)).length, 2);
  assertEquals(
    (await records(kv)).every((record) => record.message.idempotencyKey === 'outer-key'),
    true,
  );
});

Deno.test('core scheduler real-kv: open timers preserve engine replay markers and transition history beyond the terminal window', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const f = fixture(kv);
  const definition = defineSaga('retained-open')
    .state({ count: 0 })
    .on('Tick', (saga) => {
      saga.state = { count: saga.state.count + 1 };
      return [];
    })
    .build();
  const createEngine = () =>
    new SagaEngine({
      store: f.canonical,
      appliedKeys: new KvSagaAppliedKeyStore({ kv, now: f.clock.now, completedRetentionDays: 1 }),
    });
  const inbound = {
    type: 'Tick',
    payload: {},
    correlationKey: 'one' as SagaCorrelationKey,
    idempotencyKey: 'first',
  };
  const engine = createEngine();
  await engine.register([definition]);
  await engine.start();
  await engine.handle(inbound);
  await engine.stop();
  const origin = 'retained-open:one' as SagaInstanceId;
  await f.create().schedule(
    { type: 'timer', payload: {} },
    new Date(BASE.getTime() + 60 * DAY),
    origin,
  );
  f.advance(30 * DAY);
  while (await f.create().cleanupRetention?.()) { /* durable pages */ }
  const restarted = createEngine();
  await restarted.register([definition]);
  await restarted.start();
  const [result] = await restarted.handle(inbound);
  assertEquals(result?.alreadyApplied, true);
  assertEquals((await f.canonical.load(origin))?.state.count, 1);
  assertEquals((await records(kv)).length, 1);
  const history = [];
  for await (const entry of kv.list({ prefix: ['sagas', 'transition', origin] })) {
    history.push(entry);
  }
  assertEquals(history.length, 1);
  await restarted.stop();
});
