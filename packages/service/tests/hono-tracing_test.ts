import { assertEquals, assertExists } from '@std/assert';
import { context, propagation, SpanKind, trace } from 'npm:@opentelemetry/api@^1.9.1';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.5.0';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  type ReadableSpan,
  SimpleSpanProcessor,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import { createService } from '../mod.ts';

const INBOUND_TRACE_ID = 'cccccccccccccccccccccccccccccccc';
const INBOUND_PARENT_ID = 'dddddddddddddddd';

Deno.test('service builder installs Hono tracing before downstream routes', async () => {
  await withRecordingProvider(async ({ exporter, provider }) => {
    const app = createService({}, { name: 'users' })
      .route('get', '/profiles/:id', (c) => {
        provider.getTracer('service-test').startActiveSpan('orpc.profiles.show', (span) => {
          span.end();
        });
        return c.text(c.req.param('id') ?? '');
      })
      .build();

    const response = await app.request('/profiles/42', {
      headers: {
        traceparent: `00-${INBOUND_TRACE_ID}-${INBOUND_PARENT_ID}-01`,
      },
    });

    assertEquals(response.status, 200);
    assertEquals(await response.text(), '42');

    await provider.forceFlush();
    const spans = exporter.getFinishedSpans();
    const honoSpan = findSpan(spans, 'GET /profiles/:id');
    const childSpan = findSpan(spans, 'orpc.profiles.show');

    assertEquals(honoSpan.kind, SpanKind.SERVER);
    assertEquals(honoSpan.parentSpanContext?.spanId, INBOUND_PARENT_ID);
    assertEquals(honoSpan.attributes['http.route'], '/profiles/:id');
    assertEquals(honoSpan.attributes['netscript.http.service'], 'users');
    assertEquals(honoSpan.attributes['rpc.service'], 'users');
    assertEquals(childSpan.spanContext().traceId, INBOUND_TRACE_ID);
    assertEquals(childSpan.parentSpanContext?.spanId, honoSpan.spanContext().spanId);
  });
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
  trace.setGlobalTracerProvider(provider);

  try {
    await run({ exporter, provider });
  } finally {
    await provider.shutdown();
    trace.disable();
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
