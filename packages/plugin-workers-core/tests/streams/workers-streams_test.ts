import { context, propagation, trace, type Tracer } from 'npm:@opentelemetry/api@^1.9.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.5.0';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { extractContext, withContext } from '@netscript/telemetry/context';
import {
  createStreamMutationHook,
  toExecutionStreamEntity,
  WorkerJobSchema,
  type WorkersStreamProducer,
} from '../../src/streams/mod.ts';
import type { ExecutionRecord } from '../../src/domain/mod.ts';

const STORED_TRACE_ID = '11111111111111111111111111111111';
const AMBIENT_TRACE_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const STORED_TRACEPARENT = `00-${STORED_TRACE_ID}-2222222222222222-01`;
const AMBIENT_TRACEPARENT = `00-${AMBIENT_TRACE_ID}-bbbbbbbbbbbbbbbb-01`;

Deno.test('toExecutionStreamEntity maps execution records to stream entities', () => {
  const execution: ExecutionRecord = {
    id: '6e029d36-e1bc-4a75-a0d8-58f24e33f6a5',
    concept: 'job',
    jobId: 'health-check',
    topic: 'default',
    status: 'running',
    triggeredBy: 'api',
    triggeredAt: '2026-05-11T00:00:00.000Z',
    startedAt: null,
    completedAt: null,
    exitCode: null,
    duration: null,
    error: null,
    result: null,
    workerId: null,
    attempt: 0,
    maxAttempts: 3,
  };

  assertEquals(toExecutionStreamEntity(execution), {
    id: execution.id,
    jobId: 'health-check',
    topic: 'default',
    concept: 'job',
    status: 'running',
    correlationId: undefined,
    triggeredAt: '2026-05-11T00:00:00.000Z',
    startedAt: null,
    completedAt: null,
    duration: null,
    exitCode: null,
    error: null,
    result: null,
    workerId: null,
    attempt: 0,
  });
});

Deno.test('createStreamMutationHook upserts and deletes execution entities', () => {
  const calls: Array<{ op: string; collection: string; value: unknown }> = [];
  const producer = {
    upsert: (collection: string, value: unknown) => {
      calls.push({ op: 'upsert', collection, value });
    },
    delete: (collection: string, value: unknown) => {
      calls.push({ op: 'delete', collection, value });
    },
  };
  const hook = createStreamMutationHook(
    producer as unknown as Parameters<typeof createStreamMutationHook>[0],
  );
  const execution: ExecutionRecord = {
    id: '6e029d36-e1bc-4a75-a0d8-58f24e33f6a5',
    concept: 'job',
    jobId: 'health-check',
    topic: 'default',
    status: 'completed',
    triggeredBy: 'api',
    triggeredAt: '2026-05-11T00:00:00.000Z',
    startedAt: null,
    completedAt: null,
    exitCode: 0,
    duration: 10,
    error: null,
    result: null,
    workerId: null,
    attempt: 0,
    maxAttempts: 3,
  };

  hook({ type: 'updated', execution });
  hook({ type: 'deleted', execution });

  assertEquals(calls.map((call) => [call.op, call.collection]), [
    ['upsert', 'execution'],
    ['delete', 'execution'],
  ]);
});

Deno.test('createStreamMutationHook publishes mutations on the stored trace context', async () => {
  const telemetry = createTelemetryHarness();
  const hook = createStreamMutationHook(recordingProducer(telemetry.tracer));
  const execution = executionFixture({ traceparent: STORED_TRACEPARENT });

  try {
    withContext(extractContext({ traceparent: AMBIENT_TRACEPARENT }), () => {
      hook({ type: 'updated', execution });
    });
    await telemetry.provider.forceFlush();

    const publishSpan = telemetry.exporter.getFinishedSpans()[0];
    assertEquals(publishSpan?.name, 'stream.publish');
    assertEquals(publishSpan?.spanContext().traceId, STORED_TRACE_ID);
    assertNotEquals(publishSpan?.spanContext().traceId, AMBIENT_TRACE_ID);
  } finally {
    await telemetry.close();
  }
});

Deno.test(
  'createStreamMutationHook publishes pre-span mutations on the stored trace id',
  async () => {
    const telemetry = createTelemetryHarness();
    const hook = createStreamMutationHook(recordingProducer(telemetry.tracer));

    try {
      hook({ type: 'created', execution: executionFixture({ traceparent: STORED_TRACEPARENT }) });
      await telemetry.provider.forceFlush();

      const publishTraceId = telemetry.exporter.getFinishedSpans()[0]?.spanContext().traceId;
      assertEquals(publishTraceId, STORED_TRACE_ID);
      assertNotEquals(publishTraceId, '00000000000000000000000000000000');
    } finally {
      await telemetry.close();
    }
  },
);

Deno.test('WorkerJobSchema keeps the public job stream surface thin', () => {
  assertEquals(
    WorkerJobSchema.parse({
      id: 'health-check',
      name: 'Health Check',
      topic: 'default',
      enabled: true,
    }),
    {
      id: 'health-check',
      name: 'Health Check',
      topic: 'default',
      enabled: true,
    },
  );
});

function executionFixture(overrides: Partial<ExecutionRecord> = {}): ExecutionRecord {
  return {
    id: '6e029d36-e1bc-4a75-a0d8-58f24e33f6a5',
    concept: 'job',
    jobId: 'health-check',
    topic: 'default',
    status: 'completed',
    triggeredBy: 'api',
    triggeredAt: '2026-05-11T00:00:00.000Z',
    startedAt: null,
    completedAt: null,
    exitCode: 0,
    duration: 10,
    error: null,
    result: null,
    workerId: null,
    attempt: 0,
    maxAttempts: 3,
    ...overrides,
  };
}

function recordingProducer(tracer: Tracer): WorkersStreamProducer {
  return {
    delete: () => {},
    upsert: () => {
      const span = tracer.startSpan('stream.publish');
      span.end();
    },
  };
}

function createTelemetryHarness(): Readonly<{
  tracer: Tracer;
  exporter: InMemorySpanExporter;
  provider: BasicTracerProvider;
  close(): Promise<void>;
}> {
  trace.disable();
  context.disable();
  propagation.disable();
  const contextManager = new AsyncLocalStorageContextManager().enable();
  assert(context.setGlobalContextManager(contextManager));
  assert(propagation.setGlobalPropagator(new W3CTraceContextPropagator()));
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  assert(trace.setGlobalTracerProvider(provider));
  return {
    tracer: provider.getTracer('workers-stream-hook-test'),
    exporter,
    provider,
    async close(): Promise<void> {
      await provider.shutdown();
      trace.disable();
      context.disable();
      propagation.disable();
    },
  };
}
