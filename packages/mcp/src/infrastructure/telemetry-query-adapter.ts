import { createTelemetryQuery, type TelemetryQueryPort } from '@netscript/telemetry/query';
import type { TelemetryEndpointEnvironment } from '../domain/telemetry-endpoint.ts';
import { resolveTelemetryEndpoint } from '../domain/telemetry-endpoint.ts';

/** Infrastructure overrides used by tests and non-standard Aspire installations. */
export interface ResolvedTelemetryQueryOptions {
  /** Fetch implementation supplied directly instead of local certificate discovery. */
  readonly fetch?: typeof fetch;
  /** Directory containing trusted ASP.NET development certificate PEM files. */
  readonly aspnetTrustDirectory?: string;
}

function isLoopbackHttps(endpoint: string): boolean {
  const url = new URL(endpoint);
  return url.protocol === 'https:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]');
}

function defaultAspnetTrustDirectory(): string | undefined {
  const home = Deno.env.get('HOME') ?? Deno.env.get('USERPROFILE');
  return home ? `${home}/.aspnet/dev-certs/trust` : undefined;
}

function readAspnetDevelopmentCertificates(directory: string | undefined): readonly string[] {
  if (!directory) {
    return [];
  }
  try {
    return [...Deno.readDirSync(directory)]
      .filter((entry) => entry.isFile && entry.name.endsWith('.pem'))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((entry) => Deno.readTextFileSync(`${directory}/${entry.name}`));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound || error instanceof Deno.errors.PermissionDenied) {
      return [];
    }
    throw error;
  }
}

/** Create a CA-verifying fetch for a loopback Aspire HTTPS dashboard when its PEM is available. */
export function createAspireDashboardFetch(
  endpoint: string,
  options: ResolvedTelemetryQueryOptions,
): typeof fetch | undefined {
  if (options.fetch) {
    return options.fetch;
  }
  if (!isLoopbackHttps(endpoint)) {
    return undefined;
  }

  const certificates = readAspnetDevelopmentCertificates(
    options.aspnetTrustDirectory ?? defaultAspnetTrustDirectory(),
  );
  if (certificates.length === 0) {
    return undefined;
  }

  const client = Deno.createHttpClient({ caCerts: [...certificates] });
  return (input, init) => {
    const request = { ...init, client } as RequestInit & { client: Deno.HttpClient };
    return fetch(input, request);
  };
}

/** Create the Aspire-backed telemetry reader for resolved endpoint inputs. */
export function createResolvedTelemetryQuery(
  explicit: string | undefined,
  environment: TelemetryEndpointEnvironment,
  options: ResolvedTelemetryQueryOptions = {},
): TelemetryQueryPort {
  const endpoint = resolveTelemetryEndpoint(explicit, environment).endpoint;
  return createTelemetryQuery({
    endpoint,
    fetch: createAspireDashboardFetch(endpoint, options),
  });
}

/** Read only the environment values used by telemetry endpoint discovery. */
export function readTelemetryEndpointEnvironment(): TelemetryEndpointEnvironment {
  return {
    NETSCRIPT_TELEMETRY_ENDPOINT: Deno.env.get('NETSCRIPT_TELEMETRY_ENDPOINT'),
    ASPIRE_DASHBOARD_PORT: Deno.env.get('ASPIRE_DASHBOARD_PORT'),
  };
}
