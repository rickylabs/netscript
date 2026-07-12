/** NetScript semantic telemetry domains exposed by monitoring tools. */
export type TelemetryDomain = 'service' | 'worker' | 'saga' | 'trigger' | 'stream';
/** Monitoring health severity. */
export type MonitoringStatus = 'pass' | 'warn' | 'fail';

/** Stable namespace prefixes used only to classify telemetry domains. */
export const DOMAIN_ATTRIBUTE_PREFIXES = {
  saga: ['netscript.saga.'],
  trigger: ['netscript.trigger.'],
  worker: ['netscript.worker.'],
  stream: ['netscript.stream.', 'netscript.sse.'],
  service: ['netscript.job.'],
} as const;

/** Per-domain activity rollup. */
export interface DomainStatusSummary {
  readonly domain: TelemetryDomain;
  readonly seenCount: number;
  readonly errorCount: number;
  readonly mostRecentActivityUnixMs?: number;
}
/** Compact application monitoring result. */
export interface AppStatusSummary {
  readonly status: MonitoringStatus;
  readonly counts: { readonly resources: number; readonly spans: number; readonly errors: number };
  readonly domains: readonly DomainStatusSummary[];
}
/** One semantic execution summary. */
export interface RunSummary {
  readonly id: string;
  readonly domain: TelemetryDomain;
  readonly name: string;
  readonly status: string;
  readonly outcome?: string;
  readonly startUnixMs: number;
  readonly durationMs?: number;
  readonly service: string;
  readonly traceId: string;
}
/** Bounded span-tree node. */
export interface SpanTreeNode {
  readonly name: string;
  readonly durationMs?: number;
  readonly status: string;
  readonly depth: number;
}
/** Bounded correlated log. */
export interface CorrelatedLogSummary {
  readonly timeUnixMs: number;
  readonly severity: string;
  readonly message: string;
}
/** Recent error group. */
export interface ErrorGroupSummary {
  readonly service: string;
  readonly domain: TelemetryDomain;
  readonly count: number;
  readonly firstSeenUnixMs: number;
  readonly lastSeenUnixMs: number;
  readonly sampleMessage: string;
  readonly relatedRunIds: readonly string[];
  readonly relatedTraceIds: readonly string[];
}

/** Most recent completed job execution. */
export interface LastJobResultSummary {
  readonly found: boolean;
  readonly jobName?: string;
  readonly jobId?: string;
  readonly status?: string;
  readonly outcome?: string;
  readonly exitCode?: number;
  readonly startUnixMs?: number;
  readonly completedUnixMs?: number;
  readonly durationMs?: number;
  readonly errorMessage?: string;
  readonly traceId?: string;
}

/** Duration rollup for one service operation. */
export interface OperationPerformanceSummary {
  readonly name: string;
  readonly count: number;
  readonly p95DurationMs: number;
}

/** Compact service performance rollup. */
export interface ServicePerformanceSummary {
  readonly service: string;
  readonly sinceUnixMs: number;
  readonly sampleCount: number;
  readonly errorCount: number;
  readonly errorRate: number;
  readonly averageDurationMs: number;
  readonly p50DurationMs: number;
  readonly p95DurationMs: number;
  readonly throughputPerMinute: number;
  readonly topOperations: readonly OperationPerformanceSummary[];
}

/** Ranked database or KV operation rollup. */
export interface DbOperationSummary {
  readonly operation: string;
  readonly count: number;
  readonly totalDurationMs: number;
  readonly p95DurationMs: number;
  readonly errorCount: number;
}

/** Compact database bottleneck analysis. */
export interface DbBottleneckSummary {
  readonly sinceUnixMs: number;
  readonly sampleCount: number;
  readonly operations: readonly DbOperationSummary[];
}
