import { assertEquals, assertExists } from '@std/assert';
import { context, trace } from 'npm:@opentelemetry/api@^1.9.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import { getJobTracer, withSpan } from '@netscript/telemetry/tracer';
import { createJobTools } from './job-tools.ts';

Deno.test('createJobTools exports handler events, progress, and child spans', async () => {
  context.disable();
  trace.disable();
  const contextManager = new AsyncLocalStorageContextManager().enable();
  context.setGlobalContextManager(contextManager);
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  trace.setGlobalTracerProvider(provider);
  const progressReports: Array<readonly [number, string | undefined]> = [];

  try {
    await withSpan(getJobTracer(), 'job.handler', async () => {
      const tools = createJobTools({
        id: 'job.fixture',
        payload: {},
        reportProgress: (percent, message) => {
          progressReports.push([percent, message]);
        },
      });

      tools.trace.addEvent('handler.started', { source: 'fixture' });
      tools.trace.recordProgress(2, 4, 'items');
      await tools.progress(25, 'quarter complete');
      await tools.trace.withChildSpan('handler.child', (span) => {
        span.setAttribute('child.kind', 'fixture');
        span.addEvent('child.work');
        return Promise.resolve();
      });
    });
    await provider.forceFlush();

    assertEquals(progressReports, [[25, 'quarter complete']]);
    const spans = exporter.getFinishedSpans();
    const parent = spans.find((span) => span.name === 'job.handler');
    const child = spans.find((span) => span.name === 'handler.child');
    assertExists(parent, 'expected the active handler span to be exported');
    assertExists(child, 'expected createJobTools to export a real child span');
    assertEquals(child.spanContext().traceId, parent.spanContext().traceId);
    assertEquals(child.parentSpanContext?.spanId, parent.spanContext().spanId);
    assertEquals(child.attributes['child.kind'], 'fixture');
    assertEquals(child.events.map((event) => event.name), ['child.work']);
    assertEquals(parent.events.map((event) => event.name), [
      'handler.started',
      'job.progress',
      'job.progress',
    ]);
    assertEquals(parent.events[0]?.attributes, { source: 'fixture' });
    assertEquals(parent.events[1]?.attributes, {
      'progress.current': 2,
      'progress.total': 4,
      'progress.percentage': 50,
      'progress.unit': 'items',
    });
    assertEquals(parent.events[2]?.attributes, {
      'progress.current': 25,
      'progress.total': 100,
      'progress.percentage': 25,
      'progress.unit': 'percent',
    });
  } finally {
    await provider.shutdown();
    trace.disable();
    context.disable();
    contextManager.disable();
  }
});
