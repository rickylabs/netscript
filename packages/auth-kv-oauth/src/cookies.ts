import type { AuthnRequest } from '@netscript/service/auth';
import { KvOAuthError } from './errors.ts';

/** Cookie policy for the server-side session id. */
export type KvOAuthCookieOptions = Readonly<{
  name?: string;
  path?: string;
  domain?: string;
  maxAge?: number;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
  httpOnly?: boolean;
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

/** Derives whether a request should be treated as HTTPS behind proxies. */
export function deriveHttps(input: Request | AuthnRequest, override?: boolean): boolean {
  if (override !== undefined) {
    return override;
  }
  const header = input instanceof Request
    ? input.headers.get.bind(input.headers)
    : input.header.bind(input);
  const forwardedProto = header('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === 'https';
  }
  const proto = header('forwarded')?.match(/proto=([^;,]+)/i)?.[1]?.toLowerCase();
  if (proto) {
    return proto === 'https';
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
  const secure = options.secure ?? deriveHttps(request);
  assertCookiePolicy(name, path, options.domain, secure, options.allowInsecureDev ?? false);
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
  secure: boolean,
  allowInsecureDev: boolean,
): void {
  if (name.startsWith('__Host-')) {
    if (path !== '/' || domain !== undefined) {
      throw new KvOAuthError(
        'configuration_error',
        '__Host- cookies require Path=/ and no Domain.',
      );
    }
    if (!secure && !allowInsecureDev) {
      throw new KvOAuthError('https_required', '__Host- cookies require HTTPS.');
    }
  }
}
