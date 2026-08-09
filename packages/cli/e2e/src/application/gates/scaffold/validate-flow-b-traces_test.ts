import { assertThrows } from '@std/assert';
import type { TelemetrySpan } from '@netscript/telemetry/query';
import { assertConsumerLinksProducer } from './validate-flow-b-traces.ts';

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

function assertIncludesAll(actual: string, expected: readonly string[]): void {
  for (const value of expected) {
    if (!actual.includes(value)) throw new Error(`Expected diagnostic to include ${value}`);
  }
}
