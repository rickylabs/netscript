import type { TelemetrySnapshotPort } from '../../ports/telemetry-snapshot-port.ts';
import { TELEMETRY_WINDOW_MS } from '../../domain/telemetry/telemetry-snapshot.ts';
import {
  readTelemetrySnapshot,
  telemetryEmptyResult,
  telemetrySnapshotError,
} from '../telemetry/read-telemetry-snapshot.ts';
import type { TelemetryQueryPort } from '@netscript/telemetry/query';
import type { ToolFlow } from '../../domain/tool-types.ts';
import { aggregateDbBottlenecks } from '../telemetry-aggregation.ts';

/** Create the bounded DB/KV bottleneck analysis flow. */
export function createAnalyzeDbBottlenecksFlow(
  query: TelemetryQueryPort | TelemetrySnapshotPort,
  now: () => number = Date.now,
): ToolFlow {
  return async (input) => {
    const values = input as Record<string, unknown>;
    const untilUnixMs = now();
    const sinceUnixMs = typeof values.sinceUnixMs === 'number'
      ? values.sinceUnixMs
      : untilUnixMs - TELEMETRY_WINDOW_MS;
    const service = typeof values.service === 'string' ? values.service : undefined;
    const snapshot = await readTelemetrySnapshot(query, { sinceUnixMs, untilUnixMs, service });
    if (!snapshot.ok) return telemetrySnapshotError(snapshot);
    if (snapshot.spans.length === 0) return telemetryEmptyResult(snapshot.provenance);
    const spans = snapshot.spans;
    return {
      ok: true,
      value: {
        ...aggregateDbBottlenecks(spans, {
          sinceUnixMs,
          service,
          resourceSelected: snapshot.provenance.source === 'aspire_dashboard',
          limit: typeof values.limit === 'number' ? values.limit : undefined,
        }),
        provenance: snapshot.provenance,
      },
    };
  };
}
