/**
 * Authenticated access to the Aspire Dashboard telemetry API for span reads.
 *
 * Aspire CLI 13.5 `otel spans|traces --format Json` is a lossy projection
 * (`SharedAIHelpers.GetSpanDto`): span links keep only `{ traceId, spanId }` and span events are
 * dropped entirely, so gates that assert fan-in link attributes (TC-14) or producer lifecycle
 * events (`behavior.streams.producer-reconnect`) cannot be proven through it. The Dashboard
 * telemetry API the CLI itself reads returns full OTLP JSON (`TelemetryExportService`), and the
 * package query adapter already understands that envelope, so span reads go there directly —
 * authenticated with the same login-token exchange the CLI performs (`POST
 * /api/telemetry/validateToken` → `X-API-Key`).
 */

const API_KEY_HEADER = 'X-API-Key';
const LOGIN_TOKEN_PARAM = 't';

/** Perform an authenticated GET against `/api/telemetry/<path>` with the given query. */
export type DashboardTelemetryApiReader = (
  path: string,
  search: URLSearchParams,
) => Promise<Response>;

/** Build a Dashboard telemetry API reader from the `aspire ps` dashboard URL (login URL or base). */
export function createDashboardTelemetryApiReader(
  dashboardUrl: string,
  fetchImpl: typeof fetch = fetch,
): DashboardTelemetryApiReader {
  const { baseUrl, loginToken } = splitDashboardUrl(dashboardUrl);
  let apiKey: Promise<string | undefined> | undefined;
  return async (path, search) => {
    apiKey ??= exchangeLoginToken(fetchImpl, baseUrl, loginToken);
    const key = await apiKey;
    const url = new URL(`/api/telemetry/${path}`, baseUrl);
    url.search = search.toString();
    return await fetchImpl(url, {
      headers: key
        ? { accept: 'application/json', [API_KEY_HEADER]: key }
        : { accept: 'application/json' },
    });
  };
}

/** Split an `aspire ps` dashboard URL into its API base and optional frontend login token. */
export function splitDashboardUrl(
  dashboardUrl: string,
): { baseUrl: string; loginToken: string | undefined } {
  const url = new URL(dashboardUrl);
  const loginToken = url.searchParams.get(LOGIN_TOKEN_PARAM) ?? undefined;
  return { baseUrl: url.origin, loginToken };
}

async function exchangeLoginToken(
  fetchImpl: typeof fetch,
  baseUrl: string,
  loginToken: string | undefined,
): Promise<string | undefined> {
  if (loginToken === undefined) return undefined;
  const response = await fetchImpl(new URL('/api/telemetry/validateToken', baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: loginToken }),
  });
  if (!response.ok) {
    throw new Error(`dashboard login-token exchange returned ${response.status}`);
  }
  const body: unknown = await response.json();
  return typeof body === 'object' && body !== null &&
      typeof Reflect.get(body, 'apiKey') === 'string'
    ? Reflect.get(body, 'apiKey') as string
    : undefined;
}
