import { assertEquals } from '@std/assert';
import { HmacSha256WebhookVerifier, MemoryWebhookVerifier } from '../adapters/mod.ts';
import { defineWebhook } from '../builders/mod.ts';
import type { TriggerEventId } from '../domain/mod.ts';
import { InlineTriggerProcessor } from '../testing/inline-trigger-processor.ts';
import { MemoryTriggerEventStore } from '../testing/memory-trigger-event-store.ts';
import { createTriggerIngress } from './create-trigger-ingress.ts';
import { createWebhookTestDelivery } from './create-webhook-test-delivery.ts';

Deno.test('createWebhookTestDelivery signs HMAC requests through ingress', async () => {
  const definition = defineWebhook(() => Promise.resolve([]), {
    id: 'orders-webhook',
    path: '/orders',
    verifier: 'hmac-sha256',
    secretEnv: 'ORDERS_SECRET',
  });
  const eventStore = new MemoryTriggerEventStore();
  const ingress = createTriggerIngress({
    definitions: [definition],
    eventStore,
    processor: new InlineTriggerProcessor(),
    verifier: new HmacSha256WebhookVerifier({ signatureHeader: 'x-hub-signature-256' }),
    createEventId: () => 'trg_evt_webhook_test_1' as TriggerEventId,
    resolveSecret: () => 'secret',
  });
  const delivery = createWebhookTestDelivery({
    ingress,
    now: () => new Date('2026-01-04T00:00:00.000Z'),
    resolveSecret: () => 'secret',
  });

  const response = await delivery.deliver(definition, {
    payload: { orderId: 'o-1' },
    idempotencyKey: 'idem-webhook-test',
  });

  assertEquals(response, {
    accepted: true,
    eventId: 'trg_evt_webhook_test_1',
    triggerId: definition.id,
    status: 'pending',
  });
  assertEquals((await eventStore.list()).length, 1);
});

Deno.test('createWebhookTestDelivery honors memory verifier definitions through ingress', async () => {
  const definition = defineWebhook(() => Promise.resolve([]), {
    id: 'memory-webhook',
    path: '/memory',
    verifier: 'memory',
  });
  const eventStore = new MemoryTriggerEventStore();
  const memoryVerifier = new MemoryWebhookVerifier({ idempotencyKey: 'memory-idem' });
  const ingress = createTriggerIngress({
    definitions: [definition],
    eventStore,
    processor: new InlineTriggerProcessor(),
    verifier: new HmacSha256WebhookVerifier({ signatureHeader: 'x-hub-signature-256' }),
    selectVerifier: () => memoryVerifier,
    createEventId: () => 'trg_evt_webhook_test_2' as TriggerEventId,
  });
  const delivery = createWebhookTestDelivery({ ingress });

  const response = await delivery.deliver(definition);

  assertEquals(response.eventId, 'trg_evt_webhook_test_2');
  assertEquals(response.status, 'pending');
  assertEquals(memoryVerifier.requests.length, 1);
  assertEquals((await eventStore.list())[0].idempotencyKey, 'memory-idem');
});
