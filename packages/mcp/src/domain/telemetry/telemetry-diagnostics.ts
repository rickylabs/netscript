import type {
  TelemetryProvenance,
  TelemetrySnapshotFailure,
  TelemetrySnapshotRequest,
} from './telemetry-snapshot.ts';
import { TELEMETRY_SAMPLE_LIMIT } from './telemetry-snapshot.ts';

/** Unknown acquisition counts must not be mistaken for measured zero. */
export function emptyTelemetryProvenance(
  request: TelemetrySnapshotRequest,
  servingRevision: string,
  source: TelemetryProvenance['source'] = 'aspire_dashboard',
): TelemetryProvenance {
  return {
    state: 'unavailable',
    window: { sinceUnixMs: request.sinceUnixMs, untilUnixMs: request.untilUnixMs },
    sampleCount: null,
    logCount: null,
    servingRevision,
    serviceRevisions: [],
    source,
    nativeMetrics: 'dashboard_only',
    sourceTruncated: null,
    observedRange: null,
    totalCount: null,
    returnedCount: null,
    limit: request.limit ?? TELEMETRY_SAMPLE_LIMIT,
  };
}

/** A fixed actionable failure message keeps credentials and configuration at the IO boundary. */
export function telemetryUnavailable(provenance: TelemetryProvenance): TelemetrySnapshotFailure {
  return {
    ok: false,
    code: 'telemetry_unavailable',
    message: 'Dashboard telemetry could not be read. Check the selected project/AppHost with ' +
      'aspire ps and aspire otel spans --apphost <apphost>; verify dashboard API authentication ' +
      'and trusted certificates, then retry. No performance measurements are available.',
    provenance: { ...provenance, state: 'unavailable' },
  };
}
