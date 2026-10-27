import { assertEquals, assertExists, assertNotEquals } from '@std/assert';
import { context, propagation, ROOT_CONTEXT, trace } from 'npm:@opentelemetry/api@^1.9.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.5.0';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import { createMcpAppCallHandler } from './mcp-app-call-handler.ts';

const REMOTE_TRACE_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REMOTE_PARENT_ID = 'bbbbbbbbbbbbbbbb';
const TRACEPARENT = `00-${REMOTE_TRACE_ID}-${REMOTE_PARENT_ID}-01`;

Deno.test('MCP tool calls prefer the active request, then the remote carrier, then root', async (t) => {
  context.disable();
  propagation.disable();
  const manager = new AsyncLocalStorageContextManager().enable();
  context.setGlobalContextManager(manager);
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  const tracer = provider.getTracer('mcp-app-parenting-test');
  const handler = createMcpAppCallHandler({
    tracer,
    clients: {
      server: () => ({
        listTools: () =>
          Promise.resolve([{ name: 'weather', remoteName: 'weather', serverId: 'widgets' }]),
      }),
      callTool: () => Promise.resolve({ toolCallId: 'call-1', content: '{}' }),
    },
  });

  try {
    for (const active of [true, false]) {
      for (const traceparent of [undefined, TRACEPARENT, 'malformed']) {
        await t.step(
          `${active ? 'active request' : 'no active span'} / ${traceparent ?? 'absent'}`,
          async () => {
            exporter.reset();
            const requestSpan = active
              ? tracer.startSpan('http.request', { kind: 1 }, ROOT_CONTEXT)
              : undefined;
            const parent = requestSpan ? trace.setSpan(ROOT_CONTEXT, requestSpan) : ROOT_CONTEXT;
            const request = new Request('https://app.test/api/mcp-apps/call?serverId=widgets', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                ...(traceparent === undefined ? {} : { traceparent }),
              },
              body: JSON.stringify({ toolName: 'weather' }),
            });
            try {
              const response = await context.with(parent, () => handler(request));
              assertEquals(response.status, 200);
              await response.json();
              await provider.forceFlush();
              const spans = exporter.getFinishedSpans();
              assertEquals(spans.length, 1);
              const call = spans[0];
              assertExists(call);
              assertEquals(call.name, 'mcp.tool.call');
              assertEquals(call.kind, 2);
              if (requestSpan) {
                assertEquals(call.parentSpanContext?.spanId, requestSpan.spanContext().spanId);
                assertEquals(call.spanContext().traceId, requestSpan.spanContext().traceId);
                assertNotEquals(call.spanContext().traceId, REMOTE_TRACE_ID);
              } else if (traceparent === TRACEPARENT) {
                assertEquals(call.parentSpanContext?.spanId, REMOTE_PARENT_ID);
                assertEquals(call.parentSpanContext?.isRemote, true);
                assertEquals(call.spanContext().traceId, REMOTE_TRACE_ID);
              } else {
                assertEquals(call.parentSpanContext, undefined);
                assertNotEquals(call.spanContext().traceId, REMOTE_TRACE_ID);
                assertEquals(call.spanContext().traceId.length, 32);
              }
            } finally {
              requestSpan?.end();
            }
          },
        );
      }
    }
  } finally {
    await provider.shutdown();
    propagation.disable();
    context.disable();
    manager.disable();
  }
});
