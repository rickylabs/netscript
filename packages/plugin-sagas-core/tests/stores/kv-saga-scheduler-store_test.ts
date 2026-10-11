import { assert, assertEquals } from '@std/assert';
import { type AtomicCheck, type AtomicMutation, DenoKvAdapter } from '@netscript/kv';
import type { SagaInstanceId, SagaMessageId } from '../../src/domain/mod.ts';
import {
  type SagaScheduledMessageRecord,
  SagaScheduler,
} from '../../src/runtime/saga-scheduler.ts';
import { KvSagaSchedulerStore } from '../../src/stores/kv-saga-scheduler-store.ts';

const BASE = new Date('2030-01-01T00:00:00Z');
const PREFIX = ['sagas', 'scheduler'];

function record(id: string, scheduledFor = BASE): SagaScheduledMessageRecord {
  return {
    id: id as SagaMessageId,
    message: { type: id, payload: {} },
    createdAt: BASE,
    scheduledFor,
    status: 'pending',
    attempts: 0,
  };
}

async function dueKeys(kv: DenoKvAdapter) {
  const keys = [];
  for await (const entry of kv.list({ prefix: [...PREFIX, 'due'] })) keys.push(entry.key);
  return keys;
}

Deno.test('scheduler real-kv: one drain reaches due work behind 200 future and retained outcomes', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = new KvSagaSchedulerStore({ kv, now: () => BASE });
  for (let i = 0; i < 200; i++) {
    await store.save({
      ...record(`a-${i}`, new Date(BASE.getTime() + 60_000)),
      status: i % 2 ? 'dispatched' : 'pending',
    });
  }
  await store.save(record('z-due'));
  const delivered: string[] = [];
  const scheduler = new SagaScheduler({
    clock: { id: 'due-index-test', now: () => BASE, sleep: () => Promise.resolve() },
    store,
    dispatch: (message) => {
      delivered.push('type' in message ? message.type : message.kind);
      return Promise.resolve();
    },
  });
  await scheduler.start();
  await scheduler.drainDue();
  assertEquals(delivered, ['z-due']);
  assertEquals((await dueKeys(kv)).length, 100); // outcomes never occupy the due index
  await scheduler.stop();
});

Deno.test('scheduler real-kv: caller limit, inclusive due boundary, lease re-key and private claims', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = new KvSagaSchedulerStore({ kv, now: () => BASE });
  for (let i = 0; i < 121; i++) await store.save(record(`due-${i}`));
  await store.save(record('future', new Date(BASE.getTime() + 1)));
  const first = await store.claimDue(BASE, 100);
  assertEquals(first.length, 100);
  assertEquals(first.every((claim) => !('revision' in claim)), true);
  assertEquals((await store.claimDue(BASE, 100)).length, 21);
  assertEquals(await store.claimDue(BASE, 100), []);
  const indexes = await dueKeys(kv);
  assertEquals(indexes.filter((key) => key[3] === BASE.getTime()).length, 0);
  assertEquals(indexes.filter((key) => key[3] === BASE.getTime() + 30_000).length, 121);
  assertEquals((await store.claimDue(new Date(BASE.getTime() + 29_999), 200)).length, 1);
  const restarted = new KvSagaSchedulerStore({ kv, now: () => BASE });
  assertEquals((await restarted.claimDue(new Date(BASE.getTime() + 30_000), 200)).length, 121);
  await store.markDispatched(first[0]!.id, BASE, first[0]); // stale claim cannot settle the retry
  assertEquals(
    (await kv.get<SagaScheduledMessageRecord>([...PREFIX, 'records', first[0]!.id]))?.value.status,
    'claimed',
  );
});

Deno.test('scheduler real-kv: retention deadline assigned during dispatch preserves settlement without redelivery', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  let now = BASE;
  const store = new KvSagaSchedulerStore({ kv, now: () => now });
  const original = { ...record('in-flight'), instanceId: 'origin' as SagaInstanceId };
  await store.save(original);
  const entered = Promise.withResolvers<void>();
  const resume = Promise.withResolvers<void>();
  let deliveries = 0;
  const scheduler = new SagaScheduler({
    clock: { id: 'dispatch-race-test', now: () => now, sleep: () => Promise.resolve() },
    store,
    dispatch: async () => {
      deliveries++;
      entered.resolve();
      await resume.promise;
    },
  });
  await scheduler.start();
  const drain = scheduler.drainDue();
  await entered.promise;
  await store.cleanupRetention(() => Promise.resolve([new Date(BASE.getTime() + 60_000)]), now);
  resume.resolve();
  await drain;
  const settled =
    (await kv.get<SagaScheduledMessageRecord>([...PREFIX, 'records', original.id]))!.value;
  assertEquals(settled.status, 'dispatched');
  assertEquals(settled.expiresAt?.getTime(), BASE.getTime() + 60_000);
  assertEquals(await dueKeys(kv), []);
  now = new Date(BASE.getTime() + 30_001);
  await scheduler.drainDue();
  assertEquals(deliveries, 1);
  await scheduler.stop();
});

Deno.test('scheduler real-kv: record and due-index deletion, outcome transitions and idle calls are atomic', async () => {
  class ObservedKv extends DenoKvAdapter {
    writes = 0;
    override atomic(checks: AtomicCheck[], mutations: AtomicMutation[]) {
      this.writes++;
      return super.atomic(checks, mutations);
    }
  }
  await using kv = new ObservedKv(await Deno.openKv(':memory:'));
  const store = new KvSagaSchedulerStore({ kv, now: () => BASE });
  assertEquals(await store.claimDue(BASE, 100), []);
  assertEquals(await store.cleanupRetention(() => Promise.resolve([]), BASE), false);
  assertEquals(kv.writes, 0);
  for (const outcome of ['cancel', 'dispatched', 'failed', 'expired'] as const) {
    await store.save({ ...record(outcome), instanceId: 'origin' as SagaInstanceId });
    assertEquals((await dueKeys(kv)).length, 1);
    const [claim] = await store.claimDue(BASE, 100);
    assert(claim);
    if (outcome === 'cancel') assertEquals(await store.cancel(claim), true);
    if (outcome === 'dispatched') await store.markDispatched(claim.id, BASE, claim);
    if (outcome === 'failed') await store.markFailed(claim.id, BASE, 'failure', claim);
    if (outcome === 'expired') {
      await store.cleanupRetention(() => Promise.resolve([BASE, BASE, BASE]), BASE);
    }
    assertEquals(await dueKeys(kv), []);
  }
  const writes = kv.writes;
  assertEquals(await store.claimDue(BASE, 100), []);
  assertEquals(await store.cleanupRetention(() => Promise.resolve([]), BASE), false);
  assertEquals(kv.writes, writes);
  assertEquals(await kv.get([...PREFIX, 'cursor', 'due']), null);
});
