import { assertEquals } from 'jsr:@std/assert@^1';

import { type PublishMessageInput, PublishMessageInputSchema } from '../../contracts/v1/mod.ts';
import { publishSagaMessage } from '../../services/src/routers/v1-handlers.ts';
import type {
  SagaRuntimeMessage,
  SagaRuntimePublishOptions,
} from '../../services/src/routers/v1-types.ts';

Deno.test('publish contract accepts and round-trips idempotencyKey', () => {
  const parsed = PublishMessageInputSchema.parse({
    type: 'orders.created',
    payload: { orderId: 'ord_123' },
    correlationId: 'order:ord_123',
    idempotencyKey: 'orders.created:ord_123',
  }) as PublishMessageInput;

  assertEquals(parsed.idempotencyKey, 'orders.created:ord_123');
});

Deno.test('publishSagaMessage threads idempotencyKey to runtime message and options', async () => {
  const runtime = new RecordingRuntime();
  const events: unknown[] = [];

  const result = await publishSagaMessage({
    type: 'orders.created',
    payload: { orderId: 'ord_123' },
    correlationId: 'order:ord_123',
    idempotencyKey: 'orders.created:ord_123',
  }, {
    runtime,
    traceHeaders: {
      traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
      tracestate: 'vendor=value',
    },
    writeEvent: (event) => {
      events.push(event);
      return Promise.resolve();
    },
  });

  assertEquals(result, {
    published: true,
    messageType: 'orders.created',
    correlationId: 'order:ord_123',
  });
  assertEquals(runtime.messages[0].idempotencyKey, 'orders.created:ord_123');
  assertEquals(runtime.options[0].idempotencyKey, 'orders.created:ord_123');
  assertEquals(
    runtime.messages[0].traceparent,
    '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
  );
  assertEquals(runtime.options[0].tracestate, 'vendor=value');
  assertEquals(events.length, 1);
});

Deno.test('publishSagaMessage acknowledges duplicate already-applied runtime outcomes', async () => {
  const runtime = new RecordingRuntime({ alreadyApplied: true });

  const result = await publishSagaMessage({
    type: 'orders.created',
    idempotencyKey: 'orders.created:ord_123',
  }, {
    runtime,
    writeEvent: () => Promise.resolve(),
  });

  assertEquals(result.published, true);
  assertEquals(runtime.publishCount, 1);
});

class RecordingRuntime {
  readonly messages: SagaRuntimeMessage[] = [];
  readonly options: SagaRuntimePublishOptions[] = [];
  readonly #result: unknown;

  constructor(result: unknown = undefined) {
    this.#result = result;
  }

  get publishCount(): number {
    return this.messages.length;
  }

  publish(message: SagaRuntimeMessage, options?: SagaRuntimePublishOptions): Promise<unknown> {
    this.messages.push(message);
    this.options.push(options ?? {});
    return Promise.resolve(this.#result);
  }
}
