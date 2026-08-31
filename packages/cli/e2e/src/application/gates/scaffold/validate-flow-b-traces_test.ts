import { assertThrows } from '@std/assert';
import type { TelemetrySpan } from '@netscript/telemetry/query';
import {
  assertConsumerLinksProducer,
  assertSagaCompensationCorrelation,
} from './validate-flow-b-traces.ts';

Deno.test('TC-14 zero-link diagnostic names producer and consumer identities', () => {
  const error = assertThrows(
    () => assertConsumerLinksProducer('producer-trace', span([])),
    Error,
    'SSE consumer has zero W3C links',
  );
  assertIncludesAll(error.message, [
    'producerTraceId=producer-trace',
    'consumerTraceId=consumer-trace',
    'consumerSpanId=consumer-span',
    'linkCount=0',
  ]);
});

Deno.test('TC-14 wrong-link diagnostic prints every link identity and count', () => {
  const error = assertThrows(
    () =>
      assertConsumerLinksProducer(
        'producer-trace',
        span([
          link('other-trace-a', 'other-span-a'),
          link('other-trace-b', 'other-span-b'),
        ]),
      ),
    Error,
    'SSE consumer W3C links do not point into the selected Flow-B producer trace',
  );
  assertIncludesAll(error.message, [
    'producerTraceId=producer-trace',
    'consumerTraceId=consumer-trace',
    'consumerSpanId=consumer-span',
    'linkCount=2',
    'link[0].traceId=other-trace-a',
    'link[0].spanId=other-span-a',
    'link[1].traceId=other-trace-b',
    'link[1].spanId=other-span-b',
  ]);
});

Deno.test('Flow-B saga validator accepts direct compensation parent and shared correlation', () => {
  const handle = telemetrySpan('saga.handle', 'saga-handle', undefined, {
    'netscript.saga.id': 'flow-b-compensation',
    'netscript.correlation.id': 'flow-b-42',
    'netscript.saga.correlation_key': 'flow-b-42',
  });
  const compensate = telemetrySpan('saga.cascade.compensate', 'saga-compensate', 'saga-handle', {
    'netscript.saga.id': 'flow-b-compensation',
    'netscript.correlation.id': 'flow-b-42',
    'netscript.saga.correlation_key': 'flow-b-42',
  });

  assertSagaCompensationCorrelation([trace([handle, compensate])], 'flow-b-42');
});

Deno.test('Flow-B saga validator diagnoses correlation divergence', () => {
  const handle = telemetrySpan('saga.handle', 'saga-handle', undefined, {
    'netscript.saga.id': 'flow-b-compensation',
    'netscript.correlation.id': 'wrong-correlation',
    'netscript.saga.correlation_key': 'flow-b-42',
  });
  const compensate = telemetrySpan('saga.cascade.compensate', 'saga-compensate', 'saga-handle', {
    'netscript.saga.id': 'flow-b-compensation',
    'netscript.correlation.id': 'flow-b-42',
    'netscript.saga.correlation_key': 'flow-b-42',
  });

  const error = assertThrows(
    () => assertSagaCompensationCorrelation([trace([handle, compensate])], 'flow-b-42'),
    Error,
    'saga.handle correlation equals callback fixture flow-b-42',
  );
  assertIncludesAll(error.message, ['TC-6/TC-7 FAIL', 'flow-b-42']);
});

Deno.test('Flow-B saga validator diagnoses a non-direct compensation edge', () => {
  const handle = telemetrySpan('saga.handle', 'saga-handle', undefined, {
    'netscript.saga.id': 'flow-b-compensation',
    'netscript.correlation.id': 'flow-b-42',
    'netscript.saga.correlation_key': 'flow-b-42',
  });
  const compensate = telemetrySpan('saga.cascade.compensate', 'saga-compensate', 'intermediate', {
    'netscript.saga.id': 'flow-b-compensation',
    'netscript.correlation.id': 'flow-b-42',
    'netscript.saga.correlation_key': 'flow-b-42',
  });

  const error = assertThrows(
    () => assertSagaCompensationCorrelation([trace([handle, compensate])], 'flow-b-42'),
    Error,
    'saga.handle -> saga.cascade.compensate is a direct parent edge',
  );
  assertIncludesAll(error.message, ['TC-9 FAIL', 'direct parent edge']);
});

function span(links: TelemetrySpan['links']): TelemetrySpan {
  return {
    traceId: 'consumer-trace',
    spanId: 'consumer-span',
    name: 'stream.subscribe',
    kind: 'consumer',
    startTimeUnixMs: 0,
    statusCode: 1,
    attributes: {},
    events: [],
    links,
  };
}

function link(traceId: string, spanId: string): TelemetrySpan['links'][number] {
  return { traceId, spanId, attributes: {} };
}

function trace(spans: readonly TelemetrySpan[]) {
  return {
    traceId: 'saga-trace',
    rootSpanId: spans[0]?.spanId ?? 'none',
    startTimeUnixMs: 0,
    durationMs: 1,
    spans,
  };
}

function telemetrySpan(
  name: string,
  spanId: string,
  parentSpanId: string | undefined,
  attributes: TelemetrySpan['attributes'],
): TelemetrySpan {
  return {
    traceId: 'saga-trace',
    spanId,
    parentSpanId,
    name,
    kind: 'internal',
    startTimeUnixMs: 0,
    statusCode: 1,
    attributes,
    events: [],
    links: [],
  };
}

function assertIncludesAll(actual: string, expected: readonly string[]): void {
  for (const value of expected) {
    if (!actual.includes(value)) throw new Error(`Expected diagnostic to include ${value}`);
  }
}
