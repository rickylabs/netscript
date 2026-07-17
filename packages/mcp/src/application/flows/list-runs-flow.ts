import type { TelemetryQueryPort } from '@netscript/telemetry/query';
import type { ToolFlow } from '../../domain/tool-types.ts';
import { aggregateRuns } from '../telemetry-aggregation.ts';

/** Create the bounded semantic run-list flow. */
export function createListRunsFlow(query: TelemetryQueryPort): ToolFlow {
  return async (input) => {
    const values = input as Record<string, unknown>;
    const filter = {
      domain: stringValue(values.domain),
      status: stringValue(values.status),
      service: stringValue(values.service),
      sinceUnixMs: numberValue(values.sinceUnixMs),
      limit: numberValue(values.limit),
    };
    const spans = await query.querySpans({
      ...(filter.service ? { serviceName: filter.service } : {}),
      ...(filter.sinceUnixMs !== undefined ? { sinceUnixMs: filter.sinceUnixMs } : {}),
      limit: 500,
    });
    const runs = aggregateRuns(spans, filter);
    return { ok: true, value: { count: runs.length, runs } };
  };
}
function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}
