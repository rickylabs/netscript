import type { TelemetryLog, TelemetryResource, TelemetrySpan } from '@netscript/telemetry/query';

/** Default lookback for bounded diagnostic snapshots. */
export const TELEMETRY_WINDOW_MS: number = 15 * 60_000;
/** Maximum records requested from each dashboard snapshot endpoint. */
export const TELEMETRY_SAMPLE_LIMIT = 1000;
/** One acquisition deadline covers discovery, authentication and telemetry reads. */
export const TELEMETRY_TIMEOUT_MS = 10_000;

/** Window and optional emitter selected by a diagnostic call. */
export interface TelemetrySnapshotRequest {
  /** Inclusive start of the requested window. */
  readonly sinceUnixMs: number;
  /** Inclusive end of the requested window. */
  readonly untilUnixMs: number;
  /** Optional service/resource name. */
  readonly service?: string;
  /** Optional per-kind snapshot cap, at most TELEMETRY_SAMPLE_LIMIT. */
  readonly limit?: number;
  /** Include logs and telemetry emitter resources for app status. */
  readonly includeHealth?: boolean;
}

/** Evidence accompanying both successful reads and failed acquisition. */
export interface TelemetryProvenance {
  /** Completeness of the acquired evidence. */
  readonly state: 'ready' | 'no_data' | 'partial' | 'unbound' | 'unavailable';
  /** Requested time interval; not a claim of complete backend retention. */
  readonly window: { readonly sinceUnixMs: number; readonly untilUnixMs: number };
  /** Selected spans, or null when acquisition failed. */
  readonly sampleCount: number | null;
  /** Selected logs, or null when not requested or acquisition failed. */
  readonly logCount: number | null;
  /** Version of the MCP package serving this response, not a service deployment SHA. */
  readonly servingRevision: string;
  /** Deployment revisions explicitly emitted in service.version, when available. */
  readonly serviceRevisions: readonly string[];
  /** Raw dashboard or explicitly injected query evidence. */
  readonly source: 'aspire_dashboard' | 'injected_query';
  /** Aspire's supported read API has no native metric or histogram endpoint. */
  readonly nativeMetrics: 'dashboard_only';
  /** Whether the backend returned only part of its matching population. */
  readonly sourceTruncated: boolean | null;
  /** Oldest/newest acquired span timestamps before local window filtering. */
  readonly observedRange: {
    readonly sinceUnixMs: number;
    readonly untilUnixMs: number;
  } | null;
  /** Backend matching count before the snapshot cap; null if unavailable. */
  readonly totalCount: number | null;
  /** Span count acquired before local window filtering; null if unavailable. */
  readonly returnedCount: number | null;
  /** Per-kind requested record bound. */
  readonly limit: number;
}

/** Successful telemetry acquisition, including a legitimately empty or partial snapshot. */
export interface TelemetrySnapshot {
  /** Acquisition discriminator. */
  readonly ok: true;
  /** Selected spans with resource attributes preserved. */
  readonly spans: readonly TelemetrySpan[];
  /** Selected logs with resource attributes preserved. */
  readonly logs: readonly TelemetryLog[];
  /** Telemetry emitters, not the runtime's declared resource graph. */
  readonly resources: readonly TelemetryResource[];
  /** Snapshot provenance. */
  readonly provenance: TelemetryProvenance;
}

/** Safe acquisition failure, without a binding URL, config value or raw error. */
export interface TelemetrySnapshotFailure {
  /** Acquisition discriminator. */
  readonly ok: false;
  /** Stable actionable diagnostic code. */
  readonly code: 'telemetry_unbound' | 'telemetry_unavailable' | 'telemetry_unknown_service';
  /** Fixed diagnostic text, never command output. */
  readonly message: string;
  /** Unknown counts remain null on failure. */
  readonly provenance: TelemetryProvenance;
}
