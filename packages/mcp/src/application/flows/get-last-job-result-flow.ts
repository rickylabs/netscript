import type { TelemetryQueryPort } from '@netscript/telemetry/query';
import type { ToolFlow } from '../../domain/tool-types.ts';
import { aggregateLastJobResult } from '../telemetry-aggregation.ts';

const DEFAULT_WINDOW_MS = 15 * 60_000;

/** Create the most-recent completed job-result flow. */
export function createGetLastJobResultFlow(
  query: TelemetryQueryPort,
  now: () => number = Date.now,
): ToolFlow {
  return async (input) => {
    const values = input as Record<string, unknown>;
    const sinceUnixMs = numberValue(values.sinceUnixMs) ?? now() - DEFAULT_WINDOW_MS;
    const service = stringValue(values.service);
    const spans = await query.querySpans({
      sinceUnixMs,
      ...(service ? { serviceName: service } : {}),
      limit: 500,
    });
    return {
      ok: true,
      value: aggregateLastJobResult(
        spans.filter((span) => span.startTimeUnixMs >= sinceUnixMs),
        { jobId: stringValue(values.jobId), jobName: stringValue(values.jobName), service },
      ),
    };
  };
}
function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}
function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}
