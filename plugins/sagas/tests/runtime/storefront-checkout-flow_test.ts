import { assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { defineSaga } from '@netscript/plugin-sagas-core';
import type {
  SagaCorrelationKey,
  SagaInstanceId,
  SagaState,
} from '@netscript/plugin-sagas-core/domain';
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { MemorySagaStore } from '@netscript/plugin-sagas-core/testing';
import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type {
  TriggerEvent,
  TriggerEventId,
  TriggerId,
} from '@netscript/plugin-triggers-core/domain';
import type {
  TriggerDlqEntry,
  TriggerDlqPort,
  TriggerIdempotencyClaim,
  TriggerIdempotencyKeyInput,
  TriggerIdempotencyPort,
} from '@netscript/plugin-triggers-core/ports';
import { createRuntimeTriggerProcessor } from '@netscript/plugin-triggers/runtime';
import { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';
import type { JobDefinition } from '@netscript/plugin-workers-core';
import type { JobMessage } from '@netscript/plugin-workers-core/runtime';
import { InProcessJobRunner } from '@netscript/plugin-workers-core/runtime';
import type {
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
} from '@netscript/queue/ports';
import { z } from 'zod';

const STOREFRONT_TUTORIAL = new URL(
  '../../../../docs/site/tutorials/storefront/04-checkout-saga.md',
  import.meta.url,
);
const DURABLE_SAGAS_GUIDE = new URL(
  '../../../../docs/site/durable-workflows/sagas.md',
  import.meta.url,
);
const ORDER_ID = 'ord_1001';

const PaymentPayloadSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
});
type PaymentPayload = z.infer<typeof PaymentPayloadSchema>;

Deno.test('storefront documented trigger-worker-saga flow reaches paid as written', async () => {
  const storefront = await Deno.readTextFile(STOREFRONT_TUTORIAL);
  const durableGuide = await Deno.readTextFile(DURABLE_SAGAS_GUIDE);

  assertFalse(storefront.includes("send('CheckoutPaymentRequested'"));
  assertFalse(storefront.includes("send('reserve-inventory'"));
  assertFalse(storefront.includes("send('create-shipment'"));
  assertFalse(storefront.includes("send('OrderCancelled'"));
  assertStringIncludes(storefront, 'event.payload.body');
  assertFalse(durableGuide.includes("{ kind: 'service', id: 'payments' }"));

  const store = new MemorySagaStore();
  const runtime = createSagaRuntime({ native: { store } });
  const checkout = defineSaga('CheckoutSaga')
    .state<SagaState>({ orderId: '', status: 'pending' })
    .on<string, unknown>('OrderCreated', (saga, event) => {
      const payload = event.payload as PaymentPayload;
      saga.state = {
        ...saga.state,
        orderId: payload.orderId,
        status: 'payment_pending',
      };
      return [];
    })
    .on<string, unknown>('PaymentCompleted', (saga, event) => {
      if (saga.state.status !== 'payment_pending') return [];
      const payload = event.payload as { transactionId: string };
      saga.state = {
        ...saga.state,
        status: 'paid',
        transactionId: payload.transactionId,
      };
      return [];
    })
    .build();

  const handler = defineJobHandler(PaymentPayloadSchema, async (context) => {
    const payload = context.payload;
    await runtime.publish({
      type: 'PaymentCompleted',
      payload: {
        orderId: payload.orderId,
        transactionId: 'txn_777',
      },
      correlationKey: payload.orderId as SagaCorrelationKey,
    });
    return createSuccessResult({ orderId: payload.orderId, transactionId: 'txn_777' });
  });
  const processPaymentJob = {
    id: 'process-payment' as JobDefinition<'process-payment'>['id'],
    name: 'Process payment',
    topic: 'default',
  } satisfies JobDefinition<'process-payment'>;
  const registry = new Map<string, typeof handler>([[processPaymentJob.id, handler]]);
  const worker = new InProcessJobRunner({ registry });
  const queue = new RecordingJobQueue();
  const processor = await createRuntimeTriggerProcessor({
    idempotency: new MemoryIdempotency(),
    dlq: new MemoryDlq(),
    jobQueue: queue,
  });
  const trigger = defineWebhook(
    (event) =>
      Promise.resolve([
        enqueueJob(processPaymentJob, { payload: event.payload.body }),
      ]),
    { id: 'checkout-payment', path: 'checkout/payment', verifier: 'memory' },
  );

  await runtime.register([checkout]);
  await runtime.start();
  try {
    await runtime.publish({
      type: 'OrderCreated',
      payload: { orderId: ORDER_ID, amount: 4999 },
      correlationKey: ORDER_ID as SagaCorrelationKey,
    });

    const processed = await processor.process(webhookEvent(), trigger);
    assertEquals(processed.status, 'completed');
    assertEquals(queue.messages.length, 1);
    const queued = queue.messages[0];
    assertEquals(queued.jobId, processPaymentJob.id);
    assertEquals(registry.has(queued.jobId), true);

    const payload = PaymentPayloadSchema.parse(queued.payload);
    const result = await worker.dispatch(processPaymentJob, {
      id: 'run_process_payment_1',
      job: processPaymentJob,
      payload,
      correlationId: queued.correlationId,
      traceparent: queued.traceparent,
      tracestate: queued.tracestate,
    });
    assertEquals(result.success, true);

    const state = await store.load(
      `CheckoutSaga:${ORDER_ID}` as SagaInstanceId,
    );
    assertEquals(state?.state, {
      orderId: ORDER_ID,
      status: 'paid',
      transactionId: 'txn_777',
    });
  } finally {
    await processor.stop();
    await worker.stop('storefront flow complete');
    await runtime.stop('storefront flow complete');
  }
});

class RecordingJobQueue implements MessageQueue<JobMessage> {
  readonly nativeRetrial = false;
  readonly messages: JobMessage[] = [];

  enqueue(message: JobMessage, _options?: EnqueueOptions): Promise<void> {
    this.messages.push(message);
    return Promise.resolve();
  }

  listen(
    _handler: (message: JobMessage, context: MessageContext) => Promise<void>,
    _options?: ListenOptions,
  ): Promise<void> {
    return Promise.resolve();
  }

  stop(): Promise<void> {
    return Promise.resolve();
  }
}

class MemoryIdempotency implements TriggerIdempotencyPort {
  resolveKey(input: TriggerIdempotencyKeyInput): Promise<TriggerIdempotencyClaim> {
    return Promise.resolve({
      claimed: true,
      key: input.event.idempotencyKey ?? input.event.id,
      source: input.event.idempotencyKey ? 'caller' : 'payload-hash',
    });
  }

  markCompleted(): Promise<void> {
    return Promise.resolve();
  }

  release(): Promise<void> {
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

  replay(): Promise<void> {
    return Promise.resolve();
  }
}

function webhookEvent(): TriggerEvent<'webhook'> {
  return {
    id: 'evt_checkout_1' as TriggerEventId,
    triggerId: 'checkout-payment' as TriggerId,
    kind: 'webhook',
    status: 'pending',
    payload: {
      body: { orderId: ORDER_ID, amount: 4999 },
      headers: {},
      method: 'POST',
      path: '/webhooks/checkout/payment',
    },
    attempt: 0,
    detectedAt: '2026-08-03T00:00:00.000Z',
    updatedAt: '2026-08-03T00:00:00.000Z',
    idempotencyKey: 'evt_checkout_1',
  };
}
