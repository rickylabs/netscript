import { assertEquals } from '@std/assert';
import { ORPCError } from '@orpc/client';
import { os } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import {
  type ErrorContext,
  ErrorHandlingPlugin,
  type GenericHandlerOptions,
  TracingPlugin,
} from '../../orpc.ts';
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

interface HandlerPlugin {
  readonly name?: string;
  readonly order?: number;
  init?(options: unknown, router: unknown): unknown;
}

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

async function invokeInterceptor(interceptor: unknown, options: unknown): Promise<unknown> {
  if (typeof interceptor !== 'function') {
    throw new TypeError('Expected the plugin to register an interceptor');
  }
  return await Reflect.apply(interceptor, undefined, [options]);
}

Deno.test('TracingPlugin registers upstream instrumentation and oRPC interceptors', () => {
  const handlerOptions: GenericHandlerOptions = {};
  const instrumentation = new FakeInstrumentation();
  const plugin = new TracingPlugin({ serviceName: 'users', instrumentation });

  const initialized = plugin.init(handlerOptions);

  assertEquals(plugin.name, 'netscript-tracing');
  assertEquals(initialized, handlerOptions);
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

  await invokeInterceptor(handlerOptions.rootInterceptors?.[0], {
    next: () => Promise.resolve({ matched: true }),
  });
  await invokeInterceptor(handlerOptions.clientInterceptors?.[0], {
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
    await invokeInterceptor(handlerOptions.clientInterceptors?.[0], {
      path: ['v1', 'users', 'get'],
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
  const plugin = new ErrorHandlingPlugin({ serviceName: 'users' });

  const initialized = plugin.init(handlerOptions);

  assertEquals(plugin.name, 'netscript-error-handling');
  assertEquals(initialized, handlerOptions);
  assertEquals(handlerOptions.clientInterceptors?.length, 1);
});

Deno.test('TracingPlugin runs root and procedure interceptors once inside a real RPCHandler', async () => {
  const span = new ActiveSpanRecorder();
  const instrumentation = new FakeInstrumentation();
  let rootCalls = 0;

  const router = {
    v1: {
      users: {
        list: os.handler(({ input }) => ({ count: Object.keys(input as object).length })),
      },
    },
  };

  const plugin: HandlerPlugin = new TracingPlugin({
    serviceName: 'users',
    instrumentation,
    activeSpanProvider: () => {
      rootCalls += 1;
      return span;
    },
  });

  const handler = new RPCHandler(router, { plugins: [plugin] });
  const request = new Request('http://localhost/rpc/v1/users/list', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ json: { id: '123', expand: true } }),
  });

  const result = await handler.handle(request, { prefix: '/rpc', context: {} });

  assertEquals(result.matched, true);
  assertEquals(result.response?.status, 200);
  assertEquals(await result.response?.json(), { json: { count: 2 } });
  assertEquals(instrumentation.enabled, 1);
  // activeSpanProvider is queried once in root interceptor and once in procedure interceptor.
  assertEquals(rootCalls, 2);
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

Deno.test('TracingPlugin and ErrorHandlingPlugin resolve HTTP status via errorStatusMap and standard fallback inside a real RPCHandler', async () => {
  const createCodedError = (code: string, message: string): Error =>
    Object.assign(new Error(message), { code });

  const router = {
    v1: {
      orders: {
        locked: os.handler(() => {
          throw createCodedError('ORDER_LOCKED', 'Order is locked');
        }),
        lockedZeroStatus: os.handler(() => {
          throw Object.assign(new Error('Order is locked'), { code: 'ORDER_LOCKED', status: 0 });
        }),
        lockedOrpcZeroStatus: os.handler(() => {
          throw new ORPCError('ORDER_LOCKED', { status: 0, message: 'Order is locked' });
        }),
        lengthRequired: os.handler(() => {
          throw createCodedError('LENGTH_REQUIRED', 'Content-Length required');
        }),
        preconditionRequired: os.handler(() => {
          throw createCodedError('PRECONDITION_REQUIRED', 'If-Match header required');
        }),
        tooLarge: os.handler(() => {
          throw createCodedError('PAYLOAD_TOO_LARGE', 'Payload exceeds limit');
        }),
        tooMany: os.handler(() => {
          throw createCodedError('TOO_MANY_REQUESTS', 'Rate limit hit');
        }),
        unknownCustom: os.handler(() => {
          throw createCodedError('CUSTOM_INFRA_FAILURE', 'Upstream storage error');
        }),
        v1NotFound: os.handler(() => {
          throw new ORPCError('NOT_FOUND', { status: 404, message: 'Missing order' });
        }),
      },
    },
  };

  const runCase = async (
    procedure: string,
    errorStatusMap: Readonly<Record<string, number>> | undefined,
    warnOnlyCodes: string[],
  ) => {
    const span = new ActiveSpanRecorder();
    const warnings: ErrorContext[] = [];
    const errors: ErrorContext[] = [];
    const plugins: HandlerPlugin[] = [
      new TracingPlugin({
        serviceName: 'orders',
        instrumentation: new FakeInstrumentation(),
        activeSpanProvider: () => span,
        errorStatusMap,
      }),
      new ErrorHandlingPlugin({
        serviceName: 'orders',
        exposeInternalErrors: false,
        warnOnlyCodes,
        errorStatusMap,
        logger: {
          warn: (ctx) => warnings.push(ctx),
          error: (ctx) => errors.push(ctx),
        },
      }),
    ];
    const handler = new RPCHandler(router, { plugins });

    const result = await handler.handle(
      new Request(`http://localhost/rpc/v1/orders/${procedure}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      }),
      { prefix: '/rpc', context: {} },
    );

    assertEquals(result.matched, true);
    await result.response?.body?.cancel();
    return { status: result.response?.status, span, warnings, errors };
  };

  const locked = await runCase('locked', { ORDER_LOCKED: 409 }, ['ORDER_LOCKED']);
  assertEquals(locked.status, 409);
  assertEquals(locked.span.attributes['rpc.error.status'], 409);
  assertEquals(locked.warnings.length, 1);
  assertEquals(locked.warnings[0]?.status, 409);
  assertEquals(locked.errors.length, 0);

  // Out-of-range errorStatusMap entries are ignored and fall back safely to 500 without RangeError.
  const invalidMapped = await runCase('locked', { ORDER_LOCKED: 700 }, ['ORDER_LOCKED']);
  assertEquals(invalidMapped.status, 500);
  assertEquals(invalidMapped.span.attributes['rpc.error.status'], 500);
  assertEquals(invalidMapped.errors.length, 1);
  assertEquals(invalidMapped.errors[0]?.status, 500);

  // Out-of-range explicit error.status (0) falls through to a valid errorStatusMap entry (409).
  const invalidExplicit = await runCase('lockedZeroStatus', { ORDER_LOCKED: 409 }, [
    'ORDER_LOCKED',
  ]);
  assertEquals(invalidExplicit.status, 409);
  assertEquals(invalidExplicit.span.attributes['rpc.error.status'], 409);
  assertEquals(invalidExplicit.warnings.length, 1);
  assertEquals(invalidExplicit.warnings[0]?.status, 409);

  // Even an ORPCError constructed with status 0 is sanitized through errorStatusMap.
  const invalidOrpcExplicit = await runCase('lockedOrpcZeroStatus', { ORDER_LOCKED: 409 }, [
    'ORDER_LOCKED',
  ]);
  assertEquals(invalidOrpcExplicit.status, 409);
  assertEquals(invalidOrpcExplicit.span.attributes['rpc.error.status'], 409);
  assertEquals(invalidOrpcExplicit.warnings.length, 1);

  const lengthRequired = await runCase('lengthRequired', {}, ['LENGTH_REQUIRED']);
  assertEquals(lengthRequired.status, 411);
  assertEquals(lengthRequired.span.attributes['rpc.error.status'], 411);
  assertEquals(lengthRequired.warnings.length, 1);
  assertEquals(lengthRequired.warnings[0]?.status, 411);

  const preconditionRequired = await runCase('preconditionRequired', {}, ['PRECONDITION_REQUIRED']);
  assertEquals(preconditionRequired.status, 428);
  assertEquals(preconditionRequired.span.attributes['rpc.error.status'], 428);
  assertEquals(preconditionRequired.warnings.length, 1);
  assertEquals(preconditionRequired.warnings[0]?.status, 428);

  const tooLarge = await runCase('tooLarge', {}, ['PAYLOAD_TOO_LARGE']);
  assertEquals(tooLarge.status, 413);
  assertEquals(tooLarge.span.attributes['rpc.error.status'], 413);
  assertEquals(tooLarge.warnings.length, 1);
  assertEquals(tooLarge.warnings[0]?.status, 413);

  const tooMany = await runCase('tooMany', {}, ['TOO_MANY_REQUESTS']);
  assertEquals(tooMany.status, 429);
  assertEquals(tooMany.span.attributes['rpc.error.status'], 429);
  assertEquals(tooMany.warnings.length, 1);

  const unknownCustom = await runCase('unknownCustom', {}, ['NOT_FOUND']);
  assertEquals(unknownCustom.status, 500);
  assertEquals(unknownCustom.span.attributes['rpc.error.status'], 500);
  assertEquals(unknownCustom.errors.length, 1);
  assertEquals(unknownCustom.errors[0]?.status, 500);

  const v1NotFound = await runCase('v1NotFound', {}, ['NOT_FOUND']);
  assertEquals(v1NotFound.status, 404);
  assertEquals(v1NotFound.span.attributes['rpc.error.status'], 404);
  assertEquals(v1NotFound.warnings.length, 1);
});
