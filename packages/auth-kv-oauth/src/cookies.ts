/**
 * Cookie helpers for KV OAuth transaction and session identifiers.
 *
 * @example
 * ```ts
 * import { buildCookieHeader } from "@netscript/auth-kv-oauth/cookies";
 *
 * const header = buildCookieHeader(
 *   "sess_test",
 *   new Request("https://app.example.test/"),
 * );
 * ```
 *
 * @module
 */

import type { AuthnRequest } from '@netscript/service/auth';

export type { AuthnRequest } from '@netscript/service/auth';
import { KvOAuthError } from './errors.ts';

/** Cookie policy for the server-side session id. */
export type KvOAuthCookieOptions = Readonly<{
  name?: string;
  path?: string;
  domain?: string;
  maxAge?: number;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
  /** Trust proxy-written protocol headers only when direct client access is blocked. Default false. */
  trustProxyHeaders?: boolean;
  /** Auth cookies are always HttpOnly; false is refused at issuance. */
  httpOnly?: true;
  allowInsecureDev?: boolean;
}>;

/** Parses a Cookie header into a key/value map. */
export function parseCookieHeader(cookieHeader: string | undefined): ReadonlyMap<string, string> {
  const cookies = new Map<string, string>();
  for (const part of cookieHeader?.split(';') ?? []) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (rawName) {
      cookies.set(rawName, decodeURIComponent(rawValue.join('=')));
    }
  }
  return cookies;
}

/**
 * Derives HTTPS from the request URL, or protocol headers with explicit proxy trust.
 *
 * AuthnRequest has no URL; callers without trusted headers must supply an explicit override.
 * Trusted proxies must replace incoming protocol headers and prevent direct client access.
 * X-Forwarded-Proto takes precedence; only the first Forwarded hop is considered.
 *
 * @example
 * ```ts
 * import { deriveHttps } from "@netscript/auth-kv-oauth/cookies";
 * const request = new Request("http://app.example.test/", {
 *   headers: { "x-forwarded-proto": "https" },
 * });
 * const https = deriveHttps(request, undefined, true);
 * ```
 */
export function deriveHttps(
  input: Request | AuthnRequest,
  override?: boolean,
  trustProxyHeaders = false,
): boolean {
  if (override !== undefined) {
    return override;
  }
  if (trustProxyHeaders) {
    const header = input instanceof Request
      ? input.headers.get.bind(input.headers)
      : input.header.bind(input);
    const forwardedProto = header('x-forwarded-proto')?.split(',', 1)[0]?.trim().toLowerCase();
    if (forwardedProto) {
      return forwardedProto === 'https';
    }
    const firstHop = header('forwarded')?.split(',', 1)[0];
    const proto = firstHop?.match(/(?:^|;)\s*proto=(?:"([^";]+)"|([^;\s]+))/i);
    if (proto) {
      return (proto[1] ?? proto[2])?.toLowerCase() === 'https';
    }
  }
  return input instanceof Request ? new URL(input.url).protocol === 'https:' : false;
}

/** Builds a Set-Cookie header for a live session. */
export function buildCookieHeader(
  value: string,
  request: Request | AuthnRequest,
  options: KvOAuthCookieOptions = {},
): string {
  const name = options.name ?? '__Host-ns_session';
  const path = options.path ?? '/';
  const secure = options.secure ?? deriveHttps(request, undefined, options.trustProxyHeaders);
  // Runtime callers (including JavaScript) must obey the same policy as typed callers.
  if (options.httpOnly !== undefined && options.httpOnly !== true) {
    throw new KvOAuthError('configuration_error', 'Auth cookies require HttpOnly.');
  }
  if (!secure && !options.allowInsecureDev) {
    throw new KvOAuthError(
      'cookie_https_required',
      'Session cookie gate requires HTTPS; configure trusted proxy headers or explicit cookie.allowInsecureDev for development.',
    );
  }
  assertCookiePolicy(name, path, options.domain);
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `SameSite=${options.sameSite ?? 'Lax'}`,
  ];
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.domain !== undefined) {
    parts.push(`Domain=${options.domain}`);
  }
  if (options.httpOnly ?? true) {
    parts.push('HttpOnly');
  }
  if (secure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

/** Builds a Set-Cookie header that expires the backend session cookie. */
export function clearCookieHeader(
  request: Request | AuthnRequest,
  options: KvOAuthCookieOptions = {},
): string {
  return `${
    buildCookieHeader('', request, { ...options, maxAge: 0 })
  }; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function assertCookiePolicy(
  name: string,
  path: string,
  domain: string | undefined,
): void {
  if (name.startsWith('__Host-')) {
    if (path !== '/' || domain !== undefined) {
      throw new KvOAuthError(
        'configuration_error',
        '__Host- cookies require Path=/ and no Domain.',
      );
    }
  }
}
