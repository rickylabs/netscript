import {
  AspireTelemetryQuery,
  type TelemetryQueryPort,
  type TelemetryTrace,
} from '@netscript/telemetry/query';
import type { FlowBProducerIdentity } from './select-flow-b-stream-change.ts';
import { readAspireMcpEntryPoint } from './aspire-mcp/entry-point.ts';
import { createStdioAspireMcpTransport } from './aspire-mcp/stdio-transport.ts';
import { ASPIRE_MCP_DASHBOARD_TOOLS } from './aspire-mcp/tools.ts';

type AspireMcpTelemetryTool =
  | 'list_traces'
  | 'list_structured_logs'
  | 'list_trace_structured_logs';

export type AspireMcpTelemetryToolCaller = (
  name: AspireMcpTelemetryTool,
  args: Readonly<Record<string, unknown>>,
) => Promise<unknown>;

const MCP_ENDPOINT = 'http://aspire-mcp.invalid';

/** Create the suite telemetry port over Aspire's authenticated stdio MCP transport. */
export async function createLiveAspireTelemetryQuery(
  projectRoot: string,
): Promise<TelemetryQueryPort> {
  const entryPoint = await readAspireMcpEntryPoint(projectRoot);
  return createAspireMcpTelemetryQuery(async (name, args) => {
    const transport = createStdioAspireMcpTransport(entryPoint);
    try {
      await transport.initialize();
      return await transport.callTool(name, args);
    } finally {
      await transport.close().catch(() => undefined);
    }
  });
}

/** Adapt authenticated Aspire MCP telemetry tools to the package-owned query contract. */
export function createAspireMcpTelemetryQuery(
  callTool: AspireMcpTelemetryToolCaller,
): TelemetryQueryPort {
  return new AspireTelemetryQuery({
    endpoint: MCP_ENDPOINT,
    fetch: createLiveAspireFetch(callTool),
  });
}

/** Translate package query requests into Aspire MCP telemetry tool calls. */
export function createLiveAspireFetch(callTool: AspireMcpTelemetryToolCaller): typeof fetch {
  return async (input) => {
    try {
      const url = requestUrl(input);
      const path = url.pathname.replace('/api/telemetry/', '');
      if (path === 'traces') {
        const traces = await readToolItems(callTool, 'list_traces', traceArguments(url));
        return Response.json({ traces: filterTraces(traces, url) });
      }
      if (path.startsWith('traces/') && path !== 'traces/export') {
        const traceId = decodeURIComponent(path.slice('traces/'.length));
        const traces = await readToolItems(callTool, 'list_traces', { search: traceId });
        const trace = traces.map(normalizeMcpTrace).find((item) =>
          isRecord(item) && item.traceId === traceId
        );
        return Response.json({ data: trace });
      }
      if (path === 'spans') {
        const traces = await readToolItems(callTool, 'list_traces', traceArguments(url));
        const spans = filterTraces(traces, url).flatMap(mcpTraceSpans);
        return Response.json({ spans });
      }
      if (path === 'logs') {
        const logs = await readToolItems(callTool, 'list_structured_logs', traceArguments(url));
        return Response.json({ logs: filterLogs(logs, url) });
      }
      if (path === 'traces/export') return Response.json({ resourceSpans: [] });
      if (path === 'metrics') return Response.json({ metrics: [] });
      if (path === 'resources') return Response.json({ resources: [] });
      return new Response(null, { status: 404 });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 502 },
      );
    }
  };
}

/** Read trace-scoped structured logs through Aspire MCP. */
export async function readAspireTraceStructuredLogs(
  callTool: AspireMcpTelemetryToolCaller,
  traceId: string,
): Promise<readonly unknown[]> {
  return (await readToolItems(callTool, 'list_trace_structured_logs', { traceId }))
    .map(normalizeMcpLog);
}

/** Find the Flow-B callback execution identity in normalized telemetry traces. */
export function findJobExecuteIdentity(
  traces: readonly TelemetryTrace[],
): FlowBProducerIdentity | undefined {
  for (const span of traces.flatMap((trace) => trace.spans)) {
    const jobId = span.attributes['netscript.job.id'] ?? span.attributes['job.id'];
    const correlationId = span.attributes['netscript.correlation.id'];
    if (
      span.name === 'job.execute' && jobId === 'flow-b-callback' &&
      typeof correlationId === 'string'
    ) {
      return { correlationId, traceId: span.traceId };
    }
  }
  return undefined;
}

function requestUrl(input: RequestInfo | URL): URL {
  const value = input instanceof Request ? input.url : String(input);
  return new URL(value);
}

function traceArguments(url: URL): Readonly<Record<string, unknown>> {
  const resourceName = url.searchParams.get('resource');
  return resourceName ? { resourceName } : {};
}

async function readToolItems(
  callTool: AspireMcpTelemetryToolCaller,
  name: AspireMcpTelemetryTool,
  args: Readonly<Record<string, unknown>>,
): Promise<readonly unknown[]> {
  if (!ASPIRE_MCP_DASHBOARD_TOOLS.includes(name)) {
    throw new Error(`Aspire MCP telemetry tool is not declared: ${name}`);
  }
  const result = await callTool(name, args);
  if (Array.isArray(result)) return result;
  if (!isRecord(result)) throw new Error(`${name} returned a non-object result`);
  if (result.isError === true) throw new Error(`${name} returned an MCP error`);
  const items = result.items ?? result.entries;
  if (Array.isArray(items)) return items;
  if (typeof result.text !== 'string') throw new Error(`${name} omitted telemetry JSON`);
  const marker = name === 'list_traces' ? '# TRACES DATA' : '# STRUCTURED LOGS DATA';
  const markerIndex = result.text.indexOf(marker);
  if (markerIndex < 0) throw new Error(`${name} omitted ${marker}`);
  const parsed = parseJsonValue(result.text.slice(markerIndex + marker.length), '[');
  if (!Array.isArray(parsed)) throw new Error(`${name} telemetry JSON was not an array`);
  return parsed;
}

function filterTraces(items: readonly unknown[], url: URL): readonly unknown[] {
  let traces = items.map(normalizeMcpTrace);
  const since = parseDate(url.searchParams.get('since'));
  if (since !== undefined) traces = traces.filter((trace) => traceTimestamp(trace) >= since);
  return applyLimit(traces, url.searchParams.get('limit'));
}

function normalizeMcpTrace(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const { spans, ...trace } = value;
  return {
    ...trace,
    scopeSpans: [{ spans: Array.isArray(spans) ? spans.map(normalizeMcpSpan) : [] }],
  };
}

function normalizeMcpSpan(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const startTimeUnixMs = parseDate(value.timestamp);
  const durationMs = typeof value.durationMs === 'number' ? value.durationMs : undefined;
  const attributes = isRecord(value.attributes) ? { ...value.attributes } : {};
  if (typeof value.source === 'string' && attributes['service.name'] === undefined) {
    attributes['service.name'] = value.source;
  }
  return {
    ...value,
    startTimeUnixMs: value.timestamp,
    endTimeUnixMs: startTimeUnixMs !== undefined && durationMs !== undefined
      ? new Date(startTimeUnixMs + durationMs).toISOString()
      : undefined,
    statusCode: normalizeStatus(value.status),
    attributes,
  };
}

function filterLogs(items: readonly unknown[], url: URL): readonly unknown[] {
  let logs = items.map(normalizeMcpLog);
  const since = parseDate(url.searchParams.get('since'));
  if (since !== undefined) {
    logs = logs.filter((log) =>
      !isRecord(log) || typeof log.timeUnixMs !== 'number' || log.timeUnixMs === 0 ||
      log.timeUnixMs >= since
    );
  }
  return applyLimit(logs, url.searchParams.get('limit'));
}

function normalizeMcpLog(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const attributes = isRecord(value.attributes) ? { ...value.attributes } : {};
  if (typeof value.resourceName === 'string' && attributes['service.name'] === undefined) {
    attributes['service.name'] = value.resourceName;
  }
  return {
    ...value,
    timeUnixMs: parseDate(value.timestamp) ?? 0,
    body: value.message,
    attributes,
  };
}

function traceTimestamp(value: unknown): number {
  if (!isRecord(value)) return 0;
  const timestamp = parseDate(value.timestamp);
  if (timestamp !== undefined) return timestamp;
  const spanTimes = mcpTraceSpans(value).map((span) =>
    isRecord(span) ? parseDate(span.startTimeUnixMs) ?? 0 : 0
  );
  return spanTimes.length > 0 ? Math.min(...spanTimes) : 0;
}

function mcpTraceSpans(value: unknown): readonly unknown[] {
  if (!isRecord(value) || !Array.isArray(value.scopeSpans)) return [];
  return value.scopeSpans.flatMap((scope) =>
    isRecord(scope) && Array.isArray(scope.spans) ? scope.spans : []
  );
}

function applyLimit(items: readonly unknown[], value: string | null): readonly unknown[] {
  if (value === null) return items;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 0) return items;
  return limit === 0 ? [] : items.slice(-limit);
}

function normalizeStatus(value: unknown): number {
  if (typeof value !== 'string') return 0;
  if (value.toLowerCase() === 'ok') return 1;
  if (value.toLowerCase() === 'error') return 2;
  return 0;
}

function parseDate(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseJsonValue(text: string, opening: '{' | '['): unknown {
  const start = text.indexOf(opening);
  if (start < 0) throw new Error('MCP result omitted JSON evidence');
  const closing = opening === '{' ? '}' : ']';
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === opening) depth += 1;
    else if (character === closing) {
      depth -= 1;
      if (depth === 0) return JSON.parse(text.slice(start, index + 1));
    }
  }
  throw new Error('MCP JSON evidence is incomplete');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
