import type {
  EndpointCandidate,
  ServiceEndpointProbePort,
  ServiceEndpointProbeResult,
} from '../../ports/service-endpoint-directory-port.ts';

/** Default maximum bytes retained from either probe response. */
export const DEFAULT_SERVICE_ENDPOINT_RESPONSE_BYTE_LIMIT = 2_000_000;

/** Exact P3 guidance for credential-free spec requests rejected with 401 or 403. */
export const SPEC_UNAVAILABLE_AUTH_GUIDANCE =
  'spec_unavailable: OpenAPI document could not be fetched. The spec route may require authentication; allow anonymous access to the OpenAPI route (for NetScript auth, add /api/openapi.json to auth.authn.allowAnonymous) or provide a reachable public spec URL.';

/** Options for credential-free, bounded service endpoint probing. */
export interface FetchServiceEndpointProbeOptions {
  /** Maximum bytes retained from either response. */
  readonly responseByteLimit?: number;
  /** Override the Web Platform fetch boundary for deterministic tests. */
  readonly fetch?: typeof fetch;
}

/**
 * Fetches OpenAPI first, then verifies the service identity at the selected base path.
 *
 * The identity response must be JSON with a `service` field equal to the candidate name.
 */
export class FetchServiceEndpointProbe implements ServiceEndpointProbePort {
  readonly #responseByteLimit: number;
  readonly #fetch: typeof fetch;

  /** Create a probe with explicit response bounds and an optional fetch seam. */
  constructor(options: FetchServiceEndpointProbeOptions = {}) {
    this.#responseByteLimit = positiveInteger(
      options.responseByteLimit ?? DEFAULT_SERVICE_ENDPOINT_RESPONSE_BYTE_LIMIT,
      'responseByteLimit',
    );
    this.#fetch = options.fetch ?? fetch;
  }

  /** Return one mapped status without attaching credentials or following redirects. */
  async probe(
    candidate: EndpointCandidate,
    signal: AbortSignal,
  ): Promise<ServiceEndpointProbeResult> {
    if (!candidate.baseUrl) {
      return { outcome: 'not_running', reason: 'Candidate has no discovered endpoint.' };
    }
    signal.throwIfAborted();
    const baseUrl = new URL(`${candidate.baseUrl}/`);
    const specUrl = new URL('api/openapi.json', baseUrl);
    let specResponse: Response;
    try {
      specResponse = await this.#request(specUrl, signal);
    } catch (error) {
      return transportResult(error, 'OpenAPI document');
    }
    if (!specResponse.ok) {
      return {
        outcome: 'spec_unavailable',
        reason: `OpenAPI document returned HTTP ${specResponse.status}.`,
        httpStatus: specResponse.status,
        ...(specResponse.status === 401 || specResponse.status === 403
          ? { guidance: SPEC_UNAVAILABLE_AUTH_GUIDANCE }
          : {}),
      };
    }
    const specText = await readBoundedText(specResponse, this.#responseByteLimit);
    if (!specText.ok) return { outcome: 'spec_unavailable', reason: specText.reason };
    let spec: unknown;
    try {
      spec = JSON.parse(specText.value);
    } catch (error) {
      return {
        outcome: 'spec_unavailable',
        reason: `OpenAPI document was not valid JSON: ${describe(error)}`,
      };
    }

    let identityResponse: Response;
    try {
      identityResponse = await this.#request(baseUrl, signal);
    } catch (error) {
      return {
        outcome: 'identity_mismatch',
        reason: `Service identity could not be fetched: ${describe(error)}`,
      };
    }
    if (!identityResponse.ok) {
      return {
        outcome: 'identity_mismatch',
        reason: `Service identity returned HTTP ${identityResponse.status}.`,
        httpStatus: identityResponse.status,
      };
    }
    const identityText = await readBoundedText(identityResponse, this.#responseByteLimit);
    if (!identityText.ok) return { outcome: 'identity_mismatch', reason: identityText.reason };
    let identity: unknown;
    try {
      identity = JSON.parse(identityText.value);
    } catch (error) {
      return {
        outcome: 'identity_mismatch',
        reason: `Service identity was not valid JSON: ${describe(error)}`,
      };
    }
    if (!isRecord(identity) || identity['service'] !== candidate.name) {
      const actual = isRecord(identity) && typeof identity['service'] === 'string'
        ? identity['service']
        : 'unavailable';
      return {
        outcome: 'identity_mismatch',
        reason: `Expected service ${JSON.stringify(candidate.name)} but endpoint identified as ${
          JSON.stringify(actual)
        }.`,
      };
    }
    return { outcome: 'running', spec };
  }

  #request(url: URL, signal: AbortSignal): Promise<Response> {
    return this.#fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      credentials: 'omit',
      redirect: 'error',
      signal,
    });
  }
}

type BoundedTextResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly reason: string };

async function readBoundedText(response: Response, maximum: number): Promise<BoundedTextResult> {
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null && Number(contentLength) > maximum) {
    await response.body?.cancel();
    return { ok: false, reason: `Response exceeded the ${maximum}-byte limit.` };
  }
  if (!response.body) return { ok: true, value: '' };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maximum) {
        await reader.cancel();
        return { ok: false, reason: `Response exceeded the ${maximum}-byte limit.` };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return { ok: true, value: new TextDecoder().decode(bytes) };
}

function transportResult(error: unknown, subject: string): ServiceEndpointProbeResult {
  const reason = describe(error);
  if (/connection refused|no route to host|network is unreachable|dns error/i.test(reason)) {
    return { outcome: 'not_running', reason: `${subject} endpoint is not listening: ${reason}` };
  }
  return { outcome: 'spec_unavailable', reason: `${subject} could not be fetched: ${reason}` };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive integer`);
  }
  return value;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
