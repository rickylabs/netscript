import type { TelemetrySnapshotPort } from '../../ports/telemetry-snapshot-port.ts';
import { TELEMETRY_WINDOW_MS } from '../../domain/telemetry/telemetry-snapshot.ts';
import {
  readTelemetrySnapshot,
  telemetryEmptyResult,
  telemetrySnapshotError,
} from '../telemetry/read-telemetry-snapshot.ts';
import type { TelemetryQueryPort } from '@netscript/telemetry/query';
import type { ToolFlow } from '../../domain/tool-types.ts';
import { aggregateServicePerformance } from '../telemetry-aggregation.ts';

/** Create the bounded service-performance analysis flow. */
export function createAnalyzeServicePerformanceFlow(
  query: TelemetryQueryPort | TelemetrySnapshotPort,
  now: () => number = Date.now,
): ToolFlow {
  return async (input) => {
    const values = input as Record<string, unknown>;
    const service = typeof values.service === 'string' ? values.service : '';
    const nowUnixMs = now();
    const sinceUnixMs = typeof values.sinceUnixMs === 'number'
      ? values.sinceUnixMs
      : nowUnixMs - TELEMETRY_WINDOW_MS;
    const snapshot = await readTelemetrySnapshot(query, {
      service,
      sinceUnixMs,
      untilUnixMs: nowUnixMs,
    });
    if (!snapshot.ok) return telemetrySnapshotError(snapshot);
    if (snapshot.spans.length === 0) return telemetryEmptyResult(snapshot.provenance);
    const spans = snapshot.spans;
    const summary = aggregateServicePerformance(spans, {
      service,
      sinceUnixMs,
      nowUnixMs,
      resourceSelected: snapshot.provenance.source === 'aspire_dashboard',
      limit: typeof values.limit === 'number' ? values.limit : undefined,
    });
    if (summary.sampleCount === 0) {
      return {
        ok: false,
        error: {
          code: 'telemetry_no_completed_samples',
          message:
            'The snapshot contains no completed spans for this service. Generate a completed request or check the selected service; latency cannot be calculated yet.',
          provenance: snapshot.provenance,
        },
      };
    }
    return { ok: true, value: { ...summary, provenance: snapshot.provenance } };
  };
}
