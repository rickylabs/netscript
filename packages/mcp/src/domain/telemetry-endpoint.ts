/** Default local Aspire telemetry query endpoint. */
export const DEFAULT_TELEMETRY_ENDPOINT = 'http://localhost:18888';

/** Ordered environment inputs accepted by telemetry endpoint discovery. */
export interface TelemetryEndpointEnvironment {
  /** Fully qualified endpoint configured for NetScript telemetry. */
  readonly NETSCRIPT_TELEMETRY_ENDPOINT?: string;
  /** Aspire dashboard port used to derive a local endpoint. */
  readonly ASPIRE_DASHBOARD_PORT?: string;
}

/** Injectable runtime-edge port for reading a running AppHost dashboard URL. */
export interface AspirePsDashboardPort {
  /** Return the running AppHost dashboard URL, or undefined when no match is available. */
  readDashboardUrl(): string | undefined;
}

/** Source that selected a telemetry endpoint. */
export type TelemetryEndpointSource =
  | 'explicit'
  | 'netscript_env'
  | 'aspire_port'
  | 'aspire_ps'
  | 'default';

/** Resolved endpoint and its discovery source. */
export interface ResolvedTelemetryEndpoint {
  /** Normalized HTTP(S) endpoint selected by the resolver. */
  readonly endpoint: string;
  /** Precedence step that selected the endpoint. */
  readonly source: TelemetryEndpointSource;
  /** Loopback HTTPS alternative derived from an Aspire dashboard port. */
  readonly httpsFallback?: string;
}

/** Resolve the shared telemetry endpoint discovery policy. */
export function resolveTelemetryEndpoint(
  explicit: string | undefined,
  environment: TelemetryEndpointEnvironment = {},
  aspirePs?: AspirePsDashboardPort,
): ResolvedTelemetryEndpoint {
  const option = validUrl(explicit);
  if (option) return { endpoint: option, source: 'explicit' };
  const configured = validUrl(environment.NETSCRIPT_TELEMETRY_ENDPOINT);
  if (configured) return { endpoint: configured, source: 'netscript_env' };
  const port = validPort(environment.ASPIRE_DASHBOARD_PORT);
  if (port) {
    return {
      endpoint: `http://localhost:${port}`,
      httpsFallback: `https://localhost:${port}`,
      source: 'aspire_port',
    };
  }
  const runningDashboard = validUrl(aspirePs?.readDashboardUrl());
  if (runningDashboard) return { endpoint: runningDashboard, source: 'aspire_ps' };
  return { endpoint: DEFAULT_TELEMETRY_ENDPOINT, source: 'default' };
}

function validUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

function validPort(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return undefined;
  const port = Number(trimmed);
  return port >= 1 && port <= 65535 ? String(port) : undefined;
}
