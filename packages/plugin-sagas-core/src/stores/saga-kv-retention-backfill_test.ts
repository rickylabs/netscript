import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { DenoKvAdapter } from '@netscript/kv';
import type { AtomicCheck, AtomicMutation, KvEntry, KvListOptions } from '@netscript/kv';
import type { SagaStateEnvelope } from '../domain/mod.ts';
import { SagaKvRetention } from './saga-kv-retention.ts';

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
