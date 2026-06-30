import { assertEquals } from 'jsr:@std/assert@^1';

import { MemoryKvAdapter } from '@netscript/kv';
import type { TriggerEvent, TriggerEventId, TriggerId } from '../domain/mod.ts';
import {
  KvTriggerDlqStore,
  KvTriggerEventStore,
  KvTriggerIdempotencyStore,
} from './kv-trigger-runtime-stores.ts';

Deno.test('KvTriggerEventStore persists, lists, updates, and loads events with MemoryKvAdapter', async () => {
  const kv = new MemoryKvAdapter();
  const store = new KvTriggerEventStore({ kv, prefix: prefix() });
  const event = webhookEvent();

  await store.save(event);
  await store.updateStatus(event.id, 'completed', { handler: 'ok' });

  const loaded = await store.load(event.id);
  assertEquals(loaded?.status, 'completed');
  assertEquals(loaded?.metadata, { handler: 'ok' });
  assertEquals((await store.list({ triggerId: event.triggerId })).length, 1);
  assertEquals(await store.list({ status: 'pending' }), []);
  await kv.close();
});

Deno.test('KvTriggerIdempotencyStore rejects duplicate active and completed claims with MemoryKvAdapter', async () => {
  const kv = new MemoryKvAdapter();
  const store = new KvTriggerIdempotencyStore({ kv, prefix: prefix() });
  const event = webhookEvent({ idempotencyKey: 'request-1' });

  const first = await store.resolveKey({ event });
  const duplicate = await store.resolveKey({ event });
  await store.markCompleted(first.key, 60_000);
  const completed = await store.resolveKey({ event });
  await store.release(first.key);

  assertEquals(first.claimed, true);
  assertEquals(duplicate.claimed, false);
  assertEquals(completed.claimed, false);
  await kv.close();
});

Deno.test('KvTriggerDlqStore enqueues, lists, filters, and replays entries with MemoryKvAdapter', async () => {
  const kv = new MemoryKvAdapter();
  const store = new KvTriggerDlqStore({ kv, prefix: prefix() });
  const event = webhookEvent();
  const entry = {
    id: event.id,
    triggerId: event.triggerId,
    event,
    reason: 'handler failed',
    failedAt: '2026-06-20T10:00:00.000Z',
    attempts: 3,
  };

  await store.enqueue(entry);

  assertEquals(await store.list({ triggerId: event.triggerId }), [entry]);
  assertEquals(await store.list({ since: new Date('2026-06-20T09:00:00.000Z') }), [entry]);

  await store.replay(event.id);

  assertEquals(await store.list(), []);
  await kv.close();
});

function prefix(): readonly ['test-triggers', string] {
  return ['test-triggers', crypto.randomUUID()];
}

function webhookEvent(
  overrides: Partial<TriggerEvent<'webhook'>> = {},
): TriggerEvent<'webhook'> {
  const now = '2026-06-20T10:00:00.000Z';
  return {
    id: 'evt_1' as TriggerEventId,
    triggerId: 'stripe-payments' as TriggerId,
    kind: 'webhook',
    status: 'pending',
    payload: {
      body: { ok: true },
      headers: {},
      method: 'POST',
      path: '/api/v1/webhooks/stripe-payments',
    },
    attempt: 0,
    detectedAt: now,
    updatedAt: now,
    ...overrides,
  };
}
