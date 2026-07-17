import type { DoctorCheck } from '../../domain/tool-contracts.ts';
import type { DoctorCheckContext, DoctorCheckFamily } from '../../domain/doctor-check-family.ts';
import type { TelemetryProbePort } from '../../domain/telemetry-probe-port.ts';
import {
  resolveTelemetryEndpoint,
  type TelemetryEndpointEnvironment,
} from '../../domain/telemetry-endpoint.ts';

/** Telemetry family plus the endpoint selected during its probe. */
export interface TelemetryDoctorFamily extends DoctorCheckFamily {
  /** Endpoint selected by the most recent check. */
  readonly endpoint: string;
}

/** Create telemetry reachability checks using the shared endpoint resolver. */
export function createTelemetryDoctorFamily(
  probe: TelemetryProbePort,
  explicitEndpoint: string | undefined,
  environment: TelemetryEndpointEnvironment = {},
): TelemetryDoctorFamily {
  const resolved = resolveTelemetryEndpoint(explicitEndpoint, environment);
  let endpoint = resolved.endpoint;
  return {
    name: 'telemetry',
    get endpoint(): string {
      return endpoint;
    },
    async check(context: DoctorCheckContext): Promise<readonly DoctorCheck[]> {
      let result = await probe.probe(endpoint);
      if (!result.reachable && resolved.httpsFallback) {
        const fallback = await probe.probe(resolved.httpsFallback);
        if (fallback.reachable) {
          endpoint = resolved.httpsFallback;
          result = fallback;
        }
      }
      const status = result.reachable
        ? 'pass'
        : context.explicitTelemetryEndpoint
        ? 'fail'
        : 'warn';
      return [{
        name: 'telemetry_endpoint',
        status,
        summary: `${result.message} Resolved from ${resolved.source}; using ${
          new URL(endpoint).protocol
        }`,
        ...(result.reachable ? {} : {
          fix:
            'Start the telemetry dashboard or set NETSCRIPT_TELEMETRY_ENDPOINT to a reachable URL.',
        }),
      }];
    },
  };
}
