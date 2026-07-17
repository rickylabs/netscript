import type { TelemetryQueryPort } from '@netscript/telemetry/query';
import type { ToolFlow } from '../../domain/tool-types.ts';
import { aggregateAppStatus } from '../telemetry-aggregation.ts';

/** Create the NetScript-semantic application health flow. */
export function createGetAppStatusFlow(query: TelemetryQueryPort): ToolFlow {
  return async (input) => {
    const service = readString(input, 'service');
    const limit = readNumber(input, 'limit') ?? 100;
    const filter = { ...(service ? { serviceName: service } : {}), limit };
    const [resources, spans, logs] = await Promise.all([
      query.queryResources(service ? { serviceName: service } : undefined),
      query.querySpans(filter),
      query.queryLogs(filter),
    ]);
    return { ok: true, value: aggregateAppStatus(resources, spans, logs) };
  };
}
function readString(input: unknown, key: string): string | undefined {
  return input && typeof input === 'object' &&
      typeof (input as Record<string, unknown>)[key] === 'string'
    ? (input as Record<string, string>)[key]
    : undefined;
}
function readNumber(input: unknown, key: string): number | undefined {
  const value = input && typeof input === 'object'
    ? (input as Record<string, unknown>)[key]
    : undefined;
  return typeof value === 'number' ? value : undefined;
}
