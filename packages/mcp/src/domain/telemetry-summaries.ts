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
