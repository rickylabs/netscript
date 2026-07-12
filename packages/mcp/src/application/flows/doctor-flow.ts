import type { DoctorCheck, DoctorResult } from '../../domain/tool-contracts.ts';
import {
  countDoctorChecks,
  type DoctorCheckFamily,
  type DoctorFamilyResult,
  worstDoctorStatus,
} from '../../domain/doctor-check-family.ts';
import type { TelemetryProbePort } from '../../domain/telemetry-probe-port.ts';
import type { ToolExecutionResult, ToolFlow } from '../../domain/tool-types.ts';
import { isRecord } from '../../domain/schema.ts';
import type { TelemetryEndpointEnvironment } from '../../domain/telemetry-endpoint.ts';
import { createTelemetryDoctorFamily } from './telemetry-doctor-family.ts';

/** Create the S1 doctor flow for telemetry reachability. */
export function createDoctorFlow(
  probe: TelemetryProbePort,
  environment: TelemetryEndpointEnvironment = {},
  families: readonly DoctorCheckFamily[] = [],
  projectRoot = '.',
): ToolFlow {
  return async (input: unknown): Promise<ToolExecutionResult> => {
    const explicit = isRecord(input) && typeof input.endpoint === 'string'
      ? input.endpoint
      : undefined;
    const telemetry = createTelemetryDoctorFamily(probe, explicit, environment);
    const context = { projectRoot, explicitTelemetryEndpoint: explicit !== undefined };
    const results: DoctorFamilyResult[] = [];
    for (const family of [telemetry, ...families]) {
      let checks: readonly DoctorCheck[];
      try {
        checks = await family.check(context);
      } catch (error) {
        checks = [{
          name: `${family.name}_family`,
          status: 'fail',
          summary: error instanceof Error ? error.message : String(error),
          fix: `Resolve the ${family.name} diagnostic failure and run doctor again.`,
        }];
      }
      results.push({
        name: family.name,
        status: worstDoctorStatus(checks),
        counts: countDoctorChecks(checks),
        checks,
      });
    }
    const checks = results.flatMap((family) => family.checks);
    const status = worstDoctorStatus(checks);
    const value: DoctorResult = {
      status,
      endpoint: telemetry.endpoint,
      counts: countDoctorChecks(checks),
      checks,
      families: results,
    };
    return { ok: true, value };
  };
}
