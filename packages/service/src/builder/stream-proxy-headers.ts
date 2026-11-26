/**
 * Final mounted response header & additive `Set-Cookie` ownership helpers for
 * `@netscript/service` stream proxy mounts.
 *
 * @module
 */

const HTTP_HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const UNSAFE_HEADER_VALUE_CHARS = /[\r\n\0]/;

const RESERVED_STREAM_RESPONSE_HEADERS: ReadonlySet<string> = new Set([
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
]);

const RESERVED_STREAM_RESPONSE_PREFIXES: readonly string[] = [
  'access-control-',
  'cross-origin-',
];

/** Mandatory `Vary` header applied to mounted stream proxy responses. */
export const STREAM_MOUNT_VARY_HEADER =
  'Authorization, Cookie, Origin, Sec-Fetch-Site, Sec-Fetch-Dest';

/** Mandatory `Cache-Control` header applied to `200` mounted SSE stream responses. */
export const STREAM_MOUNT_SSE_CACHE_CONTROL = 'no-store, no-cache, no-transform';

/** Result of validating deferred `AuthnResult.responseHeaders` and `AuthnResult.setCookies`. */
export type ValidatedAuthnOverlayResult =
  | {
    readonly ok: true;
    readonly headers: readonly (readonly [string, string])[];
    readonly setCookies: readonly string[];
  }
  | {
    readonly ok: false;
    readonly reason: string;
  };

function isReservedStreamResponseHeader(name: string): boolean {
  const lower = name.toLowerCase();
  if (RESERVED_STREAM_RESPONSE_HEADERS.has(lower)) return true;
  return RESERVED_STREAM_RESPONSE_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function isSafeHeaderValue(value: unknown): value is string {
  if (typeof value !== 'string' || UNSAFE_HEADER_VALUE_CHARS.test(value)) return false;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code > 0xff || (code < 0x20 && code !== 0x09) || code === 0x7f) return false;
  }
  return true;
}

/** Validates deferred `AuthnResult.responseHeaders` and `AuthnResult.setCookies` fail-closed. */
export function validateAuthnStreamOverlayHeaders(
  responseHeaders: Readonly<Record<string, string>> | undefined,
  setCookies: readonly string[] | undefined,
): ValidatedAuthnOverlayResult {
  try {
    const probe = new Headers();
    const entries: Array<readonly [string, string]> = [];
    if (responseHeaders !== undefined) {
      if (
        typeof responseHeaders !== 'object' ||
        responseHeaders === null ||
        Array.isArray(responseHeaders)
      ) {
        return { ok: false, reason: 'invalid_authn_response_headers' };
      }
      for (const [name, value] of Object.entries(responseHeaders)) {
        if (!HTTP_HEADER_NAME_PATTERN.test(name) || !isSafeHeaderValue(value)) {
          return { ok: false, reason: 'invalid_authn_response_header_value' };
        }
        if (isReservedStreamResponseHeader(name)) {
          return { ok: false, reason: 'reserved_authn_response_header' };
        }
        try {
          probe.set(name, value);
        } catch {
          return { ok: false, reason: 'invalid_authn_response_header_value' };
        }
        entries.push([name, value]);
      }
    }

    const cookies: string[] = [];
    if (setCookies !== undefined) {
      if (!Array.isArray(setCookies)) {
        return { ok: false, reason: 'invalid_authn_set_cookies' };
      }
      for (let i = 0; i < setCookies.length; i += 1) {
        const cookie: unknown = setCookies[i];
        if (!isSafeHeaderValue(cookie) || cookie.trim().length === 0) {
          return { ok: false, reason: 'invalid_authn_set_cookie_value' };
        }
        try {
          probe.append('set-cookie', cookie);
        } catch {
          return { ok: false, reason: 'invalid_authn_set_cookie_value' };
        }
        cookies.push(cookie);
      }
    }

    return { ok: true, headers: entries, setCookies: cookies };
  } catch {
    return { ok: false, reason: 'invalid_authn_response_headers' };
  }
}

/**
 * Composes final mounted response headers & additive `Set-Cookie` values from deferred
 * `AuthnResult` and `mount.handle`'s `Response`, guaranteeing Tier 3 mandatory headers stay
 * non-overridable and zero `Set-Cookie` headers are dropped.
 */
export function composeMountedStreamResponse(
  proxyResponse: Response,
  authnHeaders: readonly (readonly [string, string])[],
  authnSetCookies: readonly string[],
): Response {
  const finalHeaders = new Headers();

  for (const [name, value] of authnHeaders) {
    finalHeaders.set(name, value);
  }
  for (const [name, value] of proxyResponse.headers.entries()) {
    if (name.toLowerCase() === 'set-cookie') continue;
    finalHeaders.set(name, value);
  }
  for (const cookie of authnSetCookies) {
    finalHeaders.append('set-cookie', cookie);
  }
  for (const cookie of proxyResponse.headers.getSetCookie()) {
    finalHeaders.append('set-cookie', cookie);
  }

  if (proxyResponse.status === 200) {
    if (!finalHeaders.get('content-type')?.toLowerCase().startsWith('text/event-stream')) {
      finalHeaders.set('content-type', 'text/event-stream; charset=utf-8');
    }
    finalHeaders.set('cache-control', STREAM_MOUNT_SSE_CACHE_CONTROL);
    finalHeaders.set('x-content-type-options', 'nosniff');
    finalHeaders.set('x-accel-buffering', 'no');
    finalHeaders.set('vary', mergeVaryTokens(finalHeaders.get('vary'), STREAM_MOUNT_VARY_HEADER));
  }

  return new Response(proxyResponse.body, {
    status: proxyResponse.status,
    statusText: proxyResponse.statusText,
    headers: finalHeaders,
  });
}

function mergeVaryTokens(existing: string | null, required: string): string {
  const tokens = new Map<string, string>();
  for (const value of [existing, required]) {
    for (const part of value?.split(',') ?? []) {
      const token = part.trim();
      if (token === '*') return '*';
      const key = token.toLowerCase();
      if (token && !tokens.has(key)) tokens.set(key, token);
    }
  }
  return [...tokens.values()].join(', ');
}

/** Builds a redacted JSON error response with mandatory proxy cache/security headers. */
export function createStreamGuardErrorResponse(
  status: number,
  error: string,
  reason: string,
): Response {
  return new Response(JSON.stringify({ error, reason }), {
    status,
    headers: new Headers({
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'vary': STREAM_MOUNT_VARY_HEADER,
    }),
  });
}
