import { assertEquals, assertExists } from '@std/assert';
import { Hono } from 'jsr:@hono/hono@4.12.24';
import { context, propagation, SpanKind, trace } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.5.0';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  type ReadableSpan,
  SimpleSpanProcessor,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import { createHonoTracingMiddleware } from '../../hono.ts';

const INBOUND_TRACE_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const INBOUND_PARENT_ID = 'bbbbbbbbbbbbbbbb';

Deno.test('createHonoTracingMiddleware preserves route-shaped Hono span and downstream parenting', async () => {
  await withRecordingProvider(async ({ exporter, provider }) => {
    const app = new Hono();
    app.use('*', createHonoTracingMiddleware({ serviceName: 'users', tracerProvider: provider }));
    app.get('/users/:id', (c) => {
      provider.getTracer('telemetry-test').startActiveSpan('orpc.users.show', (span) => {
        span.end();
      });
      return c.text(c.req.param('id'));
    });

    const response = await app.request('/users/123', {
      headers: {
        traceparent: `00-${INBOUND_TRACE_ID}-${INBOUND_PARENT_ID}-01`,
      },
    });

    assertEquals(response.status, 200);
    assertEquals(await response.text(), '123');

    await provider.forceFlush();
    const spans = exporter.getFinishedSpans();
    const honoSpan = findSpan(spans, 'GET /users/:id');
    const childSpan = findSpan(spans, 'orpc.users.show');

    assertEquals(honoSpan.kind, SpanKind.SERVER);
    assertEquals(honoSpan.spanContext().traceId, INBOUND_TRACE_ID);
    assertEquals(honoSpan.parentSpanContext?.spanId, INBOUND_PARENT_ID);
    assertEquals(honoSpan.attributes['http.route'], '/users/:id');
    assertEquals(honoSpan.attributes['netscript.http.service'], 'users');
    assertEquals(honoSpan.attributes['netscript.http.method'], 'GET');
    assertEquals(honoSpan.attributes['netscript.http.status_code'], 200);
    assertEquals(honoSpan.attributes['rpc.service'], 'users');

    assertEquals(childSpan.spanContext().traceId, INBOUND_TRACE_ID);
    assertEquals(childSpan.parentSpanContext?.spanId, honoSpan.spanContext().spanId);
  });
});

Deno.test('createHonoTracingMiddleware is a no-op enrichment path without an active span', async () => {
  const app = new Hono();
  app.use('*', createHonoTracingMiddleware({ serviceName: 'disabled', disableTracing: true }));
  app.get('/health', (c) => {
    assertEquals(trace.getActiveSpan(), undefined);
    return c.text('ok');
  });

  const response = await app.request('/health');

  assertEquals(response.status, 200);
  assertEquals(await response.text(), 'ok');
});

interface RecordingProviderFixture {
  readonly exporter: InMemorySpanExporter;
  readonly provider: BasicTracerProvider;
}

async function withRecordingProvider(
  run: (fixture: RecordingProviderFixture) => Promise<void>,
): Promise<void> {
  context.disable();
  propagation.disable();
  const contextManager = new AsyncLocalStorageContextManager().enable();
  context.setGlobalContextManager(contextManager);
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());

  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });

  try {
    await run({ exporter, provider });
  } finally {
    await provider.shutdown();
    context.disable();
    propagation.disable();
    contextManager.disable();
  }
}

function findSpan(spans: readonly ReadableSpan[], name: string): ReadableSpan {
  const span = spans.find((candidate) => candidate.name === name);
  assertExists(span, `expected span ${name}`);
  return span;
}
