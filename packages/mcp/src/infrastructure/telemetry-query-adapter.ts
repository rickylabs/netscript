import { createTelemetryQuery, type TelemetryQueryPort } from '@netscript/telemetry/query';
import type { TelemetryEndpointEnvironment } from '../domain/telemetry-endpoint.ts';
import { resolveTelemetryEndpoint } from '../domain/telemetry-endpoint.ts';

/** Create the Aspire-backed telemetry reader for resolved endpoint inputs. */
export function createResolvedTelemetryQuery(
  explicit: string | undefined,
  environment: TelemetryEndpointEnvironment,
): TelemetryQueryPort {
  return createTelemetryQuery({
    endpoint: resolveTelemetryEndpoint(explicit, environment).endpoint,
  });
}

/** Read only the environment values used by telemetry endpoint discovery. */
export function readTelemetryEndpointEnvironment(): TelemetryEndpointEnvironment {
  return {
    NETSCRIPT_TELEMETRY_ENDPOINT: Deno.env.get('NETSCRIPT_TELEMETRY_ENDPOINT'),
    ASPIRE_DASHBOARD_PORT: Deno.env.get('ASPIRE_DASHBOARD_PORT'),
  };
}
