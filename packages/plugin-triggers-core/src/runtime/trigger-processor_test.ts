import { assertEquals, assertInstanceOf, assertRejects } from '@std/assert';
import { defineWebhook, enqueueJob } from '../builders/mod.ts';
import {
  TriggerDeduplicatedError,
  type TriggerEvent,
  type TriggerEventId,
  type TriggerId,
  TriggerKindNotImplementedError,
  TriggersError,
} from '../domain/mod.ts';
import type {
  TriggerDlqEntry,
  TriggerDlqPort,
  TriggerIdempotencyClaim,
  TriggerIdempotencyKeyInput,
  TriggerIdempotencyPort,
} from '../ports/mod.ts';
import { TriggerProcessor } from './trigger-processor.ts';

Deno.test('TriggerProcessor dispatches handler actions once', async () => {
  const idempotency = new MemoryIdempotency();
  const dlq = new MemoryDlq();
  const dispatched: unknown[] = [];
  const processor = new TriggerProcessor({
    idempotency,
    dlq,
    dispatchAction: (action) => {
      dispatched.push(action);
      return Promise.resolve();
    },
    now: fixedNow,
  });
  const job = { id: 'send-email' as never };
  const definition = defineWebhook(
    async () => [enqueueJob(job)],
    { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
  );

  const result = await processor.process(webhookEvent(), definition);

  assertEquals(result.status, 'completed');
  assertEquals(result.actionsDispatched, 1);
  assertEquals(dispatched.length, 1);
  assertEquals(idempotency.completed.length, 1);
});

Deno.test('TriggerProcessor rejects duplicate idempotency claims', async () => {
  const processor = new TriggerProcessor({
    idempotency: new MemoryIdempotency(false),
    dlq: new MemoryDlq(),
    now: fixedNow,
  });
  const definition = defineWebhook(
    async () => [],
    { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
  );

  await assertRejects(
    () => processor.process(webhookEvent(), definition),
    TriggerDeduplicatedError,
  );
});

Deno.test('TriggerProcessor moves exhausted retry failures to DLQ', async () => {
  const dlq = new MemoryDlq();
  const processor = new TriggerProcessor({
    idempotency: new MemoryIdempotency(),
    dlq,
    now: fixedNow,
  });
  const definition = {
    ...defineWebhook(
      async () => {
        throw TriggersError.nonRetryable('boom');
      },
      { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
    ),
    retry: {
      maxAttempts: 1,
      initialDelayMs: 1,
      maxDelayMs: 1,
      backoffMultiplier: 1,
      jitter: false,
    },
  };

  const result = await processor.process(webhookEvent(), definition);

  assertEquals(result.status, 'dlq');
  assertEquals(dlq.entries.length, 1);
  assertEquals(dlq.entries[0].attempts, 1);
});

Deno.test('TriggerProcessor applies jitter to retry delay', async () => {
  let attempts = 0;
  const processor = new TriggerProcessor({
    idempotency: new MemoryIdempotency(),
    dlq: new MemoryDlq(),
    now: fixedNow,
    random: () => 0,
  });
  const definition = {
    ...defineWebhook(
      async () => {
        attempts += 1;
        if (attempts === 1) {
          throw TriggersError.retryable('try again');
        }
        return [];
      },
      { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
    ),
    retry: {
      maxAttempts: 2,
      initialDelayMs: 5_000,
      maxDelayMs: 5_000,
      backoffMultiplier: 1,
      jitter: true,
    },
  };

  const startedAt = performance.now();
  const result = await processor.process(webhookEvent(), definition);

  assertEquals(result.status, 'completed');
  assertEquals(attempts, 2);
  assertEquals(performance.now() - startedAt < 100, true);
});

Deno.test('TriggerProcessor rejects reserved trigger kinds', async () => {
  const processor = new TriggerProcessor({
    idempotency: new MemoryIdempotency(),
    dlq: new MemoryDlq(),
    now: fixedNow,
  });
  const definition = {
    id: 'manual-test' as TriggerId<'manual-test'>,
    kind: 'manual' as const,
    durability: 't1' as const,
    auditRequired: true,
    handler: async () => [],
  };

  const error = await assertRejects(
    () => processor.process(webhookEvent(), definition),
    TriggerKindNotImplementedError,
  );
  assertInstanceOf(error, TriggerKindNotImplementedError);
});

class MemoryIdempotency implements TriggerIdempotencyPort {
  readonly completed: string[] = [];
  readonly released: string[] = [];
  readonly #claim: boolean;

  constructor(claim = true) {
    this.#claim = claim;
  }

  resolveKey(input: TriggerIdempotencyKeyInput): Promise<TriggerIdempotencyClaim> {
    return Promise.resolve({
      claimed: this.#claim,
      key: input.event.idempotencyKey ?? 'payload-hash',
      source: input.event.idempotencyKey ? 'caller' : 'payload-hash',
    });
  }

  markCompleted(key: string, _ttlMs: number): Promise<void> {
    this.completed.push(key);
    return Promise.resolve();
  }

  release(key: string): Promise<void> {
    this.released.push(key);
    return Promise.resolve();
  }
}

class MemoryDlq implements TriggerDlqPort {
  readonly entries: TriggerDlqEntry[] = [];

  enqueue(entry: TriggerDlqEntry): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  list(): Promise<readonly TriggerDlqEntry[]> {
    return Promise.resolve(this.entries);
  }

  replay(_eventId: TriggerEventId): Promise<void> {
    return Promise.resolve();
  }
}

function webhookEvent(): TriggerEvent<'webhook'> {
  return {
    id: 'evt_1' as TriggerEventId,
    triggerId: 'stripe-payments' as TriggerId,
    kind: 'webhook',
    status: 'pending',
    payload: {
      body: { type: 'payment_intent.succeeded' },
      headers: {},
      method: 'POST',
      path: '/webhooks/stripe',
    },
    attempt: 0,
    detectedAt: fixedNow().toISOString(),
    updatedAt: fixedNow().toISOString(),
    idempotencyKey: 'evt_1',
  };
}

function fixedNow(): Date {
  return new Date('2026-05-17T00:00:00.000Z');
}
