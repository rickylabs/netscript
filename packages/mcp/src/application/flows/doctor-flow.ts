import type { DoctorCheck, DoctorResult, DoctorStatus } from '../../domain/tool-contracts.ts';
import type { TelemetryProbePort } from '../../domain/telemetry-probe-port.ts';
import type { ToolExecutionResult, ToolFlow } from '../../domain/tool-types.ts';
import { isRecord } from '../../domain/schema.ts';

/** Default local Aspire telemetry endpoint. */
export const DEFAULT_TELEMETRY_ENDPOINT = 'http://localhost:18888';

/** Create the S1 doctor flow for telemetry reachability. */
export function createDoctorFlow(
  probe: TelemetryProbePort,
  environmentEndpoint?: string,
): ToolFlow {
  return async (input: unknown): Promise<ToolExecutionResult> => {
    const explicit = isRecord(input) && typeof input.endpoint === 'string'
      ? input.endpoint
      : undefined;
    const endpoint = explicit || environmentEndpoint || DEFAULT_TELEMETRY_ENDPOINT;
    const result = await probe.probe(endpoint);
    const status: DoctorStatus = result.reachable ? 'pass' : 'warn';
    const check: DoctorCheck = {
      name: 'telemetry_endpoint',
      status,
      summary: result.message,
      ...(result.reachable ? {} : {
        fix:
          `Start the telemetry dashboard or set NETSCRIPT_TELEMETRY_ENDPOINT to a reachable URL.`,
      }),
    };
    const value: DoctorResult = {
      status,
      endpoint,
      counts: { pass: status === 'pass' ? 1 : 0, warn: status === 'warn' ? 1 : 0, fail: 0 },
      checks: [check],
    };
    return { ok: true, value };
  };
}
