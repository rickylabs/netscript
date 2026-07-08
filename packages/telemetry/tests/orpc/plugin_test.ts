import { assertEquals } from '@std/assert';
import { ErrorHandlingPlugin, type GenericHandlerOptions, TracingPlugin } from '../../orpc.ts';
import { SpanStatusCode } from '@opentelemetry/api';
import type {
  Attributes,
  Exception,
  Link,
  Span,
  SpanContext,
  SpanStatus,
  TimeInput,
} from '@opentelemetry/api';

class FakeInstrumentation {
  enabled = 0;

  enable(): void {
    this.enabled += 1;
  }
}

class ActiveSpanRecorder implements Span {
  readonly attributes: Attributes = {};
  readonly events: { readonly name: string; readonly attributes?: Attributes }[] = [];
  readonly exceptions: Exception[] = [];
  status: SpanStatus = { code: SpanStatusCode.UNSET };
  ended = false;
  name = 'orpc.middleware';

  spanContext(): SpanContext {
    return {
      traceId: '0af7651916cd43dd8448eb211c80319c',
      spanId: 'b7ad6b7169203331',
      traceFlags: 1,
    };
  }

  setAttribute(key: string, value: Attributes[string]): this {
    this.attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Attributes): this {
    Object.assign(this.attributes, attributes);
    return this;
  }

  addEvent(name: string, attributesOrStartTime?: Attributes | TimeInput): this {
    const attributes = isAttributes(attributesOrStartTime) ? attributesOrStartTime : undefined;
    this.events.push({ name, attributes });
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

  updateName(name: string): this {
    this.name = name;
    return this;
  }

  end(): void {
    this.ended = true;
  }

  isRecording(): boolean {
    return !this.ended;
  }

  recordException(exception: Exception): void {
    this.exceptions.push(exception);
  }
}

function isAttributes(value: unknown): value is Attributes {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    !(value instanceof Date);
}

Deno.test('TracingPlugin registers upstream instrumentation and oRPC interceptors', () => {
  const handlerOptions: GenericHandlerOptions = {};
  const instrumentation = new FakeInstrumentation();

  new TracingPlugin({ serviceName: 'users', instrumentation }).init(handlerOptions);

  assertEquals(instrumentation.enabled, 1);
  assertEquals(handlerOptions.rootInterceptors?.length, 1);
  assertEquals(handlerOptions.clientInterceptors?.length, 1);
});

Deno.test('TracingPlugin decorates the active upstream oRPC SERVER span', async () => {
  const handlerOptions: GenericHandlerOptions = {};
  const span = new ActiveSpanRecorder();

  new TracingPlugin({
    serviceName: 'users',
    instrumentation: new FakeInstrumentation(),
    activeSpanProvider: () => span,
  }).init(handlerOptions);

  await handlerOptions.rootInterceptors?.[0]?.({
    next: () => Promise.resolve({ matched: true }),
  });
  await handlerOptions.clientInterceptors?.[0]?.({
    path: ['v1', 'users', 'list'],
    input: { id: '123', expand: true },
    next: () => Promise.resolve({ id: '123' }),
  });

  assertEquals(span.attributes['rpc.system'], 'orpc');
  assertEquals(span.attributes['rpc.service'], 'users');
  assertEquals(span.attributes['netscript.rpc.transport'], 'orpc');
  assertEquals(span.attributes['rpc.method'], 'v1.users.list');
  assertEquals(span.attributes['netscript.rpc.procedure'], 'v1.users.list');
  assertEquals(span.attributes['rpc.input_keys'], 'id,expand');
  assertEquals(span.status.code, SpanStatusCode.OK);
  assertEquals(span.events.map((event) => event.name), [
    'rpc.procedure.start',
    'rpc.procedure.success',
  ]);
});

Deno.test('TracingPlugin records oRPC errors on the active upstream span', async () => {
  const handlerOptions: GenericHandlerOptions = {};
  const span = new ActiveSpanRecorder();
  const error = new Error('broken');

  new TracingPlugin({
    serviceName: 'users',
    instrumentation: new FakeInstrumentation(),
    activeSpanProvider: () => span,
  }).init(handlerOptions);

  try {
    await handlerOptions.clientInterceptors?.[0]?.({
      path: 'v1.users.get',
      next: () => Promise.reject(error),
    });
  } catch {
    // Expected: the interceptor annotates the active span and rethrows.
  }

  assertEquals(span.status.code, SpanStatusCode.ERROR);
  assertEquals(span.status.message, 'broken');
  assertEquals(span.attributes['rpc.error.code'], 'UNKNOWN');
  assertEquals(span.attributes['rpc.error.message'], 'broken');
  assertEquals(span.exceptions.length, 1);
  assertEquals(span.events.map((event) => event.name), [
    'rpc.procedure.start',
    'rpc.procedure.error',
  ]);
});

Deno.test('ErrorHandlingPlugin registers a client interceptor', () => {
  const handlerOptions: GenericHandlerOptions = {};

  new ErrorHandlingPlugin({ serviceName: 'users' }).init(handlerOptions);

  assertEquals(handlerOptions.clientInterceptors?.length, 1);
});
