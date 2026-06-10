import { assertEquals, assertLess } from '@std/assert';
import { defineWebhook } from '../builders/mod.ts';
import type {
  TriggerDefinition,
  TriggerEvent,
  TriggerEventId,
  TriggerEventStatus,
  WebhookTriggerPayload,
} from '../domain/mod.ts';
import type {
  TriggerEventListOptions,
  TriggerEventStorePort,
  TriggerProcessorPort,
  TriggerProcessorStopOptions,
  TriggerProcessResult,
  WebhookVerificationRequest,
  WebhookVerificationResult,
  WebhookVerifierPort,
} from '../ports/mod.ts';
import { createTriggerIngress } from './create-trigger-ingress.ts';
import type { LoggerPort } from './logger.ts';

Deno.test('createTriggerIngress returns 202 before processor work completes', async () => {
  const definition = defineWebhook(
    () => Promise.resolve([]),
    { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
  );
  const eventStore = new MemoryTriggerEventStore();
  const processor = new BlockingProcessor();
  const ingress = createTriggerIngress({
    definitions: [definition],
    eventStore,
    processor,
    verifier: new PassingVerifier('stripe_evt_1'),
    createEventId: () => 'evt_1' as TriggerEventId,
    now: fixedNow,
  });
  const request = new Request('https://app.test/webhooks/stripe', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
    },
    body: JSON.stringify({ type: 'payment_intent.succeeded' }),
  });

  const startedAt = performance.now();
  const response = await ingress.accept({
    triggerId: definition.id,
    request,
  });
  const elapsedMs = performance.now() - startedAt;

  assertEquals(response.status, 202);
  assertLess(elapsedMs, 100);
  assertEquals(eventStore.events.length, 1);
  assertEquals(eventStore.events[0].idempotencyKey, 'stripe_evt_1');
  assertEquals(processor.started, true);
  assertEquals(processor.completed, false);

  processor.release();
  await processor.done;
  await eventStore.waitForStatus('completed');
  assertEquals(eventStore.events[0].status, 'completed');
});

Deno.test('createTriggerIngress stores malformed JSON as raw text', async () => {
  const definition = defineWebhook(
    () => Promise.resolve([]),
    { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
  );
  const eventStore = new MemoryTriggerEventStore();
  const ingress = createTriggerIngress({
    definitions: [definition],
    eventStore,
    processor: new BlockingProcessor(),
    verifier: new PassingVerifier('stripe_evt_1'),
    createEventId: () => 'evt_1' as TriggerEventId,
    now: fixedNow,
  });
  const request = new Request('https://app.test/webhooks/stripe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"broken":',
  });

  const response = await ingress.accept({
    triggerId: definition.id,
    request,
  });

  assertEquals(response.status, 202);
  assertEquals((eventStore.events[0].payload as WebhookTriggerPayload).body, '{"broken":');
});

Deno.test('createTriggerIngress logs status update failures from async processing', async () => {
  const definition = defineWebhook(
    () => Promise.resolve([]),
    { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
  );
  const eventStore = new RejectingUpdateStore();
  const logger = new RecordingLogger();
  const ingress = createTriggerIngress({
    definitions: [definition],
    eventStore,
    processor: new FailingProcessor(),
    verifier: new PassingVerifier('stripe_evt_1'),
    createEventId: () => 'evt_1' as TriggerEventId,
    now: fixedNow,
    logger,
  });

  await ingress.accept({
    triggerId: definition.id,
    request: new Request('https://app.test/webhooks/stripe', { method: 'POST' }),
  });
  await logger.waitFor('trigger.ingress.process_failed');

  assertEquals(logger.errors.map((entry) => entry.message), [
    'trigger.ingress.status_update_failed',
    'trigger.ingress.process_failed',
  ]);
});

class PassingVerifier implements WebhookVerifierPort {
  readonly #idempotencyKey: string;

  constructor(idempotencyKey: string) {
    this.#idempotencyKey = idempotencyKey;
  }

  verify(_request: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    return Promise.resolve({ ok: true, idempotencyKey: this.#idempotencyKey });
  }
}

class BlockingProcessor implements TriggerProcessorPort {
  started = false;
  completed = false;
  readonly done: Promise<void>;
  #release!: () => void;

  constructor() {
    this.done = new Promise((resolve) => {
      this.#release = resolve;
    });
  }

  async process<TDefinition extends TriggerDefinition<string, never, never>>(
    event: TriggerEvent,
    _definition: TDefinition,
  ): Promise<TriggerProcessResult> {
    this.started = true;
    await this.done;
    this.completed = true;
    return { event, status: 'completed', actionsDispatched: 0 };
  }

  stop(_options?: TriggerProcessorStopOptions): Promise<void> {
    return Promise.resolve();
  }

  release(): void {
    this.#release();
  }
}

class FailingProcessor implements TriggerProcessorPort {
  process<TDefinition extends TriggerDefinition<string, never, never>>(
    event: TriggerEvent,
    _definition: TDefinition,
  ): Promise<TriggerProcessResult> {
    return Promise.reject(new Error(`processor failed for ${event.id}`));
  }

  stop(_options?: TriggerProcessorStopOptions): Promise<void> {
    return Promise.resolve();
  }
}

class MemoryTriggerEventStore implements TriggerEventStorePort {
  readonly events: TriggerEvent[] = [];
  readonly #statusWaiters = new Map<TriggerEventStatus, Array<() => void>>();

  save(event: TriggerEvent): Promise<void> {
    this.events.push(event);
    return Promise.resolve();
  }

  load(eventId: TriggerEventId): Promise<TriggerEvent | undefined> {
    return Promise.resolve(this.events.find((event) => event.id === eventId));
  }

  updateStatus(
    eventId: TriggerEventId,
    status: TriggerEventStatus,
    metadata?: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    const index = this.events.findIndex((event) => event.id === eventId);
    if (index >= 0) {
      const event = this.events[index];
      this.events[index] = {
        ...event,
        status,
        updatedAt: fixedNow().toISOString(),
        metadata,
      };
    }
    const waiters = this.#statusWaiters.get(status) ?? [];
    this.#statusWaiters.delete(status);
    for (const resolve of waiters) {
      resolve();
    }
    return Promise.resolve();
  }

  list(options: TriggerEventListOptions = {}): Promise<readonly TriggerEvent[]> {
    const events = this.events.filter((event) =>
      (options.triggerId === undefined || event.triggerId === options.triggerId) &&
      (options.status === undefined || event.status === options.status)
    );
    return Promise.resolve(options.limit === undefined ? events : events.slice(0, options.limit));
  }

  waitForStatus(status: TriggerEventStatus): Promise<void> {
    if (this.events.some((event) => event.status === status)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const waiters = this.#statusWaiters.get(status) ?? [];
      waiters.push(resolve);
      this.#statusWaiters.set(status, waiters);
    });
  }
}

class RejectingUpdateStore extends MemoryTriggerEventStore {
  override updateStatus(
    _eventId: TriggerEventId,
    _status: TriggerEventStatus,
    _metadata?: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    return Promise.reject(new Error('status write failed'));
  }
}

class RecordingLogger implements LoggerPort {
  readonly errors: Array<{ message: string; attributes?: Readonly<Record<string, unknown>> }> = [];
  readonly #waiters = new Map<string, Array<() => void>>();

  debug(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  info(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  warn(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  error(message: string, attributes?: Readonly<Record<string, unknown>>): void {
    this.errors.push({ message, attributes });
    const waiters = this.#waiters.get(message) ?? [];
    this.#waiters.delete(message);
    for (const resolve of waiters) {
      resolve();
    }
  }

  waitFor(message: string): Promise<void> {
    if (this.errors.some((entry) => entry.message === message)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const waiters = this.#waiters.get(message) ?? [];
      waiters.push(resolve);
      this.#waiters.set(message, waiters);
    });
  }
}

function fixedNow(): Date {
  return new Date('2026-05-17T00:00:00.000Z');
}
