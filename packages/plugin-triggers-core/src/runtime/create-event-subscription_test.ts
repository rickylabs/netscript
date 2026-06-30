import { assertEquals } from '@std/assert';
import { HmacSha256WebhookVerifier, MemoryWebhookVerifier } from '../adapters/mod.ts';
import { defineWebhook } from '../builders/mod.ts';
import type { TriggerEvent, TriggerEventId } from '../domain/mod.ts';
import type { TriggerDlqEntry, TriggerDlqListOptions, TriggerDlqPort } from '../ports/mod.ts';
import { MemoryTriggerEventStore } from '../testing/memory-trigger-event-store.ts';
import { MemoryTriggerIdempotencyStore } from '../testing/memory-trigger-idempotency-store.ts';
import { createEventSubscription } from './create-event-subscription.ts';
import { createTriggerIngress } from './create-trigger-ingress.ts';
import { createTriggerProcessor } from './create-trigger-processor.ts';

Deno.test('createEventSubscription filters live lifecycle messages', async () => {
  const definition = defineWebhook(() => Promise.resolve([]), {
    id: 'match',
    path: '/match',
    verifier: 'memory',
  });
  const subscription = createEventSubscription();
  const stream = subscription.subscribe({ triggerId: definition.id });
  const iterator = stream[Symbol.asyncIterator]();
  const event = makeEvent(definition.id);

  await subscription.publish({
    type: 'trigger:accepted',
    timestamp: '2026-01-01T00:00:00.000Z',
    event,
  });

  const next = await iterator.next();
  assertEquals(next.value.type, 'trigger:accepted');
  assertEquals(next.value.event.triggerId, 'match');
  await iterator.return?.();
});

Deno.test('createTriggerIngress publishes accepted, started, and terminal events', async () => {
  const definition = defineWebhook(() => Promise.resolve([]), {
    id: 'webhook-events',
    path: '/webhook-events',
    verifier: 'memory',
  });
  const subscription = createEventSubscription();
  const stream = subscription.subscribe({ triggerId: definition.id });
  const iterator = stream[Symbol.asyncIterator]();
  const ingress = createTriggerIngress({
    definitions: [definition],
    eventStore: new MemoryTriggerEventStore(),
    processor: createTriggerProcessor({
      idempotency: new MemoryTriggerIdempotencyStore(),
      dlq: new MemoryDlq(),
      eventSubscription: subscription,
    }),
    verifier: new HmacSha256WebhookVerifier({ signatureHeader: 'x-hub-signature-256' }),
    selectVerifier: () => new MemoryWebhookVerifier({ idempotencyKey: 'subscription-test' }),
    createEventId: () => 'trg_evt_subscription_test' as TriggerEventId,
    eventSubscription: subscription,
  });

  await ingress.accept({
    triggerId: definition.id,
    request: new Request('https://triggers.test/webhook-events', {
      method: 'POST',
      body: '{}',
    }),
  });

  assertEquals((await iterator.next()).value.type, 'trigger:accepted');
  assertEquals((await iterator.next()).value.type, 'trigger:started');
  assertEquals((await iterator.next()).value.type, 'trigger:completed');
  await iterator.return?.();
});

function makeEvent(triggerId: TriggerEvent['triggerId']): TriggerEvent {
  return {
    id: 'trg_evt_filter_test' as TriggerEventId,
    triggerId,
    kind: 'webhook',
    status: 'pending',
    payload: {
      body: {},
      headers: {},
      method: 'POST',
      path: '/match',
    },
    attempt: 0,
    detectedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

class MemoryDlq implements TriggerDlqPort {
  readonly entries: TriggerDlqEntry[] = [];

  enqueue(entry: TriggerDlqEntry): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  list(_options?: TriggerDlqListOptions): Promise<readonly TriggerDlqEntry[]> {
    return Promise.resolve(this.entries);
  }

  replay(_eventId: TriggerEventId): Promise<void> {
    return Promise.resolve();
  }
}
