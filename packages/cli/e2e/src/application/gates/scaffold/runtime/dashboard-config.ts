import { dirname, join } from '@std/path';

/** Environment key that governs anonymous dashboard access in the generated `aspire.config.json`. */
export const DASHBOARD_ANONYMOUS_KEY = 'ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS';

/**
 * Force the generated AppHost's dashboard to run secured before it starts.
 *
 * The Aspire MCP smoke and the dashboard telemetry API reads need the login-token → API-key
 * exchange, which only exists when anonymous access is disabled; the AppHost then hands every
 * resource `OTEL_EXPORTER_OTLP_HEADERS=x-otlp-api-key=…`. The scaffold defaults the key to `true`
 * under `profiles.https.environmentVariables`, so the runtime gate flips it in place.
 */
export async function disableAnonymousDashboard(appHost: string): Promise<string> {
  const configPath = join(dirname(appHost), 'aspire.config.json');
  const config: unknown = JSON.parse(await Deno.readTextFile(configPath));
  const environmentVariables = readEnvironmentVariables(config);
  if (!environmentVariables) {
    throw new Error(`${configPath} omitted profiles.https.environmentVariables`);
  }
  environmentVariables[DASHBOARD_ANONYMOUS_KEY] = 'false';
  await Deno.writeTextFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return configPath;
}

function readEnvironmentVariables(config: unknown): Record<string, unknown> | undefined {
  if (typeof config !== 'object' || config === null) return undefined;
  const profiles = Reflect.get(config, 'profiles');
  if (typeof profiles !== 'object' || profiles === null) return undefined;
  const https = Reflect.get(profiles, 'https');
  if (typeof https !== 'object' || https === null) return undefined;
  const variables = Reflect.get(https, 'environmentVariables');
  return typeof variables === 'object' && variables !== null
    ? variables as Record<string, unknown>
    : undefined;
}
