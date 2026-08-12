import { assertEquals, assertExists } from '@std/assert';
import {
  defineWebhook,
  type TriggerEventSubscriptionMessage,
} from '@netscript/plugin-triggers-core';
import {
  InlineTriggerProcessor,
  MemoryTriggerEventStore,
} from '@netscript/plugin-triggers-core/testing';
import { HmacSha256WebhookVerifier } from '@netscript/plugin-triggers-core/adapters';
import {
  createEventSubscription,
  createManualDispatcher,
  createTriggerIngress,
  createWebhookTestDelivery,
} from '@netscript/plugin-triggers-core';

Deno.test('Trigger operator, manual dispatch, test delivery, and lifecycle subscriptions', async () => {
  // Define a webhook trigger spec
  const webhookDef = defineWebhook(() => Promise.resolve([]), {
    id: 'orders-webhook',
    path: '/orders',
    verifier: 'hmac-sha256',
    secretEnv: 'ORDERS_SECRET',
  });

  const eventStore = new MemoryTriggerEventStore();
  const processor = new InlineTriggerProcessor();
  const verifier = new HmacSha256WebhookVerifier({ signatureHeader: 'x-hub-signature-256' });

  // 1. Create a trigger ingress and webhook test delivery
  const ingress = createTriggerIngress({
    definitions: [webhookDef],
    eventStore,
    processor,
    verifier,
    resolveSecret: () => 'webhook-secret-key',
  });

  const delivery = createWebhookTestDelivery({
    ingress,
    resolveSecret: () => 'webhook-secret-key',
  });

  // Signed webhook test delivery
  const deliveryResponse = await delivery.deliver(webhookDef, {
    payload: { orderId: 'ord_123', amount: 99.99 },
    idempotencyKey: 'idem-webhook-test',
  });

  assertEquals(deliveryResponse.accepted, true);
  assertEquals(deliveryResponse.status, 'pending');

  // 2. Manual Replay / Fire dispatcher
  const dispatcher = createManualDispatcher({
    eventStore,
    processor,
  });

  const replayResponse = await dispatcher.fire(webhookDef, {
    payload: { orderId: 'ord_123', amount: 99.99 },
    reason: 'Manual event replay due to consumer downtime',
    firedBy: 'admin-operator',
  });

  assertEquals(replayResponse.accepted, true);
  assertExists(replayResponse.eventId);

  // 3. Lifecycle event observation via createEventSubscription
  const subscriptionHub = createEventSubscription();
  const observedEvents: TriggerEventSubscriptionMessage[] = [];
  const abortController = new AbortController();

  const subscriptionPromise = (async () => {
    for await (const msg of subscriptionHub.subscribe({}, { signal: abortController.signal })) {
      observedEvents.push(msg);
    }
  })();

  const triggerEvent = await eventStore.load(replayResponse.eventId);
  if (triggerEvent) {
    await subscriptionHub.publish({
      type: 'trigger:accepted',
      timestamp: new Date().toISOString(),
      event: triggerEvent,
    });
  }

  abortController.abort();
  await subscriptionPromise;

  assertEquals(observedEvents.length, 1);
  assertEquals(observedEvents[0].type, 'trigger:accepted');
  assertEquals(observedEvents[0].event.triggerId, webhookDef.id);
});
