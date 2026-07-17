import type { TelemetryQueryPort } from '@netscript/telemetry/query';
import type { ToolFlow } from '../../domain/tool-types.ts';
import { aggregateErrors } from '../telemetry-aggregation.ts';

/** Create the recent NetScript error-group flow. */
export function createGetRecentErrorsFlow(query: TelemetryQueryPort): ToolFlow {
  return async (input) => {
    const values = input as Record<string, unknown>;
    const service = typeof values.service === 'string' ? values.service : undefined;
    const sinceUnixMs = typeof values.sinceUnixMs === 'number' ? values.sinceUnixMs : undefined;
    const limit = typeof values.limit === 'number' ? values.limit : 20;
    const queryFilter = {
      ...(service ? { serviceName: service } : {}),
      ...(sinceUnixMs !== undefined ? { sinceUnixMs } : {}),
      limit: 500,
    };
    let groups = aggregateErrors(
      await query.querySpans(queryFilter),
      await query.queryLogs(queryFilter),
      limit,
    );
    if (typeof values.domain === 'string') {
      groups = groups.filter((group) => group.domain === values.domain);
    }
    return {
      ok: true,
      value: { count: groups.reduce((sum, group) => sum + group.count, 0), groups },
    };
  };
}
