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

const MAX_FAMILY_CHECKS = 20;

function boundFamilyChecks(
  family: DoctorFamilyResult['name'],
  checks: readonly DoctorCheck[],
): readonly DoctorCheck[] {
  if (checks.length <= MAX_FAMILY_CHECKS) {
    return checks;
  }

  const retainedCount = MAX_FAMILY_CHECKS - 1;
  const omitted = checks.slice(retainedCount);
  const omittedStatus = worstDoctorStatus(omitted);
  return [
    ...checks.slice(0, retainedCount),
    {
      name: `${family}_additional_checks`,
      status: omittedStatus,
      summary:
        `${omitted.length} additional ${family} checks omitted; family counts and status include all checks.`,
      ...(omittedStatus === 'pass' ? {} : {
        fix: `Resolve the omitted ${family} warnings or failures and run doctor again.`,
      }),
    },
  ];
}

function summarizeFamily(result: DoctorFamilyResult): DoctorCheck {
  const { pass, warn, fail } = result.counts;
  return {
    name: `${result.name}_summary`,
    status: result.status,
    summary: `${pass} passed, ${warn} warned, ${fail} failed.`,
    ...(result.status === 'pass' ? {} : {
      fix: `Review the ${result.name} family details and run doctor again.`,
    }),
  };
}

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
      const counts = countDoctorChecks(checks);
      results.push({
        name: family.name,
        status: worstDoctorStatus(checks),
        counts,
        checks: boundFamilyChecks(family.name, checks),
      });
    }
    const checks = results.map(summarizeFamily);
    const allCounts = results.reduce(
      (counts, family) => ({
        pass: counts.pass + family.counts.pass,
        warn: counts.warn + family.counts.warn,
        fail: counts.fail + family.counts.fail,
      }),
      { pass: 0, warn: 0, fail: 0 },
    );
    const status = worstDoctorStatus(checks);
    const value: DoctorResult = {
      status,
      endpoint: telemetry.endpoint,
      counts: allCounts,
      checks,
      families: results,
    };
    return { ok: true, value };
  };
}
