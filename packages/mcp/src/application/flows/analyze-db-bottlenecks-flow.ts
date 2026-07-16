import type { TelemetryQueryPort } from '@netscript/telemetry/query';
import type { ToolFlow } from '../../domain/tool-types.ts';
import { aggregateDbBottlenecks } from '../telemetry-aggregation.ts';

const DEFAULT_WINDOW_MS = 15 * 60_000;

/** Create the bounded DB/KV bottleneck analysis flow. */
export function createAnalyzeDbBottlenecksFlow(
  query: TelemetryQueryPort,
  now: () => number = Date.now,
): ToolFlow {
  return async (input) => {
    const values = input as Record<string, unknown>;
    const sinceUnixMs = typeof values.sinceUnixMs === 'number'
      ? values.sinceUnixMs
      : now() - DEFAULT_WINDOW_MS;
    const service = typeof values.service === 'string' ? values.service : undefined;
    const spans = await query.querySpans({
      sinceUnixMs,
      ...(service ? { serviceName: service } : {}),
      limit: 1000,
    });
    return {
      ok: true,
      value: aggregateDbBottlenecks(spans, {
        sinceUnixMs,
        service,
        limit: typeof values.limit === 'number' ? values.limit : undefined,
      }),
    };
  };
}
