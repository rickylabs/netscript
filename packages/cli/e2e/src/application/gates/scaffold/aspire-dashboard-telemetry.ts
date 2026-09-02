import {
  AspireTelemetryQuery,
  type TelemetryQueryPort,
  type TelemetryTrace,
} from '@netscript/telemetry/query';
import { resolve } from '@std/path';
import type { FlowBProducerIdentity } from './select-flow-b-stream-change.ts';
import { readAspireMcpEntryPoint } from './aspire-mcp/entry-point.ts';
import { createStdioAspireMcpTransport } from './aspire-mcp/stdio-transport.ts';
import { ASPIRE_MCP_DASHBOARD_TOOLS } from './aspire-mcp/tools.ts';

type AspireMcpTelemetryTool = 'list_structured_logs' | 'list_trace_structured_logs';

export type AspireMcpTelemetryToolCaller = (
  name: AspireMcpTelemetryTool,
  args: Readonly<Record<string, unknown>>,
) => Promise<unknown>;

export type AspireCliTelemetryCommandRunner = (
  args: readonly string[],
) => Promise<unknown>;

const MCP_ENDPOINT = 'http://aspire-mcp.invalid';
const ASPIRE_JSON_ARGUMENTS = ['--format', 'Json', '--non-interactive', '--nologo'] as const;

/** Create the suite telemetry port over authenticated Aspire CLI and stdio MCP transports. */
export async function createLiveAspireTelemetryQuery(
  projectRoot: string,
): Promise<TelemetryQueryPort> {
  const entryPoint = await readAspireMcpEntryPoint(projectRoot);
  const runAspire = createAspireJsonCommandRunner(projectRoot);
  const dashboardUrl = selectDashboardUrl(
    await runAspire(['ps', ...ASPIRE_JSON_ARGUMENTS]),
    projectRoot,
  );
  const callTool: AspireMcpTelemetryToolCaller = async (name, args) => {
    const transport = createStdioAspireMcpTransport(entryPoint);
    try {
      await transport.initialize();
      return await transport.callTool(name, args);
    } finally {
      await transport.close().catch(() => undefined);
    }
  };
  return createAspireMcpTelemetryQuery(callTool, runAspire, dashboardUrl);
}

/** Adapt authenticated Aspire CLI spans and MCP logs to the package-owned query contract. */
export function createAspireMcpTelemetryQuery(
  callTool: AspireMcpTelemetryToolCaller,
  runAspire: AspireCliTelemetryCommandRunner,
  dashboardUrl: string,
): TelemetryQueryPort {
  return new AspireTelemetryQuery({
    endpoint: MCP_ENDPOINT,
    fetch: createLiveAspireFetch(callTool, runAspire, dashboardUrl),
  });
}

/** Translate package query requests into authenticated Aspire CLI and MCP calls. */
export function createLiveAspireFetch(
  callTool: AspireMcpTelemetryToolCaller,
  runAspire: AspireCliTelemetryCommandRunner,
  dashboardUrl: string,
): typeof fetch {
  return async (input) => {
    try {
      const url = requestUrl(input);
      const path = url.pathname.replace('/api/telemetry/', '');
      if (path === 'traces') {
        const [summaries, spans] = await Promise.all([
          readAspireTelemetryItems(runAspire, 'traces', dashboardUrl, url),
          readAspireTelemetryItems(runAspire, 'spans', dashboardUrl, url),
        ]);
        return Response.json({ traces: groupAspireCliSpans(summaries, spans, url) });
      }
      if (path.startsWith('traces/') && path !== 'traces/export') {
        const traceId = decodeURIComponent(path.slice('traces/'.length));
        const spans = await readAspireTelemetryItems(
          runAspire,
          'spans',
          dashboardUrl,
          url,
          traceId,
        );
        const trace = groupAspireCliSpans([{ traceId }], spans, url)[0];
        return Response.json({ data: trace });
      }
      if (path === 'spans') {
        const spans = await readAspireTelemetryItems(runAspire, 'spans', dashboardUrl, url);
        return Response.json({ spans: spans.map(normalizeAspireCliSpan) });
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
/**
 * Finds the Flow-B `job.execute` identity. The runtime suite drives the generic webhook more than
 * once (`behavior.triggers-webhook` before `behavior.otel.webhook`), so several
 * `flow-b-callback` executions coexist in the dashboard; when the gate's correlation fixture is
 * known, the execution carrying it wins over dashboard ordering.
 */
export function findJobExecuteIdentity(
  traces: readonly TelemetryTrace[],
  preferredCorrelationId?: string,
): FlowBProducerIdentity | undefined {
  let fallback: FlowBProducerIdentity | undefined;
  for (const span of traces.flatMap((trace) => trace.spans)) {
    const jobId = span.attributes['netscript.job.id'] ?? span.attributes['job.id'];
    const correlationId = span.attributes['netscript.correlation.id'];
    if (
      span.name === 'job.execute' && jobId === 'flow-b-callback' &&
      typeof correlationId === 'string'
    ) {
      if (correlationId === preferredCorrelationId) return { correlationId, traceId: span.traceId };
      fallback ??= { correlationId, traceId: span.traceId };
    }
  }
  return preferredCorrelationId === undefined ? fallback : undefined;
}

function requestUrl(input: RequestInfo | URL): URL {
  const value = input instanceof Request ? input.url : String(input);
  return new URL(value);
}

function traceArguments(url: URL): Readonly<Record<string, unknown>> {
  const resourceName = url.searchParams.get('resource');
  return resourceName ? { resourceName } : {};
}

function createAspireJsonCommandRunner(projectRoot: string): AspireCliTelemetryCommandRunner {
  return async (args) => {
    const output = await new Deno.Command('aspire', {
      args: [...args],
      cwd: projectRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stdout = new TextDecoder().decode(output.stdout).trim();
    const stderr = new TextDecoder().decode(output.stderr).trim();
    if (!output.success) {
      throw new Error(
        `aspire ${args.join(' ')} failed (${output.code}): ${stderr || stdout || '(no output)'}`,
      );
    }
    return parseJsonValue(stdout, stdout.includes('[') ? '[' : '{');
  };
}

function selectDashboardUrl(value: unknown, projectRoot: string): string {
  if (!Array.isArray(value)) throw new Error('aspire ps JSON was not an array');
  const expectedAppHost = resolve(projectRoot, 'aspire', 'apphost.mts');
  const selected = value.find((entry) =>
    isRecord(entry) && typeof entry.appHostPath === 'string' &&
    resolve(entry.appHostPath) === expectedAppHost
  );
  if (!isRecord(selected) || typeof selected.dashboardUrl !== 'string') {
    throw new Error(`aspire ps omitted the AppHost at ${expectedAppHost}`);
  }
  return selected.dashboardUrl;
}

async function readAspireTelemetryItems(
  runAspire: AspireCliTelemetryCommandRunner,
  kind: 'traces' | 'spans',
  dashboardUrl: string,
  url: URL,
  traceId?: string,
): Promise<readonly unknown[]> {
  const args: string[] = ['otel', kind];
  const resourceName = url.searchParams.get('resource');
  if (resourceName) args.push(resourceName);
  args.push(...ASPIRE_JSON_ARGUMENTS, '--dashboard-url', dashboardUrl);
  // The caller's `limit` has to reach the CLI, not only `applyLimit` afterwards. `aspire otel`
  // returns a bounded default tail, so a client-side slice can only ever narrow what the CLI
  // already truncated — a span emitted earlier in the run (a stream consumer's `stream.subscribe`,
  // for instance) never arrives to be sliced.
  const requested = requestedRowLimit(url);
  if (requested !== undefined) args.push('-n', String(requested));
  if (traceId) args.push('--trace-id', traceId);
  const value = await runAspire(args);
  if (!Array.isArray(value)) throw new Error(`aspire otel ${kind} JSON was not an array`);
  return value;
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
  const marker = '# STRUCTURED LOGS DATA';
  const markerIndex = result.text.indexOf(marker);
  if (markerIndex < 0) throw new Error(`${name} omitted ${marker}`);
  const parsed = parseJsonValue(result.text.slice(markerIndex + marker.length), '[');
  if (!Array.isArray(parsed)) throw new Error(`${name} telemetry JSON was not an array`);
  return parsed;
}

function normalizeAspireCliSpan(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const durationMs = typeof value.durationMs === 'number' ? value.durationMs : undefined;
  const attributes = isRecord(value.attributes) ? { ...value.attributes } : {};
  if (typeof value.source === 'string' && attributes['service.name'] === undefined) {
    attributes['service.name'] = value.source;
  }
  return {
    ...value,
    startTimeUnixMs: 0,
    endTimeUnixMs: durationMs,
    statusCode: normalizeStatus(value.status),
    attributes,
  };
}

function groupAspireCliSpans(
  summaries: readonly unknown[],
  spans: readonly unknown[],
  url: URL,
): readonly unknown[] {
  const since = parseDate(url.searchParams.get('since'));
  const summaryIds = summaries.filter((summary) => {
    const timestamp = isRecord(summary) ? parseDate(summary.timestamp) : undefined;
    return since === undefined || timestamp === undefined || timestamp >= since;
  }).flatMap((summary) =>
    isRecord(summary) && typeof summary.traceId === 'string' ? [summary.traceId] : []
  );
  const orderedSummaryIds = [...new Set(summaryIds)];
  // Only a trace the `since` filter explicitly dropped may exclude its spans. A trace that was
  // never summarised at all must NOT — a fan-in consumer emits `stream.subscribe` in its own
  // trace, linked to the producer's, and `aspire otel traces` need not list it. Filtering those
  // away deleted the consumer's telemetry entirely, which is what TC-14 observed as "no real
  // streams consumer span exists". The ordering below already anticipates orphan traces; this
  // filter is what made that branch unreachable.
  const summarisedIds = new Set(
    summaries.flatMap((summary) =>
      isRecord(summary) && typeof summary.traceId === 'string' ? [summary.traceId] : []
    ),
  );
  const allowedIds = new Set(orderedSummaryIds);
  const excludedBySince = new Set(
    [...summarisedIds].filter((traceId) => !allowedIds.has(traceId)),
  );
  const grouped = new Map<string, unknown[]>();
  for (const value of spans) {
    if (!isRecord(value) || typeof value.traceId !== 'string') continue;
    if (excludedBySince.has(value.traceId)) continue;
    const current = grouped.get(value.traceId) ?? [];
    current.push(normalizeAspireCliSpan(value));
    grouped.set(value.traceId, current);
  }
  const orderedIds = [
    ...orderedSummaryIds.filter((traceId) => grouped.has(traceId)),
    ...[...grouped.keys()].filter((traceId) => !allowedIds.has(traceId)),
  ];
  return applyLimit(
    orderedIds.map((traceId) => ({ traceId, scopeSpans: [{ spans: grouped.get(traceId) ?? [] }] })),
    url.searchParams.get('limit'),
  );
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

/**
 * Row count to request from `aspire otel`, so the CLI is asked for at least what the caller wants.
 *
 * Returns undefined for an absent or malformed limit, leaving the CLI default in place rather than
 * inventing a bound.
 */
function requestedRowLimit(url: URL): number | undefined {
  const raw = url.searchParams.get('limit');
  if (raw === null) return undefined;
  const limit = Number(raw);
  if (!Number.isInteger(limit) || limit <= 0) return undefined;
  return limit;
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
