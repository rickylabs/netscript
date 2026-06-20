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
import { SpanKind, SpanStatusCode } from '@netscript/telemetry/tracer';

import { createOtelSagaTracer } from '../../src/telemetry/otel-saga-tracer.ts';

Deno.test('createOtelSagaTracer maps saga span operations to OpenTelemetry span operations', () => {
  const tracer = new RecordingTracer();
  const sagaTracer = createOtelSagaTracer(tracer);
  const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
  const span = sagaTracer.startSpan('saga.handle', {
    kind: 'consumer',
    attributes: {
      'saga.id': 'user-registration',
      'saga.attempt': 1,
    },
    parent: {
      traceparent,
      tracestate: 'vendor=value',
    },
  });
  const error = new Error('handler failed');

  span.setAttribute('saga.instance.id', 'user-registration:42');
  span.addEvent('state.before', { 'saga.status': 'running' });
  span.setStatus('error', 'handler failed');
  span.recordException(error);
  span.end(new Date('2026-06-20T00:00:00.000Z'));

  assertEquals(tracer.started.length, 1);
  const started = tracer.started[0];
  assertEquals(started.name, 'saga.handle');
  assertEquals(started.options?.kind, SpanKind.CONSUMER);
  assertEquals(started.options?.attributes, {
    'saga.id': 'user-registration',
    'saga.attempt': 1,
  });
  assert(started.context);
  assertEquals(
    getTraceContext(started.context)?.traceparent?.slice(0, 36),
    traceparent.slice(0, 36),
  );

  const otelSpan = tracer.spans[0];
  assertEquals(otelSpan.attributes['saga.instance.id'], 'user-registration:42');
  assertEquals(otelSpan.events, [
    { name: 'state.before', attributes: { 'saga.status': 'running' } },
  ]);
  assertEquals(otelSpan.status, { code: SpanStatusCode.ERROR, message: 'handler failed' });
  assertEquals(otelSpan.exceptions, [error]);
  assertEquals(otelSpan.endedAt, new Date('2026-06-20T00:00:00.000Z'));
});

Deno.test('createOtelSagaTracer maps successful saga span status to OpenTelemetry OK', () => {
  const tracer = new RecordingTracer();
  const sagaTracer = createOtelSagaTracer(tracer);
  const span = sagaTracer.startSpan('saga.handle', { kind: 'internal' });

  span.setStatus('ok');
  span.end();

  assertEquals(tracer.started[0].options?.kind, SpanKind.INTERNAL);
  assertEquals(tracer.spans[0].status, { code: SpanStatusCode.OK, message: undefined });
  assertEquals(tracer.spans[0].endedAt, undefined);
});

class RecordingTracer implements Tracer {
  readonly started: Array<{
    name: string;
    options?: SpanOptions;
    context?: Context;
  }> = [];
  readonly spans: RecordingSpan[] = [];

  startSpan(name: string, options?: SpanOptions, context?: Context): Span {
    const span = new RecordingSpan();
    this.started.push({ name, options, context });
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
  readonly events: Array<{
    name: string;
    attributes?: Attributes | TimeInput;
    startTime?: TimeInput;
  }> = [];
  readonly exceptions: Exception[] = [];
  readonly links: Link[] = [];
  status?: SpanStatus;
  endedAt?: TimeInput;
  name?: string;

  spanContext(): SpanContext {
    return {
      traceId: '11111111111111111111111111111111',
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

  addEvent(
    name: string,
    attributesOrStartTime?: Attributes | TimeInput,
    startTime?: TimeInput,
  ): this {
    this.events.push(
      startTime === undefined
        ? { name, attributes: attributesOrStartTime }
        : { name, attributes: attributesOrStartTime, startTime },
    );
    return this;
  }

  addLink(link: Link): this {
    this.links.push(link);
    return this;
  }

  addLinks(links: Link[]): this {
    this.links.push(...links);
    return this;
  }

  setStatus(status: SpanStatus): this {
    this.status = status;
    return this;
  }

  updateName(name: string): this {
    this.name = name;
    return this;
  }

  isRecording(): boolean {
    return true;
  }

  recordException(exception: Exception): void {
    this.exceptions.push(exception);
  }

  end(endTime?: TimeInput): void {
    this.endedAt = endTime;
  }
}

function assert(
  condition: unknown,
  message = 'Expected condition to be truthy.',
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals(actual: unknown, expected: unknown): void {
  if (!deepEqual(actual, expected)) {
    throw new Error(
      `Expected ${Deno.inspect(actual)} to equal ${Deno.inspect(expected)}.`,
    );
  }
}

function deepEqual(actual: unknown, expected: unknown): boolean {
  if (Object.is(actual, expected)) return true;
  if (actual instanceof Date || expected instanceof Date) {
    return actual instanceof Date && expected instanceof Date &&
      actual.getTime() === expected.getTime();
  }
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
