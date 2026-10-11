import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { DenoKvAdapter } from '@netscript/kv';
import type { AtomicCheck, AtomicMutation } from '@netscript/kv';
import type { TriggerEvent, TriggerEventId, TriggerId } from '../domain/mod.ts';
import { backfillTriggerRetention } from './trigger-kv-retention.ts';

const now = new Date('2030-10-10');
function event(id: string, status: TriggerEvent['status']): TriggerEvent<'webhook'> {
  return {
    id: id as TriggerEventId,
    triggerId: 'legacy' as TriggerId,
    kind: 'webhook',
    status,
    payload: { body: {}, headers: {}, method: 'POST', path: '/' },
    attempt: 1,
    detectedAt: '2030-10-01',
    updatedAt: '2030-10-01',
  };
}
async function seed(kv: DenoKvAdapter, id: string, status: TriggerEvent['status']) {
  const input = event(id, status);
  await kv.set(['triggers', 'events', id], input);
  await kv.set(['triggers', 'by-trigger', input.triggerId, id], id);
  await kv.set(['triggers', 'dlq', 'entries', id], {
    id,
    triggerId: input.triggerId,
    event: input,
    reason: 'legacy',
    attempts: 3,
    failedAt: '2030-10-01',
  });
  await kv.set(['triggers', 'dlq', 'by-trigger', input.triggerId, id], id);
}

Deno.test('real KV trigger backfill resumes all legacy terminal families and preserves open records', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  for (
    const status of ['completed', 'failed', 'dlq', 'pending', 'in-flight', 'deferred'] as const
  ) {
    await seed(kv, status, status);
  }
  await kv.set(['triggers', 'by-trigger', 'legacy', 'unknown'], 'unknown');
  await kv.set(['triggers', 'idempotency', 'active', 'keep'], { active: true });
  await kv.set(['triggers', 'deferred', 'keep'], { deferred: true });
  let done = false;
  for (let pass = 0; pass < 70 && !done; pass++) {
    // New options/composition every page simulates a restart.
    const result = await backfillTriggerRetention({ kv, now: () => now }, 'proof', 1);
    assert(result.scanned <= 1);
    done = result.done;
  }
  assert(done);
  for (const status of ['completed', 'failed', 'dlq']) {
    assertEquals(await kv.get(['triggers', 'events', status]), null);
    assertEquals(await kv.get(['triggers', 'by-trigger', 'legacy', status]), null);
    assertEquals(await kv.get(['triggers', 'dlq', 'entries', status]), null);
    assertEquals(await kv.get(['triggers', 'dlq', 'by-trigger', 'legacy', status]), null);
  }
  for (const status of ['pending', 'in-flight', 'deferred']) {
    assertEquals(
      (await kv.get(['triggers', 'events', status]))?.value,
      event(status, status as TriggerEvent['status']),
    );
    assert(await kv.get(['triggers', 'by-trigger', 'legacy', status]));
    assert(await kv.get(['triggers', 'dlq', 'entries', status]));
    assert(await kv.get(['triggers', 'dlq', 'by-trigger', 'legacy', status]));
  }
  assert(await kv.get(['triggers', 'by-trigger', 'legacy', 'unknown']));
  assert(await kv.get(['triggers', 'idempotency', 'active', 'keep']));
  assert(await kv.get(['triggers', 'deferred', 'keep']));
  assertEquals(await backfillTriggerRetention({ kv, now: () => now }, 'proof'), {
    done: true,
    scanned: 0,
    changed: 0,
    retained: 0,
    conflicted: false,
  });
});

Deno.test('real KV trigger migration CAS prevents concurrent reopening and checkpoint advancement', async () => {
  class RacingKv extends DenoKvAdapter {
    race = true;
    override async atomic(checks: AtomicCheck[], mutations: AtomicMutation[]) {
      if (this.race) {
        this.race = false;
        await this.set(['triggers', 'events', 'completed'], event('completed', 'in-flight'));
      }
      return await super.atomic(checks, mutations);
    }
  }
  await using kv = new RacingKv(await Deno.openKv(':memory:'));
  await seed(kv, 'completed', 'completed');
  const result = await backfillTriggerRetention({ kv, now: () => now }, 'race');
  assertEquals(result.conflicted, true);
  assertEquals(result.changed, 0);
  assertEquals(await kv.get(['triggers', 'retention-backfill', 'race']), null);
  for (let i = 0; i < 12; i++) await backfillTriggerRetention({ kv, now: () => now }, 'race');
  assert(await kv.get(['triggers', 'by-trigger', 'legacy', 'completed']));
  assert(await kv.get(['triggers', 'dlq', 'entries', 'completed']));
  assert(await kv.get(['triggers', 'dlq', 'by-trigger', 'legacy', 'completed']));
});

Deno.test('real KV trigger migration caps full-value pages and respects custom original deadlines', async () => {
  class BoundedKv extends DenoKvAdapter {
    override async atomic(checks: AtomicCheck[], mutations: AtomicMutation[]) {
      assert(checks.length <= 31);
      assert(mutations.length <= 11);
      return await super.atomic(checks, mutations);
    }
  }
  await using kv = new BoundedKv(await Deno.openKv(':memory:'));
  for (let i = 0; i < 12; i++) {
    await seed(kv, `terminal-${i}`, 'completed');
    const input = event(`terminal-${i}`, 'completed');
    await kv.set(['triggers', 'events', input.id], {
      ...input,
      metadata: { bytes: new Uint8Array(60_000) },
    });
  }
  let done = false;
  for (let pass = 0; pass < 30 && !done; pass++) {
    const result = await backfillTriggerRetention(
      { kv, now: () => now, kvRetentionDays: () => 30 },
      'bounded',
    );
    assert(result.scanned <= 10);
    done = result.done;
  }
  assert(done);
  assert(await kv.get(['triggers', 'events', 'terminal-0']));
  for (let pass = 0; pass < 30; pass++) {
    await backfillTriggerRetention({
      kv,
      now: () => new Date('2030-11-02'),
      kvRetentionDays: () => 30,
    }, 'later');
  }
  assertEquals(await kv.get(['triggers', 'events', 'terminal-0']), null);
  assertEquals(await kv.get(['triggers', 'dlq', 'by-trigger', 'legacy', 'terminal-0']), null);
});

Deno.test('real KV trigger backfill assigns original TTL and deletes expired record/index pairs', async () => {
  class RecordingKv extends DenoKvAdapter {
    ttls = new Map<string, number>();
    override async atomic(checks: AtomicCheck[], mutations: AtomicMutation[]) {
      for (const mutation of mutations) {
        if (mutation.type === 'set' && mutation.expireIn !== undefined) {
          this.ttls.set(JSON.stringify(mutation.key), mutation.expireIn);
        }
      }
      return await super.atomic(checks, mutations);
    }
  }
  await using kv = new RecordingKv(await Deno.openKv(':memory:'));
  const settledAt = new Date(now.getTime() - 86_400_000 + 800).toISOString();
  await seed(kv, 'recent', 'completed');
  await kv.set(['triggers', 'events', 'recent'], {
    ...event('recent', 'completed'),
    updatedAt: settledAt,
  });
  await kv.set(['triggers', 'dlq', 'entries', 'recent'], {
    id: 'recent',
    triggerId: 'legacy',
    event: event('recent', 'completed'),
    failedAt: settledAt,
  });
  for (let i = 0; i < 10; i++) {
    await backfillTriggerRetention({ kv, kvRetentionDays: 1, now: () => now }, 'ttl');
  }
  assertEquals([...kv.ttls.values()], [800, 800, 800, 800]);
  for (let i = 0; i < 10; i++) {
    await backfillTriggerRetention({
      kv,
      kvRetentionDays: 1,
      now: () => new Date(now.getTime() + 1000),
    }, 'ttl-expired');
  }
  assertEquals(await kv.get(['triggers', 'events', 'recent']), null);
  assertEquals(await kv.get(['triggers', 'by-trigger', 'legacy', 'recent']), null);
  assertEquals(await kv.get(['triggers', 'dlq', 'entries', 'recent']), null);
  assertEquals(await kv.get(['triggers', 'dlq', 'by-trigger', 'legacy', 'recent']), null);
});
