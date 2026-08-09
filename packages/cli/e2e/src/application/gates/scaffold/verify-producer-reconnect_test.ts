import { assertEquals, assertThrows } from '@std/assert';
import type { TelemetryTrace } from '@netscript/telemetry/query';
import { StreamProducerMetricNames } from '@netscript/plugin-streams-core/telemetry';
import {
  assertProducerReconnectMetrics,
  assertProducerReconnectTrace,
  parseProducerReconnectResult,
} from './verify-producer-reconnect.ts';

const result = {
  traceId: '0123456789abcdef0123456789abcdef',
  streamPath: '/e2e/producer-reconnect/test',
  producerId: 'probe-producer',
  keys: ['one', 'two', 'three'],
  sinceUnixMs: 1_700_000_000_000,
} as const;

Deno.test('parseProducerReconnectResult accepts the probe marker only', () => {
  assertEquals(
    parseProducerReconnectResult(
      `noise\nNETSCRIPT_PRODUCER_RECONNECT_RESULT ${JSON.stringify(result)}\n`,
    ),
    result,
  );
});

Deno.test('assertProducerReconnectTrace requires one trace across every reconnect event', () => {
  const trace = reconnectTrace([
    'stream.producer.buffered',
    'stream.producer.retry',
    'stream.producer.recovered',
    'stream.producer.settled',
  ]);
  assertProducerReconnectTrace([trace], result);

  assertThrows(
    () => assertProducerReconnectTrace([reconnectTrace(['stream.producer.buffered'])], result),
    Error,
    'stream.producer.retry',
  );
});

Deno.test('assertProducerReconnectMetrics requires retry recovery and delivered receipts', () => {
  const metrics = [
    metricPayload(StreamProducerMetricNames.RETRIES, 1),
    metricPayload(StreamProducerMetricNames.RECOVERIES, 1),
    metricPayload(StreamProducerMetricNames.WRITES_DELIVERED, 3),
  ];
  assertProducerReconnectMetrics(metrics, result);

  assertThrows(
    () => assertProducerReconnectMetrics(metrics.slice(1), result),
    Error,
    StreamProducerMetricNames.RETRIES,
  );
});

function reconnectTrace(events: readonly string[]): TelemetryTrace {
  return {
    traceId: result.traceId,
    spans: [{
      traceId: result.traceId,
      spanId: '0123456789abcdef',
      name: 'stream.publish',
      kind: 'producer',
      startTimeUnixMs: result.sinceUnixMs,
      endTimeUnixMs: result.sinceUnixMs + 1,
      statusCode: 1,
      attributes: {
        'netscript.stream.producer.id': result.producerId,
        'netscript.outcome': 'delivered',
      },
      events: events.map((name) => ({
        name,
        timeUnixMs: result.sinceUnixMs,
        attributes: {},
      })),
      links: [],
    }],
  };
}

function metricPayload(name: string, value: number): unknown {
  return {
    resourceMetrics: [{
      scopeMetrics: [{
        metrics: [{
          name,
          sum: {
            dataPoints: [{
              asInt: String(value),
              attributes: [
                {
                  key: 'netscript.stream.producer.id',
                  value: { stringValue: result.producerId },
                },
                {
                  key: 'netscript.stream.path',
                  value: { stringValue: result.streamPath },
                },
              ],
            }],
          },
        }],
      }],
    }],
  };
}
