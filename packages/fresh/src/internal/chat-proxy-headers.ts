/**
 * Package-internal header validation, upstream allowlist construction, and
 * non-SSE response sanitization for opt-in authorized `createNetScriptChatStreamProxy`.
 */

const HTTP_HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const MIME_ESSENCE_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+\/[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const UNSAFE_HEADER_VALUE_CHARS = /[\r\n\0]/;
const W3C_TRACEPARENT_PATTERN = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;
const ALL_ZERO_TRACE_ID = '00000000000000000000000000000000';
const ALL_ZERO_PARENT_ID = '0000000000000000';

/** Mandatory Vary header applied to authorized chat proxy responses. */
export const CHAT_PROXY_VARY_HEADER =
  'Authorization, Cookie, Origin, Sec-Fetch-Site, Sec-Fetch-Dest';

const STATIC_HOP_BY_HOP_HEADERS: ReadonlySet<string> = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const STRIPPED_TARGET_OVERLAY_HEADERS: ReadonlySet<string> = new Set([
  'authorization',
  'cookie',
  'host',
  'origin',
  'referer',
  'accept-encoding',
  'content-length',
  ...STATIC_HOP_BY_HOP_HEADERS,
]);

const STRIPPED_TARGET_OVERLAY_PREFIXES: readonly string[] = [
  'sec-fetch-',
  'x-forwarded-',
];

const STRIPPED_NON_SSE_UPSTREAM_HEADERS: ReadonlySet<string> = new Set([
  'content-encoding',
  'content-length',
  'set-cookie',
  'www-authenticate',
  'authorization',
  ...STATIC_HOP_BY_HOP_HEADERS,
]);

const RESERVED_POLICY_RESPONSE_HEADERS: ReadonlySet<string> = new Set([
  'content-type',
  'content-encoding',
  'content-length',
  'cache-control',
  'pragma',
  'expires',
  'x-content-type-options',
  'x-accel-buffering',
  'vary',
  'authorization',
  'www-authenticate',
  'set-cookie',
  'stream-next-offset',
  'stream-cursor',
  'stream-up-to-date',
  'stream-closed',
  'etag',
  ...STATIC_HOP_BY_HOP_HEADERS,
]);

const RESERVED_POLICY_HEADER_PREFIXES: readonly string[] = [
  'access-control-',
  'cross-origin-',
];

/** Checks RFC 9110 header name token syntax. */
export function isValidHeaderName(name: string): boolean {
  return HTTP_HEADER_NAME_PATTERN.test(name);
}

/** Checks RFC 9110 safe single-line ASCII/Latin-1 header value characters. */
export function isSafeHeaderValue(value: unknown): value is string {
  if (typeof value !== 'string' || UNSAFE_HEADER_VALUE_CHARS.test(value)) return false;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code > 0xff || (code < 0x20 && code !== 0x09) || code === 0x7f) return false;
  }
  return true;
}

function isReservedPolicyHeader(name: string): boolean {
  const lower = name.toLowerCase();
  if (RESERVED_POLICY_RESPONSE_HEADERS.has(lower)) return true;
  return RESERVED_POLICY_HEADER_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/** Checks whether a `target.headers` overlay key is a client credential or transport header. */
export function isStrippedTargetOverlayHeader(name: string): boolean {
  const lower = name.toLowerCase();
  if (STRIPPED_TARGET_OVERLAY_HEADERS.has(lower)) return true;
  return STRIPPED_TARGET_OVERLAY_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/** Validates and sanitizes `target.headers`, stripping client credentials and hop-by-hop keys. */
export function extractSanitizedTargetHeaders(
  rawHeaders: unknown,
): readonly (readonly [string, string])[] | null {
  if (rawHeaders === undefined) return [];
  if (typeof rawHeaders !== 'object' || rawHeaders === null || Array.isArray(rawHeaders)) {
    return null;
  }
  const sanitized: Array<readonly [string, string]> = [];
  for (const [name, value] of Object.entries(rawHeaders)) {
    if (!isValidHeaderName(name) || !isSafeHeaderValue(value)) return null;
    if (isStrippedTargetOverlayHeader(name)) continue;
    sanitized.push([name, value]);
  }
  return sanitized;
}

/** Validates W3C `traceparent` syntax (non-ff version, non-zero trace/parent IDs). */
export function isValidTraceparent(value: string): boolean {
  const match = W3C_TRACEPARENT_PATTERN.exec(value.trim());
  if (!match) return false;
  const version = match[1]!.toLowerCase();
  return version !== 'ff' && match[2] !== ALL_ZERO_TRACE_ID && match[3] !== ALL_ZERO_PARENT_ID;
}

/** Extracts validated client W3C trace headers before internal SSE delegation correlation. */
export function extractClientTraceContext(
  headers: Headers,
): Readonly<{ readonly traceparent: string | null; readonly tracestate: string | null }> {
  const rawTraceparent = headers.get('traceparent');
  if (rawTraceparent === null || !isValidTraceparent(rawTraceparent)) {
    return { traceparent: null, tracestate: null };
  }
  const rawTracestate = headers.get('tracestate');
  const tracestate =
    rawTracestate !== null && isSafeHeaderValue(rawTracestate) && rawTracestate.length <= 512
      ? rawTracestate.trim()
      : null;
  return { traceparent: rawTraceparent.trim(), tracestate };
}

function hasUnquotedCommaOrUnterminatedQuote(value: string): boolean {
  let inQuotes = false;
  let escaped = false;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i]!;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\' && inQuotes) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) return true;
  }
  return inQuotes;
}

/**
 * Rejects SSE (`text/event-stream`) and ambiguous/combined or malformed `Content-Type` values
 * on non-SSE responses (both `GET` and `POST`) so duplicate headers such as
 * `application/json, text/event-stream` can never bypass revocable SSE enforcement.
 */
export function isDisallowedNonSseContentType(rawContentType: string | null): boolean {
  if (rawContentType === null) return false;
  if (hasUnquotedCommaOrUnterminatedQuote(rawContentType)) return true;
  if (rawContentType.toLowerCase().includes('text/event-stream')) return true;
  const essence = rawContentType.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!MIME_ESSENCE_PATTERN.test(essence)) return true;
  return essence === 'text/event-stream';
}

/** Validates Tier-2 admission overlay headers and Set-Cookie entries inside try/catch. */
export function validateChatPolicyHeaders(
  responseHeaders: Readonly<Record<string, string>> | undefined,
  setCookies: readonly string[] | undefined,
):
  | {
    readonly ok: true;
    readonly headers: readonly (readonly [string, string])[];
    readonly setCookies: readonly string[];
  }
  | { readonly ok: false } {
  try {
    const probe = new Headers();
    const entries: Array<readonly [string, string]> = [];
    if (responseHeaders !== undefined) {
      if (
        typeof responseHeaders !== 'object' || responseHeaders === null ||
        Array.isArray(responseHeaders)
      ) {
        return { ok: false };
      }
      for (const [name, value] of Object.entries(responseHeaders)) {
        if (!isValidHeaderName(name) || !isSafeHeaderValue(value) || isReservedPolicyHeader(name)) {
          return { ok: false };
        }
        probe.set(name, value);
        entries.push([name, value]);
      }
    }

    const cookies: string[] = [];
    if (setCookies !== undefined) {
      if (!Array.isArray(setCookies)) return { ok: false };
      for (let i = 0; i < setCookies.length; i += 1) {
        const cookie: unknown = setCookies[i];
        if (!isSafeHeaderValue(cookie) || cookie.trim().length === 0) return { ok: false };
        probe.append('set-cookie', cookie);
        cookies.push(cookie);
      }
    }
    return { ok: true, headers: entries, setCookies: cookies };
  } catch {
    return { ok: false };
  }
}

/**
 * Builds final upstream headers for a delegated `GET` `live=sse` request:
 * sanitized `target.headers` overlaid by core proxy server auth headers + restored valid trace
 * headers + mandatory `accept: text/event-stream` and `accept-encoding: identity`.
 */
export function buildSseDelegatedUpstreamHeaders(
  targetHeaders: readonly (readonly [string, string])[],
  proxyHeaders: Headers,
  clientTraceparent: string | null,
  clientTracestate: string | null,
): Headers {
  const headers = new Headers();
  for (const [name, value] of targetHeaders) {
    const lower = name.toLowerCase();
    if (lower === 'traceparent' || lower === 'tracestate') continue;
    if (!isStrippedTargetOverlayHeader(name)) headers.set(name, value);
  }
  for (const [name, value] of proxyHeaders.entries()) {
    const lower = name.toLowerCase();
    if (lower === 'traceparent' || lower === 'tracestate') continue;
    headers.set(name, value);
  }
  if (clientTraceparent !== null) {
    headers.set('traceparent', clientTraceparent);
    if (clientTracestate !== null) headers.set('tracestate', clientTracestate);
  }
  headers.set('accept', 'text/event-stream');
  headers.set('accept-encoding', 'identity');
  return headers;
}

/** Strict allowlist upstream request headers for authorized POST / non-SSE GET. */
export function buildNonSseUpstreamHeaders(
  request: Request,
  targetHeaders: readonly (readonly [string, string])[],
  authHeaders: Readonly<Record<string, string>>,
): Headers {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType !== null && isSafeHeaderValue(contentType)) {
    headers.set('content-type', contentType);
  }
  const accept = request.headers.get('accept');
  if (accept !== null && isSafeHeaderValue(accept)) headers.set('accept', accept);

  for (const [name, value] of targetHeaders) {
    const lower = name.toLowerCase();
    if (lower === 'traceparent' || lower === 'tracestate') continue;
    if (!isStrippedTargetOverlayHeader(name)) headers.set(name, value);
  }

  const trace = extractClientTraceContext(request.headers);
  if (trace.traceparent !== null) {
    headers.set('traceparent', trace.traceparent);
    if (trace.tracestate !== null) headers.set('tracestate', trace.tracestate);
  }

  for (const [name, value] of Object.entries(authHeaders)) {
    if (!isValidHeaderName(name) || !isSafeHeaderValue(value)) {
      throw new Error('invalid_upstream_auth_header');
    }
    headers.set(name, value);
  }
  headers.set('accept-encoding', 'identity');
  return headers;
}

/** Sanitizes an upstream non-SSE response while preserving JSON/etag/Stream-* headers. */
export function sanitizeAuthorizedNonSseResponse(
  upstream: Response,
  policyHeaders: readonly (readonly [string, string])[],
  policyCookies: readonly string[],
): Response {
  const headers = new Headers(upstream.headers);
  const connection = upstream.headers.get('connection');
  if (connection) {
    for (const rawToken of connection.split(',')) {
      const token = rawToken.trim().toLowerCase();
      if (token.length > 0 && isValidHeaderName(token)) headers.delete(token);
    }
  }
  for (const name of [...headers.keys()]) {
    const lower = name.toLowerCase();
    if (
      STRIPPED_NON_SSE_UPSTREAM_HEADERS.has(lower) ||
      RESERVED_POLICY_HEADER_PREFIXES.some((prefix) => lower.startsWith(prefix))
    ) {
      headers.delete(name);
    }
  }
  for (const [name, value] of policyHeaders) headers.set(name, value);
  for (const cookie of policyCookies) headers.append('set-cookie', cookie);
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('vary', CHAT_PROXY_VARY_HEADER);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
