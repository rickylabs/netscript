import { assertEquals } from '@std/assert';
import {
  createAspireMcpTelemetryQuery,
  findJobExecuteIdentity,
  readAspireTraceStructuredLogs,
} from '../../../src/application/gates/scaffold/aspire-dashboard-telemetry.ts';

Deno.test('Aspire telemetry adapter groups documented CLI spans by traceId', async () => {
  const mcpCalls: Array<{
    readonly name: string;
    readonly args: Readonly<Record<string, unknown>>;
  }> = [];
  const cliCalls: string[][] = [];
  const query = createAspireMcpTelemetryQuery(
    (name, args) => {
      mcpCalls.push({ name, args });
      return Promise.reject(new Error('trace reads must not use Aspire MCP'));
    },
    (args) => {
      cliCalls.push([...args]);
      if (args[1] === 'traces') {
        // Aspire 13.5.3 has no MCP span tool: trace summaries have no inline spans.
        return Promise.resolve([{
          traceId: '0123456789abcdef0123456789abcdef',
          timestamp: '2026-09-02T10:00:00Z',
        }]);
      }
      // Input fields are exactly the span field list documented in
      // .agents/skills/aspire/SKILL.md under "A request fails..." (13.5.3 evidence).
      return Promise.resolve([
        {
          traceId: '0123456789abcdef0123456789abcdef',
          spanId: 'fedcba9876543210',
          parentSpanId: '',
          kind: 'Producer',
          name: 'queue.enqueue',
          source: 'workers',
          status: 'Ok',
          statusMessage: '',
          durationMs: 2,
          attributes: {},
        },
        {
          traceId: '0123456789abcdef0123456789abcdef',
          spanId: '0123456789abcdef',
          parentSpanId: 'fedcba9876543210',
          kind: 'Internal',
          name: 'job.execute',
          source: 'workers',
          status: 'Ok',
          statusMessage: '',
          durationMs: 12.5,
          attributes: {
            'netscript.job.id': 'flow-b-callback',
            'netscript.correlation.id': 'flow-b-correlation',
          },
        },
      ]);
    },
    'https://localhost:18888',
  );

  const traces = await query.queryTraces({
    serviceName: 'workers',
    sinceUnixMs: Date.parse('2026-09-02T09:59:00Z'),
    limit: 10,
  });
  const trace = await query.getTrace('0123456789abcdef0123456789abcdef');

  assertEquals(mcpCalls, []);
  assertEquals(cliCalls, [
    [
      'otel',
      'traces',
      'workers',
      '--format',
      'Json',
      '--non-interactive',
      '--nologo',
      '--dashboard-url',
      'https://localhost:18888',
    ],
    [
      'otel',
      'spans',
      'workers',
      '--format',
      'Json',
      '--non-interactive',
      '--nologo',
      '--dashboard-url',
      'https://localhost:18888',
    ],
    [
      'otel',
      'spans',
      '--format',
      'Json',
      '--non-interactive',
      '--nologo',
      '--dashboard-url',
      'https://localhost:18888',
      '--trace-id',
      '0123456789abcdef0123456789abcdef',
    ],
  ]);
  assertEquals(traces, [{
    traceId: '0123456789abcdef0123456789abcdef',
    spans: [
      {
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: 'fedcba9876543210',
        parentSpanId: undefined,
        name: 'queue.enqueue',
        kind: 'producer',
        startTimeUnixMs: 0,
        endTimeUnixMs: 2,
        statusCode: 1,
        statusMessage: undefined,
        attributes: { 'service.name': 'workers' },
        events: [],
        links: [],
      },
      {
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: '0123456789abcdef',
        parentSpanId: 'fedcba9876543210',
        name: 'job.execute',
        kind: 'internal',
        startTimeUnixMs: 0,
        endTimeUnixMs: 12.5,
        statusCode: 1,
        statusMessage: undefined,
        attributes: {
          'netscript.job.id': 'flow-b-callback',
          'netscript.correlation.id': 'flow-b-correlation',
          'service.name': 'workers',
        },
        events: [],
        links: [],
      },
    ],
  }]);
  assertEquals(trace, traces[0]);
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
  const query = createAspireMcpTelemetryQuery(
    callTool,
    () => Promise.reject(new Error('log reads must not use Aspire CLI telemetry')),
    'https://localhost:18888',
  );

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
