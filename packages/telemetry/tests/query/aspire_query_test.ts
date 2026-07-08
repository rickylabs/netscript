import { assertEquals, assertInstanceOf, assertThrows } from '@std/assert';
import {
  AspireTelemetryQuery,
  createTelemetryQuery,
  TelemetryQueryValidationError,
  validateTraceQueryFilter,
} from '../../query.ts';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
  });
}

Deno.test('createTelemetryQuery returns the Aspire query adapter', () => {
  assertInstanceOf(createTelemetryQuery(), AspireTelemetryQuery);
});

Deno.test('trace query filter schema rejects malformed limits', () => {
  assertThrows(
    () => {
      validateTraceQueryFilter({ limit: 0 });
    },
    TelemetryQueryValidationError,
    'limit must be a positive integer',
  );
});

Deno.test('AspireTelemetryQuery groups flat Aspire spans by trace id', async () => {
  const seenUrls: string[] = [];
  const seenKeys: string[] = [];
  const fakeFetch: typeof fetch = (input, init) => {
    const url = new URL(String(input));
    seenUrls.push(url.toString());
    const headers = new Headers(init?.headers);
    seenKeys.push(headers.get('x-api-key') ?? '');
    return Promise.resolve(jsonResponse({
      spans: [
        {
          traceId: 'trace-a',
          spanId: 'span-2',
          parentSpanId: 'span-1',
          name: 'worker.process',
          kind: 'SPAN_KIND_CONSUMER',
          startTimeUnixNano: '2000000000',
          endTimeUnixNano: '2500000000',
          status: { code: 'OK' },
          attributes: {
            'netscript.correlation.id': 'corr-1',
            'messaging.message.id': 'msg-1',
          },
          events: [
            {
              name: 'completed',
              timeUnixNano: '2400000000',
              attributes: { 'netscript.outcome': 'ok' },
            },
          ],
          links: [
            {
              traceId: 'trace-upstream',
              spanId: 'span-upstream',
              attributes: { 'messaging.message.id': 'msg-upstream' },
            },
          ],
        },
        {
          traceId: 'trace-a',
          spanId: 'span-1',
          name: 'queue.dequeue',
          kind: 4,
          startTimeUnixNano: '1000000000',
          statusCode: 1,
          attributes: { 'messaging.operation.name': 'dequeue' },
        },
      ],
    }));
  };

  const query = new AspireTelemetryQuery({
    endpoint: 'http://aspire.local/',
    apiKey: 'secret',
    fetch: fakeFetch,
  });

  const traces = await query.queryTraces({
    resource: 'workers',
    limit: 20,
    follow: true,
  });

  assertEquals(traces.length, 1);
  assertEquals(traces[0]?.traceId, 'trace-a');
  assertEquals(traces[0]?.spans.map((span) => span.spanId), ['span-1', 'span-2']);
  assertEquals(traces[0]?.spans[1]?.kind, 'consumer');
  assertEquals(traces[0]?.spans[1]?.events[0]?.name, 'completed');
  assertEquals(traces[0]?.spans[1]?.links[0]?.attributes['messaging.message.id'], 'msg-upstream');
  assertEquals(seenKeys, ['secret']);
  assertEquals(
    seenUrls[0],
    'http://aspire.local/api/telemetry/traces?resource=workers&limit=20&follow=true',
  );
});

Deno.test('AspireTelemetryQuery reads logs, resources, and metrics', async () => {
  const fakeFetch: typeof fetch = (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/logs')) {
      return Promise.resolve(jsonResponse({
        logs: [{
          timestamp: '2026-07-08T10:00:00.000Z',
          severityText: 'INFO',
          body: 'worker completed',
          traceId: 'trace-a',
          spanId: 'span-1',
          attributes: { 'netscript.outcome': 'ok' },
        }],
      }));
    }
    if (url.pathname.endsWith('/resources')) {
      return Promise.resolve(jsonResponse({
        resources: [{
          attributes: {
            'service.name': 'workers',
            'service.instance.id': 'workers-1',
          },
        }],
      }));
    }
    return Promise.resolve(jsonResponse({
      metrics: [{
        name: 'worker.process.duration',
        type: 'histogram',
        unit: 'ms',
        points: [{
          timeUnixMs: 1,
          value: 42,
          attributes: { 'netscript.worker.id': 'workers' },
        }],
      }],
    }));
  };

  const query = new AspireTelemetryQuery({ fetch: fakeFetch });

  const logs = await query.queryLogs({ serviceName: 'workers' });
  const resources = await query.queryResources();
  const metrics = await query.queryMetrics({ metricName: 'worker.process.duration' });

  assertEquals(logs[0]?.body, 'worker completed');
  assertEquals(resources[0]?.serviceName, 'workers');
  assertEquals(resources[0]?.serviceInstanceId, 'workers-1');
  assertEquals(metrics[0]?.type, 'histogram');
  assertEquals(metrics[0]?.points[0]?.value, 42);
});

Deno.test('AspireTelemetryQuery degrades to empty results when Aspire is absent', async () => {
  const fakeFetch: typeof fetch = () => Promise.reject(new TypeError('connection refused'));
  const query = new AspireTelemetryQuery({ fetch: fakeFetch });

  assertEquals(await query.queryTraces(), []);
  assertEquals(await query.getTrace('missing'), undefined);
  assertEquals(await query.querySpans(), []);
  assertEquals(await query.queryLogs(), []);
  assertEquals(await query.queryMetrics(), []);
  assertEquals(await query.queryResources(), []);
  assertEquals(await query.exportTraces(), { resourceSpans: [] });
});
