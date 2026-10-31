import { assertEquals, assertExists, assertNotEquals } from '@std/assert';
import { context, propagation, SpanStatusCode, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.5.0';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import {
  type MessageContext,
  type MessageQueue,
  TracedQueue,
  traceJobExecution,
} from '../../instrumentation.ts';
import { SpanNames } from '../../attributes.ts';

const REMOTE_TRACE_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REMOTE_PARENT_ID = 'bbbbbbbbbbbbbbbb';

Deno.test('shared queue worker isolates sequential and concurrent jobs and restores context after failure', async () => {
  const manager = new AsyncLocalStorageContextManager().enable();
  context.setGlobalContextManager(manager);
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  trace.setGlobalTracerProvider(provider);
  const tracer = provider.getTracer('queue-parenting-test');
  const worker = tracer.startSpan('worker.lifetime');
  const contexts: MessageContext[] = Array.from({ length: 6 }, (_, index): MessageContext => ({
    messageId: `delivery-${index}`,
    deliveryCount: 1,
    enqueuedAt: new Date(),
    headers: index === 4
      ? { traceparent: `00-${REMOTE_TRACE_ID}-${REMOTE_PARENT_ID}-01`, tracestate: 'vendor=value' }
      : index === 5
      ? { traceparent: 'malformed' }
      : {},
    ack: () => Promise.resolve(),
    nack: () => Promise.resolve(),
  }));
  const results: PromiseSettledResult<void>[] = [];
  const inner: MessageQueue<number> = {
    nativeRetrial: false,
    enqueue: () => Promise.resolve(),
    stop: () => Promise.resolve(),
    async listen(handler) {
      // Reuse the same listener context before, during and after a failed delivery.
      await handler(0, contexts[0]!);
      results.push(
        ...await Promise.allSettled(
          [1, 2, 3].map((index) => handler(index, contexts[index]!)),
        ),
      );
      await handler(4, contexts[4]!);
      await handler(5, contexts[5]!);
      assertEquals(trace.getActiveSpan()?.spanContext().spanId, worker.spanContext().spanId);
    },
  };
  try {
    await context.with(
      trace.setSpan(context.active(), worker),
      () =>
        new TracedQueue(inner, { queueName: 'jobs' }).listen(async (index, delivery) => {
          await traceJobExecution({
            job: { id: `job-${index}` },
            execution: { executionId: delivery.messageId, jobId: `job-${index}` },
          }, async () => {
            await Promise.resolve();
            const nested = tracer.startSpan(`handler-${index}`);
            nested.end();
            if (index === 2) throw new Error('delivery failed');
            await delivery.ack();
            return { success: true };
          });
        }),
    );
    await provider.forceFlush();
    const spans = exporter.getFinishedSpans();
    const consumers = spans.filter((span) => span.name === SpanNames.QUEUE_DEQUEUE);
    assertEquals(consumers.length, contexts.length);
    assertEquals(results.map((result) => result.status), ['fulfilled', 'rejected', 'fulfilled']);
    const jobTraceIds = new Set<string>();
    for (const [index, delivery] of contexts.entries()) {
      const consumer = consumers.find((span) =>
        span.attributes['messaging.message.id'] === delivery.messageId
      );
      assertExists(consumer);
      const job = spans.find((span) =>
        span.name === SpanNames.JOB_EXECUTE &&
        span.parentSpanContext?.spanId === consumer.spanContext().spanId
      );
      const nested = spans.find((span) => span.name === `handler-${index}`);
      assertExists(job);
      assertExists(nested);
      const traceId = consumer.spanContext().traceId;
      jobTraceIds.add(traceId);
      assertNotEquals(traceId, worker.spanContext().traceId);
      assertEquals(job.spanContext().traceId, traceId);
      assertEquals(nested.spanContext().traceId, traceId);
      assertEquals(nested.parentSpanContext?.spanId, job.spanContext().spanId);
      assertEquals(consumer.status.code, index === 2 ? SpanStatusCode.ERROR : SpanStatusCode.OK);
      assertEquals(job.status.code, index === 2 ? SpanStatusCode.ERROR : SpanStatusCode.OK);
      assertEquals(consumer.parentSpanContext?.spanId, index === 4 ? REMOTE_PARENT_ID : undefined);
      if (index === 4) {
        assertEquals(traceId, REMOTE_TRACE_ID);
        assertEquals(consumer.spanContext().traceState?.serialize(), 'vendor=value');
      }
    }
    assertEquals(jobTraceIds.size, contexts.length);
    assertEquals(trace.getActiveSpan(), undefined);
  } finally {
    worker.end();
    await provider.shutdown();
    trace.disable();
    propagation.disable();
    context.disable();
    manager.disable();
  }
});
