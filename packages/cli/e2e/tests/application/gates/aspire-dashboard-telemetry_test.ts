import { assertEquals } from '@std/assert';
import {
  createAspireMcpTelemetryQuery,
  findJobExecuteIdentity,
  readAspireTraceStructuredLogs,
} from '../../../src/application/gates/scaffold/aspire-dashboard-telemetry.ts';

Deno.test('Aspire MCP telemetry adapter normalizes realistic list_traces output', async () => {
  const calls: Array<{
    readonly name: string;
    readonly args: Readonly<Record<string, unknown>>;
  }> = [];
  const query = createAspireMcpTelemetryQuery((name, args) => {
    calls.push({ name, args });
    return Promise.resolve({
      text: `Returned 1 trace.

# TRACES DATA

[{"traceId":"0123456789abcdef0123456789abcdef","durationMs":12.5,"title":"job.execute","spans":[{"traceId":"0123456789abcdef0123456789abcdef","spanId":"0123456789abcdef","kind":"Internal","name":"job.execute","status":"Ok","source":"workers","durationMs":12.5,"timestamp":"2026-09-02T10:00:00Z","attributes":{"netscript.job.id":"flow-b-callback","netscript.correlation.id":"flow-b-correlation"},"links":[]}],"hasError":false,"timestamp":"2026-09-02T10:00:00Z","dashboardUrl":"https://localhost:18888/traces/detail/0123456789abcdef0123456789abcdef"}]`,
      isError: false,
    });
  });

  const traces = await query.queryTraces({
    serviceName: 'workers',
    sinceUnixMs: Date.parse('2026-09-02T09:59:00Z'),
    limit: 10,
  });

  assertEquals(calls, [{ name: 'list_traces', args: { resourceName: 'workers' } }]);
  assertEquals(traces, [{
    traceId: '0123456789abcdef0123456789abcdef',
    spans: [{
      traceId: '0123456789abcdef0123456789abcdef',
      spanId: '0123456789abcdef',
      parentSpanId: undefined,
      name: 'job.execute',
      kind: 'internal',
      startTimeUnixMs: Date.parse('2026-09-02T10:00:00Z'),
      endTimeUnixMs: Date.parse('2026-09-02T10:00:00.012Z'),
      statusCode: 1,
      statusMessage: undefined,
      attributes: {
        'netscript.job.id': 'flow-b-callback',
        'netscript.correlation.id': 'flow-b-correlation',
        'service.name': 'workers',
      },
      events: [],
      links: [],
    }],
  }]);
  assertEquals(findJobExecuteIdentity(traces), {
    correlationId: 'flow-b-correlation',
    traceId: '0123456789abcdef0123456789abcdef',
  });
});

Deno.test('Aspire MCP telemetry adapter routes resource and trace-scoped structured logs', async () => {
  const calls: string[] = [];
  const callTool = (name: string, args: Readonly<Record<string, unknown>>) => {
    calls.push(`${name}:${JSON.stringify(args)}`);
    return Promise.resolve({
      text: `Returned 1 log entry.

# STRUCTURED LOGS DATA

[{"logId":42,"spanId":"0123456789abcdef","traceId":"0123456789abcdef0123456789abcdef","message":"job completed","severity":"Information","resourceName":"workers","attributes":{"netscript.correlation.id":"flow-b-correlation"},"source":"Microsoft.Extensions.Logging"}]`,
      isError: false,
    });
  };
  const query = createAspireMcpTelemetryQuery(callTool);

  const logs = await query.queryLogs({ serviceName: 'workers', limit: 10 });
  const traceLogs = await readAspireTraceStructuredLogs(
    callTool,
    '0123456789abcdef0123456789abcdef',
  );

  assertEquals(calls, [
    'list_structured_logs:{"resourceName":"workers"}',
    'list_trace_structured_logs:{"traceId":"0123456789abcdef0123456789abcdef"}',
  ]);
  assertEquals(logs[0], {
    timeUnixMs: 0,
    severity: 'Information',
    body: 'job completed',
    traceId: '0123456789abcdef0123456789abcdef',
    spanId: '0123456789abcdef',
    attributes: {
      'netscript.correlation.id': 'flow-b-correlation',
      'service.name': 'workers',
    },
  });
  assertEquals(traceLogs, [{
    logId: 42,
    spanId: '0123456789abcdef',
    traceId: '0123456789abcdef0123456789abcdef',
    message: 'job completed',
    severity: 'Information',
    resourceName: 'workers',
    attributes: {
      'netscript.correlation.id': 'flow-b-correlation',
      'service.name': 'workers',
    },
    source: 'Microsoft.Extensions.Logging',
    timeUnixMs: 0,
    body: 'job completed',
  }]);
});
