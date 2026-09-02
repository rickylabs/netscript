/**
 * Span-link attribute enrichment for the `aspire otel spans` read path.
 *
 * Aspire CLI 13.5 serialises span links as `{ traceId, spanId }` only
 * (`SharedAIHelpers.SerializeSpansToJson`), so the per-message attributes a fan-in consumer
 * attaches to each link never reach `--format Json`. The Dashboard telemetry API the CLI reads
 * from does keep them (`TelemetryExportService.ConvertSpanLink`), so linked spans are re-read
 * there — authenticated with the same login-token exchange the CLI performs — and the CLI rows
 * borrow the API's links before normalisation.
 */

const API_KEY_HEADER = 'X-API-Key';
const LOGIN_TOKEN_PARAM = 't';

/** Read the OTLP-shaped links of every span in `traceId`, keyed by span id. */
export type LinkedSpanReader = (
  traceId: string,
) => Promise<ReadonlyMap<string, readonly unknown[]>>;

/** Build a Dashboard telemetry API reader from the `aspire ps` dashboard URL (login URL or base). */
export function createDashboardLinkedSpanReader(
  dashboardUrl: string,
  fetchImpl: typeof fetch = fetch,
): LinkedSpanReader {
  const { baseUrl, loginToken } = splitDashboardUrl(dashboardUrl);
  let apiKey: Promise<string | undefined> | undefined;
  const resolveApiKey = () => {
    apiKey ??= exchangeLoginToken(fetchImpl, baseUrl, loginToken);
    return apiKey;
  };
  return async (traceId) => {
    const key = await resolveApiKey();
    const url = new URL('/api/telemetry/spans', baseUrl);
    url.searchParams.set('traceId', traceId);
    url.searchParams.set('limit', '1000');
    const response = await fetchImpl(url, { headers: key ? { [API_KEY_HEADER]: key } : {} });
    if (!response.ok) {
      throw new Error(`dashboard telemetry API ${url.pathname} returned ${response.status}`);
    }
    return indexLinkedSpans(await response.json());
  };
}

/**
 * Replace the links of CLI span rows with the Dashboard API's attribute-bearing links. Rows
 * without links are untouched; a row whose trace the API cannot serve keeps its CLI links.
 */
export async function enrichAspireCliSpanLinks(
  spans: readonly unknown[],
  readLinkedSpans: LinkedSpanReader | undefined,
): Promise<readonly unknown[]> {
  if (readLinkedSpans === undefined) return spans;
  const traceIds = new Set<string>();
  for (const span of spans) {
    if (hasLinks(span)) traceIds.add(span.traceId);
  }
  if (traceIds.size === 0) return spans;
  const byTrace = new Map<string, ReadonlyMap<string, readonly unknown[]>>();
  await Promise.all([...traceIds].map(async (traceId) => {
    byTrace.set(traceId, await readLinkedSpans(traceId).catch(() => new Map()));
  }));
  return spans.map((span) => {
    if (!hasLinks(span)) return span;
    const links = byTrace.get(span.traceId)?.get(span.spanId);
    return links === undefined || links.length === 0 ? span : { ...span, links };
  });
}

/** Index a Dashboard telemetry API span payload (`{ data: { resourceSpans } }`) by span id. */
export function indexLinkedSpans(payload: unknown): ReadonlyMap<string, readonly unknown[]> {
  const index = new Map<string, readonly unknown[]>();
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const resourceSpans = isRecord(data) && Array.isArray(data.resourceSpans)
    ? data.resourceSpans
    : [];
  for (const resource of resourceSpans) {
    const scopeSpans = isRecord(resource) && Array.isArray(resource.scopeSpans)
      ? resource.scopeSpans
      : [];
    for (const scope of scopeSpans) {
      const spans = isRecord(scope) && Array.isArray(scope.spans) ? scope.spans : [];
      for (const span of spans) {
        if (!isRecord(span) || typeof span.spanId !== 'string') continue;
        if (Array.isArray(span.links) && span.links.length > 0) index.set(span.spanId, span.links);
      }
    }
  }
  return index;
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
  return isRecord(body) && typeof body.apiKey === 'string' ? body.apiKey : undefined;
}

function hasLinks(
  value: unknown,
): value is Record<string, unknown> & { traceId: string; spanId: string; links: unknown[] } {
  return isRecord(value) && typeof value.traceId === 'string' &&
    typeof value.spanId === 'string' && Array.isArray(value.links) && value.links.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
