const DEFAULT_SAGAS_URL = 'http://127.0.0.1:8092';
const DEFAULT_HEALTH_PATH = '/health';
const DEFAULT_ROUNDTRIP_PATH = '/api/v1/sagas/publish';

/** HTTP response summary captured by E2E probes. */
export interface ProbeHttpResult {
  /** Requested URL. */
  readonly url: string;
  /** HTTP status code. */
  readonly status: number;
  /** HTTP status text. */
  readonly statusText: string;
  /** Response body preview for diagnostics. */
  readonly bodyPreview: string;
}

/** Roundtrip probe request payload. */
export interface SagasRoundtripProbePayload {
  /** Message type routed through the saga API. */
  readonly type: string;
  /** Probe payload sent to the saga API. */
  readonly payload: Readonly<{
    readonly probeId: string;
    readonly source: 'sagas-e2e';
  }>;
  /** Correlation id for the probe run. */
  readonly correlationId: string;
}

/** Resolve the sagas service URL used by E2E probes. */
export function resolveSagasProbeUrl(): string {
  return (
    Deno.env.get('SAGAS_API_URL') ??
      Deno.env.get('NETSCRIPT_SAGAS_URL') ??
      DEFAULT_SAGAS_URL
  ).replace(/\/$/, '');
}

/** Resolve the health path used by E2E probes. */
export function resolveSagasHealthPath(): string {
  return normalizePath(Deno.env.get('SAGAS_HEALTH_PATH') ?? DEFAULT_HEALTH_PATH);
}

/** Resolve the publish path used by the roundtrip probe. */
export function resolveSagasRoundtripPath(): string {
  return normalizePath(Deno.env.get('SAGAS_ROUNDTRIP_PATH') ?? DEFAULT_ROUNDTRIP_PATH);
}

/** Return a unique roundtrip payload for an isolated probe run. */
export function createSagasRoundtripPayload(): SagasRoundtripProbePayload {
  const probeId = crypto.randomUUID();
  return Object.freeze({
    type: Deno.env.get('SAGAS_ROUNDTRIP_MESSAGE_TYPE') ?? 'sagas.e2e.requested',
    payload: Object.freeze({
      probeId,
      source: 'sagas-e2e' as const,
    }),
    correlationId: `sagas-e2e:${probeId}`,
  });
}

/** Join a base URL and normalized path. */
export function joinProbeUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${normalizePath(path)}`;
}

/** Summarize an HTTP response for probe diagnostics. */
export async function summarizeResponse(response: Response): Promise<ProbeHttpResult> {
  const body = await response.text();
  return Object.freeze({
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    bodyPreview: body.slice(0, 500),
  });
}

/** Throw when a probe response is not successful. */
export function assertSuccessfulProbe(result: ProbeHttpResult, label: string): void {
  if (result.status >= 200 && result.status < 300) {
    return;
  }
  throw new Error(
    `${label} probe failed with ${result.status} ${result.statusText}: ${result.bodyPreview}`,
  );
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}
