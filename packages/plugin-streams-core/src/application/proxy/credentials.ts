import type { StreamEndpointClientAuthMode } from '@netscript/contracts/streams';
import type { ServiceProxyTrust } from '@netscript/service/rate-limit';
import type { StreamProxyCredentialMode } from '../../domain/stream-proxy-contract.ts';

/**
 * RFC 6750 §2.1 `b64token` Bearer grammar:
 * `b64token = 1*( ALPHA / DIGIT / "-" / "." / "_" / "~" / "+" / "/" ) *"="`
 * Duplicate `Authorization` headers are joined by Fetch `Headers.get` with `", "`,
 * which fails this strict single-token grammar automatically.
 */
const RFC6750_BEARER_PATTERN = /^Bearer[ \t]+([A-Za-z0-9._~+/-]+=*)$/i;

const FORBIDDEN_COOKIE_DESTINATIONS: ReadonlySet<string> = new Set([
  'document',
  'iframe',
  'frame',
  'script',
  'image',
  'style',
  'audio',
  'video',
  'object',
  'embed',
  'font',
  'manifest',
  'track',
]);

const VALID_FORWARDED_PROTO = /^(http|https)$/i;
const INVALID_FORWARDED_HOST_PRINTABLE = /[,\s@/?#\\]/;

function hasInvalidForwardedHostChars(value: string): boolean {
  if (INVALID_FORWARDED_HOST_PRINTABLE.test(value)) return true;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/** Configuration for deterministic credential selection and cookie CSRF/Origin checks. */
export interface StreamProxyCredentialGuardOptions {
  /** Allowed client credential transports. */
  readonly clientAuth: StreamEndpointClientAuthMode;
  /** Pre-validated exact cross-origin allowlist for cookie clients. */
  readonly allowedOrigins: ReadonlySet<string>;
  /** Trusted reverse-proxy peer predicate for forwarded origin resolution. */
  readonly trustProxy: ServiceProxyTrust;
  /** Whether direct navigation (`Sec-Fetch-Site: none`) is allowed for cookie requests. */
  readonly allowDirectNavigation: boolean;
}

/** Result of pre-admission credential selection and cookie cross-site checks. */
export type CredentialGuardResult =
  | { readonly ok: true; readonly credentialMode: StreamProxyCredentialMode }
  | { readonly ok: false; readonly status: 401 | 403 | 503; readonly reason: string };

/** Validates `allowedOrigins` at proxy construction time; rejects `*`, `null`, and non-origins. */
export function validateAllowedOrigins(
  allowedOrigins: readonly string[] | undefined,
): ReadonlySet<string> {
  const result = new Set<string>();
  if (allowedOrigins === undefined) return result;
  if (!Array.isArray(allowedOrigins)) {
    throw new TypeError('[netscript.streams.proxy] allowedOrigins must be an array of origins');
  }
  for (const entry of allowedOrigins) {
    if (typeof entry !== 'string' || entry === '*' || entry === 'null') {
      throw new TypeError(
        `[netscript.streams.proxy] invalid allowedOrigin '${
          String(entry)
        }': wildcard and null are forbidden`,
      );
    }
    const parsed = URL.parse(entry);
    if (
      !parsed ||
      (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
      parsed.origin !== entry
    ) {
      throw new TypeError(
        `[netscript.streams.proxy] allowedOrigins entries must be exact http(s) origins: '${entry}'`,
      );
    }
    result.add(entry);
  }
  return result;
}

type OriginResolutionResult =
  | { readonly ok: true; readonly origin: string }
  | { readonly ok: false; readonly status: 403 | 503; readonly reason: string };

function evaluateTrustedProxyPeer(
  remoteAddr: Deno.Addr | undefined,
  trustProxy: ServiceProxyTrust,
): { readonly ok: true; readonly trusted: boolean } | { readonly ok: false } {
  if (!trustProxy || !remoteAddr || !('hostname' in remoteAddr)) {
    return { ok: true, trusted: false };
  }
  try {
    return { ok: true, trusted: trustProxy(remoteAddr.hostname) === true };
  } catch {
    return { ok: false };
  }
}

function parseForwardedHost(proto: string, rawHost: string): string | undefined {
  if (rawHost.length === 0 || hasInvalidForwardedHostChars(rawHost)) return undefined;
  const parsed = URL.parse(`${proto}://${rawHost}`);
  if (
    !parsed ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.pathname !== '/' ||
    parsed.search !== '' ||
    parsed.hash !== ''
  ) {
    return undefined;
  }
  return parsed.origin;
}

function resolveEffectiveTargetOrigin(
  request: Request,
  remoteAddr: Deno.Addr | undefined,
  trustProxy: ServiceProxyTrust,
): OriginResolutionResult {
  const requestUrl = new URL(request.url);
  const peerTrust = evaluateTrustedProxyPeer(remoteAddr, trustProxy);
  if (!peerTrust.ok) {
    return { ok: false, status: 503, reason: 'policy_unavailable' };
  }
  if (!peerTrust.trusted) {
    return { ok: true, origin: requestUrl.origin };
  }

  const hasProto = request.headers.has('x-forwarded-proto');
  const hasHost = request.headers.has('x-forwarded-host');
  if (!hasProto && !hasHost) {
    return { ok: true, origin: requestUrl.origin };
  }

  let proto = requestUrl.protocol.slice(0, -1).toLowerCase();
  if (hasProto) {
    const rawProto = (request.headers.get('x-forwarded-proto') ?? '').trim();
    if (!VALID_FORWARDED_PROTO.test(rawProto)) {
      return { ok: false, status: 403, reason: 'invalid_forwarded_origin' };
    }
    proto = rawProto.toLowerCase();
  }

  if (hasHost) {
    const rawHost = (request.headers.get('x-forwarded-host') ?? '').trim();
    const origin = parseForwardedHost(proto, rawHost);
    if (!origin) {
      return { ok: false, status: 403, reason: 'invalid_forwarded_origin' };
    }
    return { ok: true, origin };
  }

  // Partial-pair rule: only X-Forwarded-Proto present -> combine with requestUrl.host.
  const combined = URL.parse(`${proto}://${requestUrl.host}`);
  if (!combined) {
    return { ok: false, status: 403, reason: 'invalid_forwarded_origin' };
  }
  return { ok: true, origin: combined.origin };
}

function checkCookieOriginAndFetchMetadata(
  request: Request,
  remoteAddr: Deno.Addr | undefined,
  options: StreamProxyCredentialGuardOptions,
): CredentialGuardResult {
  const target = resolveEffectiveTargetOrigin(request, remoteAddr, options.trustProxy);
  if (!target.ok) {
    return { ok: false, status: target.status, reason: target.reason };
  }
  const effectiveOrigin = target.origin;

  const hasOrigin = request.headers.has('origin');
  const rawOrigin = hasOrigin ? (request.headers.get('origin') ?? '').trim() : null;
  if (rawOrigin !== null) {
    if (rawOrigin === 'null' || rawOrigin.length === 0) {
      return { ok: false, status: 403, reason: 'cross_site_cookie_denied' };
    }
    const parsedOrigin = URL.parse(rawOrigin);
    if (
      !parsedOrigin ||
      (parsedOrigin.protocol !== 'http:' && parsedOrigin.protocol !== 'https:') ||
      parsedOrigin.origin !== rawOrigin
    ) {
      return { ok: false, status: 403, reason: 'cross_site_cookie_denied' };
    }
    if (rawOrigin !== effectiveOrigin && !options.allowedOrigins.has(rawOrigin)) {
      return { ok: false, status: 403, reason: 'cross_site_cookie_denied' };
    }
  }

  const hasFetchSite = request.headers.has('sec-fetch-site');
  const secFetchSite = hasFetchSite
    ? (request.headers.get('sec-fetch-site') ?? '').trim().toLowerCase()
    : null;
  if (secFetchSite !== null) {
    if (secFetchSite === 'same-origin') {
      if (rawOrigin !== null && rawOrigin !== effectiveOrigin) {
        return { ok: false, status: 403, reason: 'cross_site_cookie_denied' };
      }
    } else if (secFetchSite === 'cross-site' || secFetchSite === 'same-site') {
      if (rawOrigin === null || !options.allowedOrigins.has(rawOrigin)) {
        return { ok: false, status: 403, reason: 'cross_site_cookie_denied' };
      }
    } else if (secFetchSite === 'none') {
      if (!options.allowDirectNavigation) {
        return { ok: false, status: 403, reason: 'direct_navigation_denied' };
      }
    } else {
      return { ok: false, status: 403, reason: 'invalid_fetch_metadata' };
    }
  }

  if (request.headers.has('sec-fetch-dest')) {
    const secFetchDest = (request.headers.get('sec-fetch-dest') ?? '').trim().toLowerCase();
    if (FORBIDDEN_COOKIE_DESTINATIONS.has(secFetchDest)) {
      const allowedNav = secFetchDest === 'document' &&
        options.allowDirectNavigation &&
        secFetchSite === 'none';
      if (!allowedNav) {
        return { ok: false, status: 403, reason: 'forbidden_fetch_destination' };
      }
    }
  }

  return { ok: true, credentialMode: 'cookie' };
}

/**
 * Selects the exact client credential mode (`'bearer'` or `'cookie'`) and enforces
 * RFC 6750 Bearer grammar and Cookie Origin / Fetch Metadata checks before admission.
 */
export function selectCredentialAndGuard(
  request: Request,
  remoteAddr: Deno.Addr | undefined,
  options: StreamProxyCredentialGuardOptions,
): CredentialGuardResult {
  const hasAuthorization = request.headers.has('authorization');
  const authorization = hasAuthorization ? (request.headers.get('authorization') ?? '') : '';
  const hasValidBearer = hasAuthorization && RFC6750_BEARER_PATTERN.test(authorization);

  if (options.clientAuth === 'bearer') {
    if (!hasAuthorization) {
      return { ok: false, status: 401, reason: 'bearer_required' };
    }
    if (!hasValidBearer) {
      return { ok: false, status: 401, reason: 'invalid_authorization_header' };
    }
    return { ok: true, credentialMode: 'bearer' };
  }

  if (options.clientAuth === 'cookie') {
    if (hasAuthorization) {
      return { ok: false, status: 401, reason: 'bearer_not_allowed' };
    }
    return checkCookieOriginAndFetchMetadata(request, remoteAddr, options);
  }

  // 'bearer-or-cookie'
  if (hasAuthorization) {
    if (!hasValidBearer) {
      return { ok: false, status: 401, reason: 'invalid_authorization_header' };
    }
    return { ok: true, credentialMode: 'bearer' };
  }

  return checkCookieOriginAndFetchMetadata(request, remoteAddr, options);
}

/**
 * Verifies a pre-selected `context.credentialMode` handed in from a mount host against the
 * proxy's configured `clientAuth` policy before admission (`authorize`).
 */
export function validateHandedCredentialMode(
  handedMode: unknown,
  clientAuth: StreamEndpointClientAuthMode,
): CredentialGuardResult {
  if (handedMode !== 'bearer' && handedMode !== 'cookie') {
    return { ok: false, status: 401, reason: 'invalid_credential_mode' };
  }
  if (clientAuth === 'bearer' && handedMode !== 'bearer') {
    return { ok: false, status: 401, reason: 'bearer_required' };
  }
  if (clientAuth === 'cookie' && handedMode !== 'cookie') {
    return { ok: false, status: 401, reason: 'bearer_not_allowed' };
  }
  return { ok: true, credentialMode: handedMode };
}
