import type { TelemetryQueryPort } from '@netscript/telemetry/query';
import { summarizePluginHealth } from '@netscript/plugin/health';
import type { ProjectDoctorPort } from '../../domain/project-doctor-port.ts';
import type { DoctorCheck } from '../../domain/tool-contracts.ts';
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
      readRuntimeChecks(doctor, projectRoot),
    ]);
    const telemetry = aggregateAppStatus(resources, spans, logs);
    if (!doctor) return { ok: true, value: telemetry };
    const health = checks.flatMap((check) => check.runtimeHealth ? [check.runtimeHealth] : [])
      .filter((report) =>
        !service || report.pluginName === service || report.apiResources.includes(service) ||
        report.childResources.includes(service)
      );
    const runtimeChecks = checks.filter((check) =>
      !check.runtimeHealth && (check.status === 'fail' ||
        (doctor.readRuntimeHealth && check.status === 'warn'))
    )
      .sort((left, right) => Number(right.status === 'fail') - Number(left.status === 'fail'))
      .slice(0, 20);
    // No runtime declarations (including unwired hosts) must leave telemetry's verdict intact.
    if (health.length === 0 && runtimeChecks.length === 0) return { ok: true, value: telemetry };
    const healthStatus = summarizePluginHealth(health);
    return {
      ok: true,
      value: {
        ...telemetry,
        status: healthStatus === 'unhealthy' || healthStatus === 'degraded' ||
            runtimeChecks.some((check) => check.status === 'fail')
          ? 'fail'
          : (healthStatus === 'unknown' ||
              runtimeChecks.some((check) => check.status === 'warn')) &&
              telemetry.status === 'pass'
          ? 'warn'
          : telemetry.status,
        healthStatus,
        pluginHealth: health.slice(0, 20),
        ...(runtimeChecks.length > 0 ? { runtimeChecks } : {}),
      },
    };
  };
}

async function readRuntimeChecks(
  doctor: ProjectDoctorPort | undefined,
  projectRoot: string,
): Promise<readonly DoctorCheck[]> {
  if (!doctor) return [];
  try {
    return await (doctor.readRuntimeHealth
      ? doctor.readRuntimeHealth(projectRoot)
      : doctor.diagnose(projectRoot));
  } catch {
    // Runtime inspection is diagnostic evidence; its failure must not discard telemetry.
    return [{
      name: 'runtime-health',
      status: 'fail',
      summary: 'Runtime health inspection failed. Run plugin doctor for details.',
    }];
  }
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
