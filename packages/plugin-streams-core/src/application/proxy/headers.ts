/**
 * Package-internal header hygiene, 3-tier response ownership, and redaction helpers for the
 * authorizing SSE stream proxy.
 */

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

const SAFE_UPSTREAM_METADATA_HEADERS: readonly string[] = [
  'stream-next-offset',
  'stream-cursor',
  'stream-up-to-date',
  'stream-closed',
  'etag',
  'traceparent',
  'tracestate',
  'x-request-id',
];

const RESERVED_RESPONSE_HEADERS: ReadonlySet<string> = new Set([
  // Framing, encoding, and RFC 9110 §7.6.1 hop-by-hop
  'content-type',
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'upgrade',
  // Mandatory cache / SSE / security
  'cache-control',
  'pragma',
  'expires',
  'x-content-type-options',
  'x-accel-buffering',
  'vary',
  // Auth / cookie ownership
  'authorization',
  'www-authenticate',
  'set-cookie',
  // Protocol replay metadata (Tier 1 owned)
  'stream-next-offset',
  'stream-cursor',
  'stream-up-to-date',
  'stream-closed',
  'etag',
]);

const RESERVED_RESPONSE_PREFIXES: readonly string[] = [
  'access-control-',
  'cross-origin-',
];

const HTTP_HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const UNSAFE_HEADER_VALUE_CHARS = /[\r\n\0]/;
const W3C_TRACEPARENT_PATTERN = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;
const ALL_ZERO_TRACE_ID = '00000000000000000000000000000000';
const ALL_ZERO_PARENT_ID = '0000000000000000';

/** Mandatory Vary header applied to stream proxy responses. */
export const STREAM_PROXY_VARY_HEADER =
  'Authorization, Cookie, Origin, Sec-Fetch-Site, Sec-Fetch-Dest';

/** Mandatory Cache-Control header applied to 200 SSE stream proxy responses. */
export const STREAM_PROXY_SSE_CACHE_CONTROL = 'no-store, no-cache, no-transform';

/** Result of validating application-supplied headers and cookies. */
export type ValidatedAppHeadersResult =
  | {
    readonly ok: true;
    readonly headers: readonly (readonly [string, string])[];
    readonly setCookies: readonly string[];
  }
  | {
    readonly ok: false;
    readonly reason: string;
  };

/** Checks whether a lowercase header name is reserved by proxy, protocol, or CORS tiers. */
export function isReservedStreamProxyResponseHeader(name: string): boolean {
  const lower = name.toLowerCase();
  if (RESERVED_RESPONSE_HEADERS.has(lower)) return true;
  return RESERVED_RESPONSE_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function isValidHeaderName(name: string): boolean {
  return HTTP_HEADER_NAME_PATTERN.test(name);
}

function isSafeHeaderValue(value: unknown): value is string {
  return typeof value === 'string' && !UNSAFE_HEADER_VALUE_CHARS.test(value);
}

/** Validates Tier 2 `decision.responseHeaders` and `decision.setCookies` before proceeding. */
export function validateAppOverlayHeaders(
  responseHeaders: Readonly<Record<string, string>> | undefined,
  setCookies: readonly string[] | undefined,
): ValidatedAppHeadersResult {
  const entries: Array<readonly [string, string]> = [];
  if (responseHeaders !== undefined) {
    if (
      typeof responseHeaders !== 'object' || responseHeaders === null ||
      Array.isArray(responseHeaders)
    ) {
      return { ok: false, reason: 'invalid_response_headers' };
    }
    for (const [name, value] of Object.entries(responseHeaders)) {
      if (!isValidHeaderName(name) || !isSafeHeaderValue(value)) {
        return { ok: false, reason: 'invalid_response_header_value' };
      }
      if (isReservedStreamProxyResponseHeader(name)) {
        return { ok: false, reason: 'reserved_response_header' };
      }
      entries.push([name, value]);
    }
  }

  const cookies: string[] = [];
  if (setCookies !== undefined) {
    if (!Array.isArray(setCookies)) {
      return { ok: false, reason: 'invalid_set_cookies' };
    }
    for (const cookie of setCookies) {
      if (!isSafeHeaderValue(cookie) || cookie.trim().length === 0) {
        return { ok: false, reason: 'invalid_set_cookie_value' };
      }
      cookies.push(cookie);
    }
  }

  return { ok: true, headers: entries, setCookies: cookies };
}

function collectDynamicHopByHopHeaders(upstreamHeaders: Headers): Set<string> {
  const hopByHop = new Set<string>(STATIC_HOP_BY_HOP_HEADERS);
  const connection = upstreamHeaders.get('connection');
  if (connection) {
    for (const rawToken of connection.split(',')) {
      const token = rawToken.trim().toLowerCase();
      if (token.length > 0) hopByHop.add(token);
    }
  }
  return hopByHop;
}

/**
 * Assembles the 200 SSE downstream response headers in three strict ordered tiers:
 * 1. Allowlisted safe upstream metadata after stripping static + dynamic `Connection` headers.
 * 2. Validated application `responseHeaders` + additive `setCookies`.
 * 3. Non-overridable proxy mandatory SSE / cache / security / Vary headers.
 */
export function buildStreamProxySseResponseHeaders(
  upstreamHeaders: Headers,
  appHeaders: readonly (readonly [string, string])[],
  appSetCookies: readonly string[],
): Headers {
  const headers = new Headers();
  const hopByHop = collectDynamicHopByHopHeaders(upstreamHeaders);

  // Tier 1: allowlisted safe upstream metadata only
  for (const name of SAFE_UPSTREAM_METADATA_HEADERS) {
    if (hopByHop.has(name)) continue;
    const value = upstreamHeaders.get(name);
    if (value !== null && isSafeHeaderValue(value)) {
      headers.set(name, value);
    }
  }

  // Tier 2: validated application overlay headers and additive Set-Cookie values
  for (const [name, value] of appHeaders) {
    headers.set(name, value);
  }
  for (const cookie of appSetCookies) {
    headers.append('set-cookie', cookie);
  }

  // Tier 3: proxy-owned mandatory headers (written last, non-overridable)
  headers.set('content-type', 'text/event-stream; charset=utf-8');
  headers.set('cache-control', STREAM_PROXY_SSE_CACHE_CONTROL);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-accel-buffering', 'no');
  headers.set('vary', STREAM_PROXY_VARY_HEADER);
  return headers;
}

function isValidTraceparent(value: string): boolean {
  const match = W3C_TRACEPARENT_PATTERN.exec(value.trim());
  if (!match) return false;
  const version = match[1]!.toLowerCase();
  const traceId = match[2]!;
  const parentId = match[3]!;
  return version !== 'ff' && traceId !== ALL_ZERO_TRACE_ID && parentId !== ALL_ZERO_PARENT_ID;
}

/**
 * Constructs upstream request headers from a strict allowlist.
 * Never copies client `Cookie`, client `Authorization`, `Host`, `Origin`, `Referer`,
 * or `X-Forwarded-*` headers.
 */
export function buildUpstreamRequestHeaders(
  incomingRequest: Request,
  upstreamAuthHeaders: Readonly<Record<string, string>>,
): Headers {
  const headers = new Headers();

  for (const [name, value] of Object.entries(upstreamAuthHeaders)) {
    if (!isValidHeaderName(name) || !isSafeHeaderValue(value)) {
      throw new Error('invalid_upstream_auth_header');
    }
    headers.set(name, value);
  }

  const traceparent = incomingRequest.headers.get('traceparent');
  if (traceparent !== null && isValidTraceparent(traceparent)) {
    headers.set('traceparent', traceparent.trim());
    const tracestate = incomingRequest.headers.get('tracestate');
    if (tracestate !== null && isSafeHeaderValue(tracestate) && tracestate.length <= 512) {
      headers.set('tracestate', tracestate.trim());
    }
  }

  headers.set('accept', 'text/event-stream');
  headers.set('accept-encoding', 'identity');
  return headers;
}

/** Sanitizes a caller-supplied refusal reason into a short non-secret code. */
export function sanitizeDiagnosticReason(reason: unknown, fallback: string): string {
  if (typeof reason !== 'string') return fallback;
  const trimmed = reason.trim();
  if (trimmed.length === 0 || trimmed.length > 128) return fallback;
  if (!/^[A-Za-z0-9._:-]+$/.test(trimmed)) return fallback;
  return trimmed;
}

/** Constructs a redacted JSON error response with proxy cache/security headers. */
export function createProxyErrorResponse(
  status: number,
  error: string,
  reason: string,
  extraHeaders?: Readonly<Record<string, string>>,
): Response {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'vary': STREAM_PROXY_VARY_HEADER,
  });
  if (extraHeaders) {
    for (const [name, value] of Object.entries(extraHeaders)) {
      headers.set(name, value);
    }
  }
  return new Response(JSON.stringify({ error, reason }), { status, headers });
}
