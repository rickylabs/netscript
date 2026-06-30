import { assertEquals } from '@std/assert';
import { defineWebhook } from '../builders/mod.ts';
import type { TriggerEventId } from '../domain/mod.ts';
import { MemoryTriggerEventStore } from '../testing/memory-trigger-event-store.ts';
import { InlineTriggerProcessor } from '../testing/inline-trigger-processor.ts';
import { createManualDispatcher } from './create-manual-dispatcher.ts';

Deno.test('createManualDispatcher persists and processes manual fire events', async () => {
  const eventStore = new MemoryTriggerEventStore();
  const processor = new InlineTriggerProcessor({
    now: () => new Date('2026-01-03T00:00:00.000Z'),
  });
  const definition = defineWebhook(() => Promise.resolve([]), {
    id: 'orders-webhook',
    path: '/orders',
    verifier: 'memory',
  });
  const eventId = 'trg_evt_manual_1' as TriggerEventId;
  const dispatcher = createManualDispatcher({
    eventStore,
    processor,
    now: () => new Date('2026-01-03T00:00:00.000Z'),
    createEventId: () => eventId,
  });

  const response = await dispatcher.fire(definition, {
    payload: { orderId: 'o-1' },
    idempotencyKey: 'idem-1',
    reason: 'manual replay',
    traceparent: '00-trace',
  });
  const stored = await eventStore.load(response.eventId);

  assertEquals(response, {
    accepted: true,
    eventId,
    triggerId: definition.id,
    status: 'pending',
  });
  assertEquals(stored?.kind, 'manual');
  assertEquals(stored?.triggerId, definition.id);
  assertEquals(stored?.payload, {
    payload: { orderId: 'o-1' },
    firedBy: undefined,
    reason: 'manual replay',
    firedAt: '2026-01-03T00:00:00.000Z',
  });
  assertEquals(stored?.idempotencyKey, 'idem-1');
  assertEquals(stored?.traceparent, '00-trace');
  assertEquals(processor.processed.map((event) => event.id), ['trg_evt_manual_1']);
});
