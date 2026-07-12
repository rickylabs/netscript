import type { DoctorCheck, DoctorResult, DoctorStatus } from '../../domain/tool-contracts.ts';
import type { TelemetryProbePort } from '../../domain/telemetry-probe-port.ts';
import type { ToolExecutionResult, ToolFlow } from '../../domain/tool-types.ts';
import { isRecord } from '../../domain/schema.ts';
import {
  resolveTelemetryEndpoint,
  type TelemetryEndpointEnvironment,
} from '../../domain/telemetry-endpoint.ts';

/** Create the S1 doctor flow for telemetry reachability. */
export function createDoctorFlow(
  probe: TelemetryProbePort,
  environment: TelemetryEndpointEnvironment = {},
): ToolFlow {
  return async (input: unknown): Promise<ToolExecutionResult> => {
    const explicit = isRecord(input) && typeof input.endpoint === 'string'
      ? input.endpoint
      : undefined;
    const resolved = resolveTelemetryEndpoint(explicit, environment);
    let endpoint = resolved.endpoint;
    let result = await probe.probe(endpoint);
    if (!result.reachable && resolved.httpsFallback) {
      const fallback = await probe.probe(resolved.httpsFallback);
      if (fallback.reachable) {
        endpoint = resolved.httpsFallback;
        result = fallback;
      }
    }
    const status: DoctorStatus = result.reachable ? 'pass' : 'warn';
    const check: DoctorCheck = {
      name: 'telemetry_endpoint',
      status,
      summary: `${result.message} Resolved from ${resolved.source}; using ${
        new URL(endpoint).protocol
      }`,
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
