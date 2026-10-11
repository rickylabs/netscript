import type { TelemetryQueryPort } from '@netscript/telemetry/query';
import type { ProjectDoctorPort } from '../../domain/project-doctor-port.ts';
import type { ToolFlow } from '../../domain/tool-types.ts';
import { aggregateAppStatus } from '../telemetry-aggregation.ts';

/** Create the NetScript-semantic application health flow. */
export function createGetAppStatusFlow(
  query: TelemetryQueryPort,
  doctor?: ProjectDoctorPort,
  projectRoot = '.',
): ToolFlow {
  return async (input) => {
    const service = readString(input, 'service');
    const limit = readNumber(input, 'limit') ?? 100;
    const filter = { ...(service ? { serviceName: service } : {}), limit };
    const [resources, spans, logs, checks] = await Promise.all([
      query.queryResources(service ? { serviceName: service } : undefined),
      query.querySpans(filter),
      query.queryLogs(filter),
      doctor?.readRuntimeHealth
        ? doctor.readRuntimeHealth(projectRoot)
        : doctor?.diagnose(projectRoot),
    ]);
    const telemetry = aggregateAppStatus(resources, spans, logs);
    if (!doctor) return { ok: true, value: telemetry };
    const health = (checks ?? []).flatMap((check) =>
      check.runtimeHealth ? [check.runtimeHealth] : []
    )
      .filter((report) =>
        !service || report.pluginName === service || report.apiResources.includes(service) ||
        report.childResources.includes(service)
      );
    const healthStatus = health.some((report) => report.status === 'unhealthy')
      ? 'unhealthy'
      : health.some((report) => report.status === 'degraded')
      ? 'degraded'
      : health.length === 0 || health.some((report) => report.status === 'unknown')
      ? 'unknown'
      : 'healthy';
    return {
      ok: true,
      value: {
        ...telemetry,
        status: healthStatus === 'unhealthy' || healthStatus === 'degraded' ||
            (!service && checks?.some((check) => check.status === 'fail'))
          ? 'fail'
          : healthStatus === 'unknown' && telemetry.status === 'pass'
          ? 'warn'
          : telemetry.status,
        healthStatus,
        pluginHealth: health.slice(0, 20),
      },
    };
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
