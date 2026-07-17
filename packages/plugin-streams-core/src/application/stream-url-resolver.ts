import { STREAMS_RESOURCE_NAME, STREAMS_URL_PREFIX } from '../domain/constants.ts';

interface EnvReadState {
  readonly deniedKeys: string[];
}

function createEnvReadState(): EnvReadState {
  return { deniedKeys: [] };
}

function isPermissionDenied(error: unknown): boolean {
  return error instanceof Error &&
    (error.name === 'PermissionDenied' || error.constructor.name === 'PermissionDenied');
}

function readDenoEnv(key: string, state: EnvReadState): string | undefined {
  try {
    return Deno.env.get(key);
  } catch (error) {
    if (isPermissionDenied(error)) {
      state.deniedKeys.push(key);
      return undefined;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read environment variable "${key}": ${message}`);
  }
}

function getServerServiceEndpoint(
  serviceName: string,
  state: EnvReadState,
  protocol: 'http' | 'https' = 'http',
  index = 0,
): string | undefined {
  if (typeof Deno === 'undefined') {
    return undefined;
  }

  return readDenoEnv(`services__${serviceName}__${protocol}__${index}`, state);
}

/**
 * Read a service URL from the browser environment.
 *
 * Mirrors the lookup performed by `@netscript/sdk/discovery` so that browser
 * consumers (Fresh islands, the Vite-built playground) can resolve the streams
 * URL without taking a framework-level dependency on the SDK.
 *
 * Aspire's `WithConfiguredViteHttpReferences` injects two env vars per
 * service reference, both surfaced by Vite as `import.meta.env.VITE_*`:
 *   1. `VITE_services__{name}__{protocol}__{index}` — isomorphic full format.
 *   2. `VITE_{NORMALISED}_URL` — convenience shorthand.
 */
function getBrowserServiceEndpoint(
  serviceName: string,
  protocol: 'http' | 'https' = 'http',
  index = 0,
): string | undefined {
  try {
    const env = readImportMetaEnvironment(import.meta);
    if (!env) return undefined;

    const fullKey = `VITE_services__${serviceName}__${protocol}__${index}`;
    const fullUrl = env[fullKey];
    if (fullUrl) return fullUrl;

    const shortKey = `VITE_${serviceName.toUpperCase().replace(/-/g, '_')}_URL`;
    return env[shortKey];
  } catch {
    return undefined;
  }
}

function readImportMetaEnvironment(
  meta: ImportMeta,
): Readonly<Record<string, string | undefined>> | undefined {
  if (!('env' in meta) || !isEnvironmentRecord(meta.env)) return undefined;
  return meta.env;
}

function isEnvironmentRecord(
  value: unknown,
): value is Readonly<Record<string, string | undefined>> {
  return typeof value === 'object' && value !== null &&
    Object.values(value).every((entry: unknown) =>
      entry === undefined || typeof entry === 'string'
    );
}

/**
 * Resolve the base URL of the durable streams server.
 *
 * Works in both server (Deno) and browser contexts. On the server, `Deno.env`
 * is checked first for explicit overrides, then for Aspire's
 * `services__streams__http__0` discovery variable. In the browser, the
 * Vite-injected `VITE_services__streams__http__0` (or the
 * `VITE_STREAMS_URL` shorthand) is consulted.
 */
export function getStreamsUrl(): string {
  const envState = createEnvReadState();

  if (typeof Deno !== 'undefined') {
    const explicit = readDenoEnv('DURABLE_STREAMS_URL', envState);
    if (explicit) {
      return explicit;
    }
  }

  const serverDiscovered = getServerServiceEndpoint(STREAMS_RESOURCE_NAME, envState, 'http');
  if (serverDiscovered) {
    return serverDiscovered;
  }

  const browserDiscovered = getBrowserServiceEndpoint(STREAMS_RESOURCE_NAME, 'http');
  if (browserDiscovered) {
    return browserDiscovered;
  }

  if (envState.deniedKeys.length > 0) {
    throw new Error(
      'Durable streams URL not found because Deno environment access was denied for ' +
        `${envState.deniedKeys.join(', ')}. Grant --allow-env for these variables, ` +
        'set DURABLE_STREAMS_URL explicitly in an allowed context, or provide ' +
        'VITE_services__streams__http__0 in browser builds.',
    );
  }

  throw new Error(
    'Durable streams URL not found. Expected DURABLE_STREAMS_URL or ' +
      'services__streams__http__0 (server) / VITE_services__streams__http__0 ' +
      '(browser) in the environment.',
  );
}

/** Resolve authentication headers for the durable streams server. */
export function getStreamsAuth(): Record<string, string> {
  const envState = createEnvReadState();
  const secret = (typeof Deno !== 'undefined'
    ? (readDenoEnv('STREAMS_SECRET', envState) ??
      readDenoEnv('DURABLE_STREAMS_SECRET', envState))
    : undefined) ?? '';
  if (!secret && envState.deniedKeys.length > 0) {
    throw new Error(
      'Durable streams auth could not be resolved because Deno environment access was denied for ' +
        `${envState.deniedKeys.join(', ')}. Grant --allow-env for these variables or run without ` +
        'streams auth secrets.',
    );
  }
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}

/** Build the full stream URL for a NetScript stream path. */
export function buildStreamUrl(path: string, baseUrl?: string): string {
  const base = (baseUrl ?? getStreamsUrl()).replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${STREAMS_URL_PREFIX}${normalized}`;
}
