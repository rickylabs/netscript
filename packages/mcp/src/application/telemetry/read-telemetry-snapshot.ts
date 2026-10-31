import type { TelemetryQueryPort } from '@netscript/telemetry/query';
import type { TelemetrySnapshotPort } from '../../ports/telemetry-snapshot-port.ts';
import {
  TELEMETRY_SAMPLE_LIMIT,
  TELEMETRY_TIMEOUT_MS,
  type TelemetryProvenance,
  type TelemetrySnapshot,
  type TelemetrySnapshotFailure,
  type TelemetrySnapshotRequest,
} from '../../domain/telemetry/telemetry-snapshot.ts';
import { MCP_PACKAGE_VERSION } from '../../publish-assets.generated.ts';
import {
  emptyTelemetryProvenance,
  telemetryUnavailable,
} from '../../domain/telemetry/telemetry-diagnostics.ts';
import type { ToolFailure } from '../../domain/tool-types.ts';

/** Preserve existing explicit query-port injection while production uses the bound snapshot port. */
export async function readTelemetrySnapshot(
  source: TelemetryQueryPort | TelemetrySnapshotPort,
  request: TelemetrySnapshotRequest,
): Promise<TelemetrySnapshot | TelemetrySnapshotFailure> {
  const signal = AbortSignal.timeout(TELEMETRY_TIMEOUT_MS);
  if ('readSnapshot' in source) return await source.readSnapshot(request, signal);
  // Explicitly supplied ports own transport and filtering; do not reinterpret their empty arrays
  // as proof about a discovered dashboard. The CLI never uses this compatibility path.
  const provenance = emptyTelemetryProvenance(request, MCP_PACKAGE_VERSION, 'injected_query');
  try {
    const filter = {
      sinceUnixMs: request.sinceUnixMs,
      ...(request.service ? { serviceName: request.service } : {}),
      limit: request.limit ?? TELEMETRY_SAMPLE_LIMIT,
    };
    const [spans, logs, resources] = await Promise.all([
      source.querySpans(filter),
      request.includeHealth ? source.queryLogs(filter) : Promise.resolve([]),
      request.includeHealth ? source.queryResources(filter) : Promise.resolve([]),
    ]);
    return {
      ok: true,
      spans,
      logs,
      resources,
      provenance: {
        ...provenance,
        state: spans.length || logs.length ? 'ready' : 'no_data',
        sampleCount: spans.length,
        logCount: request.includeHealth ? logs.length : null,
        returnedCount: spans.length,
      },
    };
  } catch {
    return telemetryUnavailable(provenance);
  }
}

/** Convert acquisition failure to the MCP error envelope without exposing transport details. */
export function telemetrySnapshotError(failure: TelemetrySnapshotFailure): ToolFailure {
  return {
    ok: false,
    error: { code: failure.code, message: failure.message, provenance: failure.provenance },
  };
}

/** Empty or incompletely covered samples carry no fabricated zero-latency statistics. */
export function telemetryEmptyResult(provenance: TelemetryProvenance): ToolFailure {
  const partial = provenance.state === 'partial';
  return {
    ok: false,
    error: {
      code: partial ? 'telemetry_partial' : 'telemetry_no_data',
      message: partial
        ? 'The capped dashboard snapshot does not cover this window. Narrow the service/window ' +
          'or inspect the dashboard Traces view; absence of samples is not a latency measurement.'
        : 'No matching telemetry samples exist in the acquired window. Generate a request, ' +
          'check telemetry export and the selected service, or widen sinceUnixMs, then retry.',
      provenance,
    },
  };
}
