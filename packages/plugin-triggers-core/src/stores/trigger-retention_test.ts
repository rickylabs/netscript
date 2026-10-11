import { defineWebhook } from '../builders/mod.ts';
import { createManualDispatcher } from '../runtime/create-manual-dispatcher.ts';
import { assertEquals } from 'jsr:@std/assert@^1';
import { FakeTime } from 'jsr:@std/testing@^1/time';
import { MemoryKvAdapter } from '@netscript/kv';
import type { TriggerEvent, TriggerEventId, TriggerId } from '../domain/mod.ts';
import { KvTriggerDlqStore, KvTriggerEventStore } from './kv-trigger-runtime-stores.ts';

function event(): TriggerEvent<'webhook'> {
  return {
    id: 'event' as TriggerEventId,
    triggerId: 'trigger' as TriggerId,
    kind: 'webhook',
    status: 'pending',
    payload: { body: {}, headers: {}, method: 'POST', path: '/' },
    attempt: 0,
    detectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

Deno.test('trigger retention expires terminal events and indexes together, preserving deferred events', async () => {
  using time = new FakeTime('2026-10-10T00:00:00Z');
  await using kv = new MemoryKvAdapter();
  const store = new KvTriggerEventStore({ kv, kvRetentionDays: () => 1 });
  const input = event();
  await store.save(input);
  await store.updateStatus(input.id, 'deferred');
  time.tick(2 * 86_400_000);
  assertEquals((await store.load(input.id))?.status, 'deferred');
  await store.updateStatus(input.id, 'completed');
  time.tick(86_400_000 - 1);
  assertEquals((await store.load(input.id))?.status, 'completed');
  time.tick(2);
  assertEquals(await store.load(input.id), undefined);
  assertEquals(await kv.get(['triggers', 'by-trigger', input.triggerId, input.id]), null);
});

Deno.test('trigger DLQ retention expires entries and indexes at original failure deadline', async () => {
  using time = new FakeTime('2026-10-10T00:00:00Z');
  await using kv = new MemoryKvAdapter();
  const dlq = new KvTriggerDlqStore({ kv, kvRetentionDays: 1 });
  const input = event();
  const entry = {
    id: input.id,
    triggerId: input.triggerId,
    event: input,
    reason: 'exhausted',
    failedAt: new Date().toISOString(),
    attempts: 3,
  };
  await dlq.enqueue(entry);
  time.tick(86_400_000 - 1);
  await dlq.enqueue(entry); // replacing it cannot extend its retention window
  time.tick(2);
  assertEquals(await dlq.list(), []);
  assertEquals(await kv.get(['triggers', 'dlq', 'by-trigger', input.triggerId, input.id]), null);
});

Deno.test('manual trigger completion persists terminal status and starts event retention', async () => {
  using time = new FakeTime('2026-10-10T00:00:00Z');
  await using kv = new MemoryKvAdapter();
  const store = new KvTriggerEventStore({ kv, kvRetentionDays: 1 });
  const definition = defineWebhook(() => Promise.resolve([]), {
    id: 'manual',
    path: '/manual',
    verifier: 'memory',
  });
  const dispatcher = createManualDispatcher({
    eventStore: store,
    processor: {
      process: (event) => Promise.resolve({ event, status: 'completed', actionsDispatched: 0 }),
      stop: () => Promise.resolve(),
    },
  });
  const response = await dispatcher.fire(definition);
  assertEquals((await store.load(response.eventId))?.status, 'completed');
  time.tick(86_400_001);
  assertEquals(await store.load(response.eventId), undefined);
});
