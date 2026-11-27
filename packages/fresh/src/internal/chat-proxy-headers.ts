/**
 * Package-internal header validation, upstream allowlist construction, and
 * non-SSE response sanitization for opt-in authorized `createNetScriptChatStreamProxy`.
 */

const HTTP_HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
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

function isValidTraceparent(value: string): boolean {
  const match = W3C_TRACEPARENT_PATTERN.exec(value.trim());
  if (!match) return false;
  const version = match[1]!.toLowerCase();
  return version !== 'ff' && match[2] !== ALL_ZERO_TRACE_ID && match[3] !== ALL_ZERO_PARENT_ID;
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

/** Case-insensitively merges `target.headers` overlaid by server `auth()` headers. */
export function mergeChatServerHeaders(
  targetHeaders: readonly (readonly [string, string])[],
  authHeaders: Readonly<Record<string, string>>,
): Record<string, string> {
  const merged = new Headers();
  for (const [name, value] of targetHeaders) merged.set(name, value);
  for (const [name, value] of Object.entries(authHeaders)) {
    if (!isValidHeaderName(name) || !isSafeHeaderValue(value)) {
      throw new Error('invalid_upstream_auth_header');
    }
    merged.set(name, value);
  }
  const record: Record<string, string> = {};
  for (const [name, value] of merged.entries()) record[name] = value;
  return record;
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

  const traceparent = request.headers.get('traceparent');
  if (traceparent !== null && isValidTraceparent(traceparent)) {
    headers.set('traceparent', traceparent.trim());
    const tracestate = request.headers.get('tracestate');
    if (tracestate !== null && isSafeHeaderValue(tracestate) && tracestate.length <= 512) {
      headers.set('tracestate', tracestate.trim());
    }
  }

  for (const [name, value] of targetHeaders) headers.set(name, value);
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
      if (token.length > 0) headers.delete(token);
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
