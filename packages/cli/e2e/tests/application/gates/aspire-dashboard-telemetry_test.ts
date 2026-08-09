import { assertEquals } from '@std/assert';
import { createLiveAspireFetch } from '../../../src/application/gates/scaffold/aspire-dashboard-telemetry.ts';

Deno.test('live Aspire fetch normalizes trace and log OTLP envelopes', async () => {
  const liveFetch: typeof fetch = (input) => {
    const path = new URL(input instanceof Request ? input.url : input).pathname;
    if (path.endsWith('/traces')) {
      return Promise.resolve(Response.json({
        data: {
          resourceSpans: [{
            resource: {
              attributes: [{ key: 'service.name', value: { stringValue: 'users' } }],
            },
            scopeSpans: [{
              spans: [{ traceId: 'trace-a', spanId: 'span-a', name: 'GET /health' }],
            }],
          }],
        },
      }));
    }
    return Promise.resolve(Response.json({
      data: {
        resourceLogs: [{
          resource: {
            attributes: [{ key: 'service.name', value: { stringValue: 'users' } }],
          },
          scopeLogs: [{
            logRecords: [{
              timeUnixNano: '1000000',
              severityText: 'INFO',
              body: 'health request',
              traceId: 'trace-a',
            }],
          }],
        }],
      },
    }));
  };
  const aspireFetch = createLiveAspireFetch(liveFetch);

  const traces = await (
    await aspireFetch('https://localhost:1234/api/telemetry/traces')
  ).json();
  const logs = await (
    await aspireFetch('https://localhost:1234/api/telemetry/logs')
  ).json();

  assertEquals(traces.spans[0].traceId, 'trace-a');
  assertEquals(
    traces.spans[0].attributes.at(-1),
    { key: 'service.name', value: { stringValue: 'users' } },
  );
  assertEquals(logs.logs[0].traceId, 'trace-a');
  assertEquals(
    logs.logs[0].attributes.at(-1),
    { key: 'service.name', value: { stringValue: 'users' } },
  );
});
