import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import { defineJob } from '@netscript/plugin-workers-core';
import type { JobMessage } from '@netscript/plugin-workers-core/runtime';
import type {
  TriggerEvent,
  TriggerEventId,
  TriggerId,
} from '@netscript/plugin-triggers-core/domain';
import { TriggersError } from '@netscript/plugin-triggers-core/domain';
import type {
  TriggerDlqEntry,
  TriggerDlqPort,
  TriggerIdempotencyClaim,
  TriggerIdempotencyKeyInput,
  TriggerIdempotencyPort,
} from '@netscript/plugin-triggers-core/ports';
import { createRuntimeTriggerProcessor } from './trigger-runtime-processor.ts';
import { MemoryTriggerEnabledStateStore } from '@netscript/plugin-triggers-core/testing';

Deno.test('runtime processor rejects defer actions instead of silently dropping them', async () => {
  const idempotency = new MemoryIdempotency();
  const dlq = new MemoryDlq();
  const processor = await createRuntimeTriggerProcessor({ idempotency, dlq });
  const definition = defineWebhook(
    () => Promise.resolve([{ kind: 'defer', until: '2026-05-17T00:05:00.000Z' }]),
    { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
  );

  const result = await processor.process(webhookEvent(), definition);

  assertEquals(result.status, 'dlq');
  assertEquals(result.actionsDispatched, 0);
  assertEquals(dlq.entries.length, 1);
  assertStringIncludes(
    dlq.entries[0].reason,
    'Deferred trigger action dispatch is not implemented',
  );
  assertEquals(idempotency.completed, ['evt_1']);
  assertEquals(idempotency.released.length, 0);
});

Deno.test('runtime processor stamps idempotency key onto enqueued worker job body', async () => {
  const idempotency = new MemoryIdempotency();
  const dlq = new MemoryDlq();
  const queue = new RecordingJobQueue();
  const processor = await createRuntimeTriggerProcessor({
    idempotency,
    dlq,
    jobQueue: queue as never,
  });
  const job = defineJob('send-receipt')
    .handler(() => ({ success: true }))
    .build();
  const definition = defineWebhook(
    () =>
      Promise.resolve([
        enqueueJob(job, {
          idempotencyKey: 'action-key',
          payload: { receiptId: 'r_1' },
        }),
      ]),
    { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
  );

  const result = await processor.process(webhookEvent(), definition);

  assertEquals(result.status, 'completed');
  assertEquals(queue.messages.length, 1);
  assertEquals(queue.messages[0].idempotencyKey, 'action-key');
  assertEquals(queue.options[0]?.deduplicationId, 'action-key');
});

Deno.test('runtime processor rejects a trigger disabled in the authoritative state store', async () => {
  const enabledState = new MemoryTriggerEnabledStateStore();
  const definition = defineWebhook(
    () => Promise.resolve([]),
    { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
  );
  await enabledState.setEnabled(definition.id, false);
  const processor = await createRuntimeTriggerProcessor({
    idempotency: new MemoryIdempotency(),
    dlq: new MemoryDlq(),
    enabledState,
  });

  await assertRejects(
    () => processor.process(webhookEvent(), definition),
    TriggersError,
    'Trigger stripe-payments is disabled.',
  );
});

class MemoryIdempotency implements TriggerIdempotencyPort {
  readonly completed: string[] = [];
  readonly released: string[] = [];

  resolveKey(input: TriggerIdempotencyKeyInput): Promise<TriggerIdempotencyClaim> {
    return Promise.resolve({
      claimed: true,
      key: input.event.idempotencyKey ?? 'payload-hash',
      source: input.event.idempotencyKey ? 'caller' : 'payload-hash',
    });
  }

  markCompleted(key: string): Promise<void> {
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

class RecordingJobQueue {
  readonly messages: JobMessage[] = [];
  readonly options: { deduplicationId?: string }[] = [];

  enqueue(message: JobMessage, options?: { deduplicationId?: string }): Promise<void> {
    this.messages.push(message);
    this.options.push(options ?? {});
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
