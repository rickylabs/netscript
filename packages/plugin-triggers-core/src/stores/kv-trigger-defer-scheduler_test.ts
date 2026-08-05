import { assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import type { TriggerEvent, TriggerEventId, TriggerId } from '../domain/mod.ts';
import { TriggerTestClock } from '../testing/trigger-test-clock.ts';
import { KvTriggerDeferScheduler } from './kv-trigger-defer-scheduler.ts';

Deno.test('KV defer scheduler fires once at due time and survives adapter restart', async () => {
  await using kv = new MemoryKvAdapter();
  const clock = new TriggerTestClock(new Date('2026-08-04T10:00:00.000Z'));
  const first = new KvTriggerDeferScheduler({ kv, clock });
  await first.schedule({
    action: { kind: 'defer', until: '2026-08-04T10:05:00.000Z' },
    event: triggerEvent(),
  });
  assertEquals(await first.replayDue(() => Promise.resolve()), []);

  clock.advanceTo(new Date('2026-08-04T10:06:00.000Z'));
  const restarted = new KvTriggerDeferScheduler({ kv, clock });
  const replayed: string[] = [];
  const results = await restarted.replayDue((record) => {
    replayed.push(record.event.id);
    return Promise.resolve();
  });

  assertEquals(replayed, ['event_1']);
  assertEquals(results.map((result) => result.status), ['replayed']);
  assertEquals(await restarted.list(), []);
});

Deno.test('KV defer scheduler cancels before due and retains failed past-due replay', async () => {
  await using kv = new MemoryKvAdapter();
  const clock = new TriggerTestClock(new Date('2026-08-04T10:10:00.000Z'));
  const scheduler = new KvTriggerDeferScheduler({ kv, clock });
  const cancelled = await scheduler.schedule({
    action: { kind: 'defer', until: '2026-08-04T10:20:00.000Z' },
    event: triggerEvent(),
  });
  assertEquals(await scheduler.cancel(cancelled.id), true);
  assertEquals(await scheduler.list(), []);

  await scheduler.schedule({
    action: { kind: 'defer', until: '2026-08-04T10:00:00.000Z' },
    event: triggerEvent(),
  });
  const results = await scheduler.replayDue(() => Promise.reject(new Error('definition missing')));

  assertEquals(results.map((result) => [result.status, result.error]), [
    ['failed', 'definition missing'],
  ]);
  assertEquals((await scheduler.list()).length, 1);
});

function triggerEvent(): TriggerEvent<'webhook'> {
  const now = '2026-08-04T10:00:00.000Z';
  return {
    id: 'event_1' as TriggerEventId,
    triggerId: 'payments' as TriggerId,
    kind: 'webhook',
    status: 'pending',
    payload: { body: {}, headers: {}, method: 'POST', path: '/payments' },
    attempt: 0,
    detectedAt: now,
    updatedAt: now,
    idempotencyKey: 'event_1',
  };
}
