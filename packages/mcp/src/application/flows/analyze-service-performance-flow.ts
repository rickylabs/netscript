import type { TelemetryQueryPort } from '@netscript/telemetry/query';
import type { ToolFlow } from '../../domain/tool-types.ts';
import { aggregateServicePerformance } from '../telemetry-aggregation.ts';

const DEFAULT_WINDOW_MS = 15 * 60_000;

/** Create the bounded service-performance analysis flow. */
export function createAnalyzeServicePerformanceFlow(
  query: TelemetryQueryPort,
  now: () => number = Date.now,
): ToolFlow {
  return async (input) => {
    const values = input as Record<string, unknown>;
    const service = typeof values.service === 'string' ? values.service : '';
    const nowUnixMs = now();
    const sinceUnixMs = typeof values.sinceUnixMs === 'number'
      ? values.sinceUnixMs
      : nowUnixMs - DEFAULT_WINDOW_MS;
    const spans = await query.querySpans({ serviceName: service, sinceUnixMs, limit: 1000 });
    return {
      ok: true,
      value: aggregateServicePerformance(spans, {
        service,
        sinceUnixMs,
        nowUnixMs,
        limit: typeof values.limit === 'number' ? values.limit : undefined,
      }),
    };
  };
}
