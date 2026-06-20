import { getTraceContext } from '@netscript/telemetry/context';
import type {
  Attributes,
  AttributeValue,
  Context,
  Exception,
  Link,
  Span,
  SpanContext,
  SpanOptions,
  SpanStatus,
  TimeInput,
  Tracer,
} from '@netscript/telemetry/tracer';
import type {
  CascadedMessage,
  SagaCorrelationKey,
  SagaDefinition,
  SagaHandler,
  SagaId,
  SagaMessage,
  SagaState,
} from '@netscript/plugin-sagas-core/domain';
import { createSagaRuntime, type SagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import type {
  SagaRuntimeMessage,
  SagaRuntimePublishOptions,
} from '../../services/src/routers/v1-types.ts';
import { publishSagaMessage } from '../../services/src/routers/v1-handlers.ts';
import { createSagaTelemetry } from '../../src/telemetry/otel-saga-tracer.ts';

Deno.test('publishSagaMessage propagates API trace headers as saga.handle parent context', async () => {
  const tracer = new RecordingTracer();
  const runtime = createSagaRuntime({
    native: { instrumentation: createSagaTelemetry(tracer) },
  });
  const events: unknown[] = [];
  const serverTraceparent = '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01';

  await runtime.register([
    createDefinition('api-trace-success', 'order.submitted', () => [
      { kind: 'complete' } satisfies CascadedMessage<'complete'>,
    ]),
  ]);
  await runtime.start();
  try {
    await publishSagaMessage({
      type: 'order.submitted',
      payload: { orderId: 'order-1' },
      correlationId: 'order-1',
    }, {
      runtime: asServiceRuntime(runtime),
      traceHeaders: { traceparent: serverTraceparent },
      writeEvent: (event) => {
        events.push(event);
        return Promise.resolve();
      },
    });

    assertEquals(events.length, 1);
    assertEquals(tracer.started.length, 1);
    const started = tracer.started[0];
    const span = tracer.spans[0];
    assertEquals(started.name, 'saga.handle');
    assertEquals(started.parentTraceparent, serverTraceparent);
    assertEquals(span.parentTraceId, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assertEquals(span.parentSpanId, 'bbbbbbbbbbbbbbbb');
    assertEquals(span.spanContext().traceId, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assertEquals(span.attributes.outcome, 'success');
  } finally {
    await runtime.stop('publish trace linkage test complete');
  }
});

Deno.test('publishSagaMessage records ERROR saga.handle span when handler throws', async () => {
  const tracer = new RecordingTracer();
  const runtime = createSagaRuntime({
    native: { instrumentation: createSagaTelemetry(tracer) },
  });
  const failure = new Error('service handler failed');
  const serverTraceparent = '00-cccccccccccccccccccccccccccccccc-dddddddddddddddd-01';

  await runtime.register([
    createDefinition('api-trace-failure', 'order.failed', () => {
      throw failure;
    }),
  ]);
  await runtime.start();
  try {
    await assertRejects(
      () =>
        publishSagaMessage({
          type: 'order.failed',
          payload: { orderId: 'order-2' },
          correlationId: 'order-2',
        }, {
          runtime: asServiceRuntime(runtime),
          traceHeaders: { traceparent: serverTraceparent },
          writeEvent: () => Promise.resolve(),
        }),
      Error,
      'service handler failed',
    );

    assertEquals(tracer.started.length, 1);
    const span = tracer.spans[0];
    assertEquals(tracer.started[0].parentTraceparent, serverTraceparent);
    assertEquals(span.status, { code: 2, message: 'service handler failed' });
    assertEquals(span.exceptions, [failure]);
    assertEquals(span.attributes.outcome, 'error');
    assertEquals(span.ended, true);
  } finally {
    await runtime.stop('publish trace failure test complete');
  }
});

function asServiceRuntime(runtime: SagaRuntime): {
  publish(message: SagaRuntimeMessage, options?: SagaRuntimePublishOptions): Promise<unknown>;
} {
  return {
    publish: (message, options) =>
      runtime.publish({
        ...message,
        payload: message.payload ?? {},
        correlationKey: message.correlationKey as SagaCorrelationKey | undefined,
      }, options),
  };
}

function createDefinition(
  id: string,
  messageType: string,
  handler: SagaHandler<SagaState, SagaMessage>,
): SagaDefinition {
  return Object.freeze({
    id: id as SagaId,
    durability: 't1',
    initialState: Object.freeze({}),
    handledMessageTypes: Object.freeze([messageType]),
    correlations: Object.freeze([]),
    handlers: new Map<string, SagaHandler<SagaState, SagaMessage>>([[messageType, handler]]),
    compensations: new Map(),
    signalHandlers: new Map(),
    queryHandlers: new Map(),
  }) as SagaDefinition;
}

class RecordingTracer implements Tracer {
  readonly started: Array<{
    name: string;
    options?: SpanOptions;
    context?: Context;
    parentTraceparent?: string;
  }> = [];
  readonly spans: RecordingSpan[] = [];

  startSpan(name: string, options?: SpanOptions, context?: Context): Span {
    const parentTraceparent = context ? getTraceContext(context)?.traceparent : undefined;
    const span = new RecordingSpan(parentTraceparent);
    this.started.push({ name, options, context, parentTraceparent });
    this.spans.push(span);
    return span;
  }

  startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
  startActiveSpan<T>(name: string, options: SpanOptions, fn: (span: Span) => T): T;
  startActiveSpan<T>(
    name: string,
    options: SpanOptions,
    context: Context,
    fn: (span: Span) => T,
  ): T;
  startActiveSpan<T>(
    name: string,
    optionsOrFn: SpanOptions | ((span: Span) => T),
    contextOrFn?: Context | ((span: Span) => T),
    fn?: (span: Span) => T,
  ): T {
    const callback = typeof optionsOrFn === 'function'
      ? optionsOrFn
      : typeof contextOrFn === 'function'
      ? contextOrFn
      : fn;
    if (!callback) {
      throw new Error('RecordingTracer.startActiveSpan requires a callback.');
    }
    return callback(this.startSpan(name));
  }
}

class RecordingSpan implements Span {
  readonly attributes: Record<string, AttributeValue> = {};
  readonly events: string[] = [];
  readonly exceptions: Exception[] = [];
  readonly parentTraceId?: string;
  readonly parentSpanId?: string;
  status?: SpanStatus;
  ended = false;

  constructor(parentTraceparent?: string) {
    const parsed = parentTraceparent?.split('-');
    this.parentTraceId = parsed?.[1];
    this.parentSpanId = parsed?.[2];
  }

  spanContext(): SpanContext {
    return {
      traceId: this.parentTraceId ?? '11111111111111111111111111111111',
      spanId: '2222222222222222',
      traceFlags: 1,
    };
  }

  setAttribute(key: string, value: AttributeValue): this {
    this.attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Attributes): this {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) {
        this.attributes[key] = value;
      }
    }
    return this;
  }

  addEvent(name: string): this {
    this.events.push(name);
    return this;
  }

  addLink(_link: Link): this {
    return this;
  }

  addLinks(_links: Link[]): this {
    return this;
  }

  setStatus(status: SpanStatus): this {
    this.status = status;
    return this;
  }

  updateName(_name: string): this {
    return this;
  }

  isRecording(): boolean {
    return true;
  }

  recordException(exception: Exception): void {
    this.exceptions.push(exception);
  }

  end(_endTime?: TimeInput): void {
    this.ended = true;
  }
}

function assertEquals(actual: unknown, expected: unknown): void {
  if (!deepEqual(actual, expected)) {
    throw new Error(
      `Expected ${Deno.inspect(actual)} to equal ${Deno.inspect(expected)}.`,
    );
  }
}

async function assertRejects(
  action: () => Promise<unknown>,
  errorClass: new (...args: never[]) => Error,
  messageIncludes: string,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (!(error instanceof errorClass)) {
      throw new Error(`Expected ${errorClass.name}, received ${Deno.inspect(error)}.`);
    }
    if (!error.message.includes(messageIncludes)) {
      throw new Error(`Expected error message to include ${messageIncludes}.`);
    }
    return;
  }
  throw new Error('Expected action to reject.');
}

function deepEqual(actual: unknown, expected: unknown): boolean {
  if (Object.is(actual, expected)) return true;
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) {
      return false;
    }
    return actual.every((item, index) => deepEqual(item, expected[index]));
  }
  if (!isRecord(actual) || !isRecord(expected)) {
    return false;
  }
  const actualKeys = Reflect.ownKeys(actual);
  const expectedKeys = Reflect.ownKeys(expected);
  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }
  return actualKeys.every((key) =>
    expectedKeys.includes(key) &&
    deepEqual(
      (actual as Readonly<Record<PropertyKey, unknown>>)[key],
      (expected as Readonly<Record<PropertyKey, unknown>>)[key],
    )
  );
}

function isRecord(value: unknown): value is Readonly<Record<PropertyKey, unknown>> {
  return typeof value === 'object' && value !== null;
}
