import { assertEquals } from '@std/assert';
import { SpanKind, SpanStatusCode } from '@netscript/telemetry';
import { InMemorySpanRecorder } from '@netscript/telemetry/testing';
import { createOtelSdkSpanLink } from '@netscript/telemetry/otel';
import {
  createStreamsInstrumentation,
  StreamAttributes,
  StreamSpanNames,
} from '../../src/telemetry/mod.ts';

Deno.test('StreamsInstrumentation emits producer span and injects trace headers on publish', () => {
  const recorder = new InMemorySpanRecorder();
  const instrumentation = createStreamsInstrumentation({ tracer: recorder });
  let headers: Record<string, string> = {};

  instrumentation.publish({
    streamPath: '/workers/executions',
    collection: 'execution',
    operation: 'upsert',
    producerId: 'workers-service',
    messageId: 'execution-1',
    correlationId: 'corr-1',
    emit: (injected) => {
      headers = injected;
    },
  });

  const span = recorder.snapshots()[0];
  assertEquals(span?.name, StreamSpanNames.PUBLISH);
  assertEquals(span?.kind, SpanKind.PRODUCER);
  assertEquals(span?.status, { code: SpanStatusCode.OK });
  assertEquals(span?.attributes[StreamAttributes.STREAM_PATH], '/workers/executions');
  assertEquals(span?.attributes[StreamAttributes.COLLECTION], 'execution');
  assertEquals(span?.attributes[StreamAttributes.MESSAGE_ID], 'execution-1');
  assertEquals(span?.attributes[StreamAttributes.CORRELATION_ID], 'corr-1');
  assertEquals(typeof headers.traceparent, 'string');
});

Deno.test('StreamsInstrumentation starts consumer span with SDK fan-in link attributes', () => {
  const recorder = new InMemorySpanRecorder();
  const instrumentation = createStreamsInstrumentation({
    tracer: recorder,
    spanLinks: createOtelSdkSpanLink(),
  });

  const span = instrumentation.startSubscribeSpan({
    streamPath: '/workers/executions',
    collection: 'execution',
    messages: [{
      traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
      streamPath: '/workers/executions',
      collection: 'execution',
      operation: 'upsert',
      messageId: 'execution-1',
      correlationId: 'corr-1',
    }],
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  const snapshot = recorder.snapshots()[0];
  assertEquals(snapshot?.name, StreamSpanNames.SUBSCRIBE);
  assertEquals(snapshot?.kind, SpanKind.CONSUMER);
  assertEquals(snapshot?.links.length, 1);
  assertEquals(snapshot?.links[0]?.context.traceId, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  assertEquals(snapshot?.links[0]?.attributes?.[StreamAttributes.MESSAGE_ID], 'execution-1');
  assertEquals(snapshot?.links[0]?.attributes?.[StreamAttributes.CORRELATION_ID], 'corr-1');
});
