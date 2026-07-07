import { assertEquals } from '@std/assert';
import { ErrorHandlingPlugin, type GenericHandlerOptions, TracingPlugin } from '../../orpc.ts';
import { SpanKind } from '../../tracer.ts';
import { createInMemorySpanRecorder } from '../../src/testing/mod.ts';

Deno.test('TracingPlugin registers both root and client interceptors', () => {
  const handlerOptions: GenericHandlerOptions = {};

  new TracingPlugin({ serviceName: 'users' }).init(handlerOptions);

  assertEquals(handlerOptions.rootInterceptors?.length, 1);
  assertEquals(handlerOptions.clientInterceptors?.length, 1);
});

Deno.test('TracingPlugin emits a SERVER span through the shared tracer seam', async () => {
  const handlerOptions: GenericHandlerOptions = {};
  const tracer = createInMemorySpanRecorder();

  new TracingPlugin({ serviceName: 'users', tracer }).init(handlerOptions);
  const interceptor = handlerOptions.rootInterceptors?.[0];
  await interceptor?.({
    context: {
      traceHeaders: {
        traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
      },
    },
    next: () => Promise.resolve({ matched: true }),
  });

  const [span] = tracer.snapshots();
  assertEquals(span?.name, 'rpc.server');
  assertEquals(span?.kind, SpanKind.SERVER);
  assertEquals(span?.attributes['rpc.system'], 'orpc');
  assertEquals(span?.attributes['rpc.service'], 'users');
  assertEquals(span?.attributes['netscript.rpc.transport'], 'orpc');
  assertEquals(span?.status.code, 1);
  assertEquals(span?.ended, true);
});

Deno.test('ErrorHandlingPlugin registers a client interceptor', () => {
  const handlerOptions: GenericHandlerOptions = {};

  new ErrorHandlingPlugin({ serviceName: 'users' }).init(handlerOptions);

  assertEquals(handlerOptions.clientInterceptors?.length, 1);
});
