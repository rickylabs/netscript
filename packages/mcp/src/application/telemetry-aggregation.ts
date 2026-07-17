import {
  KVAttributes,
  NetScriptExecutionAttributes,
  NetScriptJobAttributes,
  SagaAttributes,
  TriggerAttributes,
} from '@netscript/telemetry/attributes';
import type { TelemetryLog, TelemetryResource, TelemetrySpan } from '@netscript/telemetry/query';
import {
  type AppStatusSummary,
  type DbBottleneckSummary,
  type DbOperationSummary,
  DOMAIN_ATTRIBUTE_PREFIXES,
  type ErrorGroupSummary,
  type LastJobResultSummary,
  type OperationPerformanceSummary,
  type RunSummary,
  type ServicePerformanceSummary,
  type SpanTreeNode,
  type TelemetryDomain,
} from '../domain/telemetry-summaries.ts';

export const TELEMETRY_DOMAINS: readonly TelemetryDomain[] = [
  'service',
  'worker',
  'saga',
  'trigger',
  'stream',
];
export const DEFAULT_RESULT_LIMIT = 20;
export const MAX_SPAN_TREE_COUNT = 50;
export const MAX_SPAN_TREE_DEPTH = 8;
export const MAX_CORRELATED_LOGS = 20;
const SERVICE_NAME = 'service.name';
const OUTCOME = SagaAttributes.OUTCOME;
const OTEL_DB_ATTRIBUTE_PREFIX = 'db.';
const DB_STATEMENT = 'db.statement';
const DB_OPERATION = 'db.operation.name';
const MAX_ANALYSIS_RESULTS = 20;
const MAX_DB_LABEL_LENGTH = 120;

/** Classify a span or log by stable NetScript attribute namespace. */
export function classifyDomain(attributes: Readonly<Record<string, unknown>>): TelemetryDomain {
  const keys = Object.keys(attributes);
  for (const domain of ['saga', 'trigger', 'worker', 'stream'] as const) {
    if (
      keys.some((key) => DOMAIN_ATTRIBUTE_PREFIXES[domain].some((prefix) => key.startsWith(prefix)))
    ) {
      return domain;
    }
  }
  return 'service';
}

/** Select the canonical execution identity from span attributes. */
export function executionId(span: TelemetrySpan): string | undefined {
  for (
    const key of [
      NetScriptExecutionAttributes.EXECUTION_ID,
      NetScriptJobAttributes.JOB_ID,
      SagaAttributes.SAGA_INSTANCE_ID,
      TriggerAttributes.TRIGGER_ID,
    ]
  ) {
    const value = span.attributes[key];
    if (typeof value === 'string' && value) return value;
  }
  return undefined;
}

/** Aggregate resources, spans, and logs into application health. */
export function aggregateAppStatus(
  resources: readonly TelemetryResource[],
  spans: readonly TelemetrySpan[],
  logs: readonly TelemetryLog[],
): AppStatusSummary {
  const errorLogs = logs.filter(isErrorLog).length;
  const domains = TELEMETRY_DOMAINS.map((domain) => {
    const selected = spans.filter((span) => classifyDomain(span.attributes) === domain);
    return {
      domain,
      seenCount: selected.length,
      errorCount: selected.filter((span) => span.statusCode === 2).length,
      ...(selected.length
        ? { mostRecentActivityUnixMs: Math.max(...selected.map((span) => span.startTimeUnixMs)) }
        : {}),
    };
  });
  const errors = domains.reduce((sum, domain) => sum + domain.errorCount, errorLogs);
  return {
    status: errors > 0 ? 'fail' : resources.length === 0 || spans.length === 0 ? 'warn' : 'pass',
    counts: { resources: resources.length, spans: spans.length, errors },
    domains,
  };
}

/** Group execution spans into filtered, bounded run summaries. */
export function aggregateRuns(spans: readonly TelemetrySpan[], filter: {
  readonly domain?: string;
  readonly status?: string;
  readonly service?: string;
  readonly sinceUnixMs?: number;
  readonly limit?: number;
}): RunSummary[] {
  const byId = new Map<string, TelemetrySpan>();
  for (const span of spans) {
    const id = executionId(span);
    if (!id) continue;
    const prior = byId.get(id);
    if (!prior || span.startTimeUnixMs > prior.startTimeUnixMs) byId.set(id, span);
  }
  return [...byId.entries()].map(([id, span]) => toRun(id, span))
    .filter((run) => !filter.domain || run.domain === filter.domain)
    .filter((run) => !filter.status || run.status === filter.status)
    .filter((run) => !filter.service || run.service === filter.service)
    .filter((run) => filter.sinceUnixMs === undefined || run.startUnixMs >= filter.sinceUnixMs)
    .sort((a, b) => b.startUnixMs - a.startUnixMs)
    .slice(0, Math.min(filter.limit ?? DEFAULT_RESULT_LIMIT, 100));
}

/** Flatten a trace into a bounded deterministic tree summary. */
export function summarizeSpanTree(spans: readonly TelemetrySpan[]): SpanTreeNode[] {
  const children = new Map<string | undefined, TelemetrySpan[]>();
  for (const span of spans) {
    const key = span.parentSpanId && spans.some((candidate) =>
        candidate.spanId === span.parentSpanId
      )
      ? span.parentSpanId
      : undefined;
    children.set(key, [...(children.get(key) ?? []), span]);
  }
  const result: SpanTreeNode[] = [];
  const visited = new Set<string>();
  const visit = (span: TelemetrySpan, depth: number): void => {
    if (
      visited.has(span.spanId) || depth > MAX_SPAN_TREE_DEPTH ||
      result.length >= MAX_SPAN_TREE_COUNT
    ) return;
    visited.add(span.spanId);
    result.push({ name: span.name, durationMs: duration(span), status: spanStatus(span), depth });
    for (const child of sorted(children.get(span.spanId) ?? [])) visit(child, depth + 1);
  };
  for (const root of sorted(children.get(undefined) ?? [])) visit(root, 0);
  return result;
}

/** Group error spans and error-severity logs by service and domain. */
export function aggregateErrors(
  spans: readonly TelemetrySpan[],
  logs: readonly TelemetryLog[],
  limit = 20,
): ErrorGroupSummary[] {
  type Mutable = {
    service: string;
    domain: TelemetryDomain;
    times: number[];
    messages: string[];
    runs: Set<string>;
    traces: Set<string>;
  };
  const groups = new Map<string, Mutable>();
  const add = (
    service: string,
    domain: TelemetryDomain,
    time: number,
    message: string,
    run: string | undefined,
    trace: string | undefined,
  ): void => {
    const key = `${service}\0${domain}`;
    const group = groups.get(key) ??
      { service, domain, times: [], messages: [], runs: new Set(), traces: new Set() };
    group.times.push(time);
    group.messages.push(message);
    if (run) group.runs.add(run);
    if (trace) group.traces.add(trace);
    groups.set(key, group);
  };
  for (const span of spans.filter((value) => value.statusCode === 2)) {
    add(
      serviceOf(span.attributes),
      classifyDomain(span.attributes),
      span.startTimeUnixMs,
      span.statusMessage ?? span.name,
      executionId(span),
      span.traceId,
    );
  }
  for (const log of logs.filter(isErrorLog)) {
    add(
      serviceOf(log.attributes),
      classifyDomain(log.attributes),
      log.timeUnixMs,
      log.body,
      undefined,
      log.traceId,
    );
  }
  return [...groups.values()].map((group) => ({
    service: group.service,
    domain: group.domain,
    count: group.times.length,
    firstSeenUnixMs: Math.min(...group.times),
    lastSeenUnixMs: Math.max(...group.times),
    sampleMessage: group.messages[0] ?? 'Error',
    relatedRunIds: [...group.runs].slice(0, 5),
    relatedTraceIds: [...group.traces].slice(0, 5),
  })).sort((a, b) => b.lastSeenUnixMs - a.lastSeenUnixMs).slice(0, Math.min(limit, 20));
}

export function isErrorLog(log: TelemetryLog): boolean {
  return /error|fatal/i.test(log.severity);
}
export function serviceOf(attributes: Readonly<Record<string, unknown>>): string {
  const value = attributes[SERVICE_NAME];
  return typeof value === 'string' ? value : 'unknown';
}
export function correlatedLogs(logs: readonly TelemetryLog[], traceId: string): TelemetryLog[] {
  return logs.filter((log) => log.traceId === traceId).sort((a, b) => a.timeUnixMs - b.timeUnixMs)
    .slice(0, MAX_CORRELATED_LOGS);
}

/** Select the newest completed job matching optional identity filters. */
export function aggregateLastJobResult(
  spans: readonly TelemetrySpan[],
  filter: { readonly jobId?: string; readonly jobName?: string; readonly service?: string } = {},
): LastJobResultSummary {
  const selected = spans.filter((span) => span.endTimeUnixMs !== undefined)
    .filter((span) => attributeString(span, NetScriptJobAttributes.JOB_ID) !== undefined)
    .filter((span) =>
      !filter.jobId || attributeString(span, NetScriptJobAttributes.JOB_ID) === filter.jobId
    )
    .filter((span) =>
      !filter.jobName || attributeString(span, NetScriptJobAttributes.JOB_NAME) === filter.jobName
    )
    .filter((span) => !filter.service || serviceOf(span.attributes) === filter.service)
    .sort((a, b) =>
      (b.endTimeUnixMs ?? 0) - (a.endTimeUnixMs ?? 0) ||
      b.startTimeUnixMs - a.startTimeUnixMs
    )[0];
  if (!selected) return { found: false };
  const exitCode = selected.attributes[NetScriptJobAttributes.JOB_EXIT_CODE];
  const outcome = selected.attributes[OUTCOME];
  return {
    found: true,
    jobName: attributeString(selected, NetScriptJobAttributes.JOB_NAME) ?? selected.name,
    jobId: attributeString(selected, NetScriptJobAttributes.JOB_ID),
    status: attributeString(selected, NetScriptJobAttributes.JOB_STATUS) ?? spanStatus(selected),
    ...(typeof outcome === 'string' ? { outcome } : {}),
    ...(typeof exitCode === 'number' ? { exitCode } : {}),
    startUnixMs: selected.startTimeUnixMs,
    completedUnixMs: selected.endTimeUnixMs,
    durationMs: duration(selected),
    ...(selected.statusMessage ? { errorMessage: selected.statusMessage } : {}),
    traceId: selected.traceId,
  };
}

/** Aggregate completed service spans using interpolation-free nearest-rank percentiles. */
export function aggregateServicePerformance(
  spans: readonly TelemetrySpan[],
  options: {
    readonly service: string;
    readonly sinceUnixMs: number;
    readonly nowUnixMs: number;
    readonly limit?: number;
  },
): ServicePerformanceSummary {
  const selected = completedDurations(
    spans.filter((span) =>
      serviceOf(span.attributes) === options.service && span.startTimeUnixMs >= options.sinceUnixMs
    ),
  );
  const values = selected.map((item) => item.durationMs);
  const topOperations: OperationPerformanceSummary[] = [...groupDurations(selected).entries()].map(
    ([name, durations]) => ({
      name,
      count: durations.length,
      p95DurationMs: nearestRank(durations, 0.95),
    }),
  ).sort((a, b) =>
    b.p95DurationMs - a.p95DurationMs || b.count - a.count || a.name.localeCompare(b.name)
  )
    .slice(0, boundedLimit(options.limit));
  const errorCount = selected.filter((item) => item.span.statusCode === 2).length;
  const windowMinutes = Math.max(1, options.nowUnixMs - options.sinceUnixMs) / 60_000;
  return {
    service: options.service,
    sinceUnixMs: options.sinceUnixMs,
    sampleCount: selected.length,
    errorCount,
    errorRate: selected.length ? errorCount / selected.length : 0,
    averageDurationMs: values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0,
    p50DurationMs: nearestRank(values, 0.5),
    p95DurationMs: nearestRank(values, 0.95),
    throughputPerMinute: selected.length / windowMinutes,
    topOperations,
  };
}

/** Rank OTel `db.` semantic-convention and NetScript KV operations by total time then p95. */
export function aggregateDbBottlenecks(
  spans: readonly TelemetrySpan[],
  options: { readonly sinceUnixMs: number; readonly service?: string; readonly limit?: number },
): DbBottleneckSummary {
  const selected = completedDurations(
    spans.filter((span) => span.startTimeUnixMs >= options.sinceUnixMs)
      .filter((span) => !options.service || serviceOf(span.attributes) === options.service)
      .filter(isDbSpan),
  );
  const groups = new Map<string, Array<{ span: TelemetrySpan; durationMs: number }>>();
  for (const item of selected) {
    groups.set(dbLabel(item.span), [...(groups.get(dbLabel(item.span)) ?? []), item]);
  }
  const operations: DbOperationSummary[] = [...groups.entries()].map(([operation, items]) => ({
    operation,
    count: items.length,
    totalDurationMs: items.reduce((sum, item) => sum + item.durationMs, 0),
    p95DurationMs: nearestRank(items.map((item) => item.durationMs), 0.95),
    errorCount: items.filter((item) => item.span.statusCode === 2).length,
  })).sort((a, b) =>
    b.totalDurationMs - a.totalDurationMs || b.p95DurationMs - a.p95DurationMs ||
    a.operation.localeCompare(b.operation)
  )
    .slice(0, boundedLimit(options.limit));
  return { sinceUnixMs: options.sinceUnixMs, sampleCount: selected.length, operations };
}

function completedDurations(
  spans: readonly TelemetrySpan[],
): Array<{ span: TelemetrySpan; durationMs: number }> {
  return spans.flatMap((span) => {
    const value = duration(span);
    return value === undefined ? [] : [{ span, durationMs: value }];
  });
}
function groupDurations(
  items: readonly { span: TelemetrySpan; durationMs: number }[],
): Map<string, number[]> {
  const groups = new Map<string, number[]>();
  for (const item of items) {
    groups.set(item.span.name, [...(groups.get(item.span.name) ?? []), item.durationMs]);
  }
  return groups;
}
function nearestRank(values: readonly number[], percentile: number): number {
  if (!values.length) return 0;
  const sortedValues = [...values].sort((a, b) => a - b);
  return sortedValues[Math.max(0, Math.ceil(percentile * sortedValues.length) - 1)] ?? 0;
}
function isDbSpan(span: TelemetrySpan): boolean {
  return Object.keys(span.attributes).some((key) =>
    key.startsWith('netscript.kv.') || key.startsWith(OTEL_DB_ATTRIBUTE_PREFIX)
  );
}
function dbLabel(span: TelemetrySpan): string {
  const kv = span.attributes[KVAttributes.KV_OPERATION];
  const dbOperation = span.attributes[DB_OPERATION];
  const statement = span.attributes[DB_STATEMENT];
  const raw = typeof kv === 'string'
    ? kv
    : typeof dbOperation === 'string'
    ? dbOperation
    : typeof statement === 'string'
    ? statement
    : span.name;
  const normalized = raw.replace(/\s+/g, ' ').trim();
  return normalized.length <= MAX_DB_LABEL_LENGTH
    ? normalized
    : `${normalized.slice(0, MAX_DB_LABEL_LENGTH - 1)}…`;
}
function attributeString(span: TelemetrySpan, key: string): string | undefined {
  const value = span.attributes[key];
  return typeof value === 'string' && value ? value : undefined;
}
function boundedLimit(limit: number | undefined): number {
  return Math.min(Math.max(1, limit ?? 5), MAX_ANALYSIS_RESULTS);
}
function toRun(id: string, span: TelemetrySpan): RunSummary {
  const statusValue = span.attributes[NetScriptJobAttributes.JOB_STATUS];
  const outcome = span.attributes[OUTCOME];
  return {
    id,
    domain: classifyDomain(span.attributes),
    name: String(span.attributes[NetScriptJobAttributes.JOB_NAME] ?? span.name),
    status: typeof statusValue === 'string' ? statusValue : spanStatus(span),
    ...(typeof outcome === 'string' ? { outcome } : {}),
    startUnixMs: span.startTimeUnixMs,
    durationMs: duration(span),
    service: serviceOf(span.attributes),
    traceId: span.traceId,
  };
}
function spanStatus(span: TelemetrySpan): string {
  return span.statusCode === 2 ? 'error' : span.statusCode === 1 ? 'ok' : 'unset';
}
function duration(span: TelemetrySpan): number | undefined {
  return span.endTimeUnixMs === undefined
    ? undefined
    : Math.max(0, span.endTimeUnixMs - span.startTimeUnixMs);
}
function sorted(spans: readonly TelemetrySpan[]): TelemetrySpan[] {
  return [...spans].sort((a, b) =>
    a.startTimeUnixMs - b.startTimeUnixMs || a.spanId.localeCompare(b.spanId)
  );
}
