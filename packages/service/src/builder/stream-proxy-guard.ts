/**
 * Pre-authn canonicalization, deterministic credential selection, Cookie Origin/Fetch-Metadata
 * checks, and final mounted response header/`Set-Cookie` ownership for `@netscript/service`
 * stream proxy mounts.
 *
 * Self-contained inside `@netscript/service` so `@netscript/service` never depends on
 * `@netscript/plugin-streams-core`.
 *
 * @module
 */

import type { StreamEndpointClientAuthMode } from '@netscript/contracts/streams';
import type { NormalizedStreamEndpoint } from '../auth/contract/stream-endpoint-policy.ts';
import type { ServiceProxyTrust } from '../rate-limit/middleware/options.ts';

const RFC6750_BEARER_PATTERN = /^Bearer[ \t]+([A-Za-z0-9._~+/-]+=*)$/i;
const VALID_FORWARDED_PROTO = /^(http|https)$/i;
const INVALID_FORWARDED_HOST_PRINTABLE = /[,\s@/?#\\]/;
const ENCODED_PATH_SEPARATOR = /%2f|%5c/i;

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

/** Pre-validated guard options captured at `ServiceBuilder.build()` time for one mount. */
export interface CompiledStreamMountGuard {
  /** Normalized stream endpoint metadata. */
  readonly endpoint: NormalizedStreamEndpoint;
  /** Pre-validated exact cross-origin allowlist for cookie clients. */
  readonly allowedOrigins: ReadonlySet<string>;
  /** Explicit trusted reverse-proxy predicate. */
  readonly trustProxy: ServiceProxyTrust;
  /** Whether direct navigation (`Sec-Fetch-Site: none`) is allowed for cookie requests. */
  readonly allowDirectNavigation: boolean;
}

/** Result of matching and canonicalizing a request path against mounted stream endpoints. */
export type StreamPathCanonicalizationResult<T extends CompiledStreamMountGuard> =
  | { readonly kind: 'unmatched' }
  | { readonly kind: 'matched'; readonly mount: T }
  | { readonly kind: 'invalid'; readonly reason: string };

/** Result of deterministic credential selection and Cookie Origin/Fetch-Metadata validation. */
export type StreamCredentialGuardResult =
  | { readonly ok: true; readonly credentialMode: 'bearer' | 'cookie' }
  | { readonly ok: false; readonly status: 401 | 403 | 503; readonly reason: string };

/** Validates `guardConfig.allowedOrigins` at `build()` time; rejects `*`, `null`, and non-origins. */
export function validateStreamAllowedOrigins(
  allowedOrigins: readonly string[] | undefined,
): ReadonlySet<string> {
  const result = new Set<string>();
  if (allowedOrigins === undefined) return result;
  if (!Array.isArray(allowedOrigins)) {
    throw new TypeError(
      '[netscript.service.stream-proxy] guardConfig.allowedOrigins must be an array of origins',
    );
  }
  for (const entry of allowedOrigins) {
    if (typeof entry !== 'string' || entry === '*' || entry === 'null') {
      throw new TypeError(
        `[netscript.service.stream-proxy] invalid allowedOrigin '${
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
        `[netscript.service.stream-proxy] allowedOrigins entries must be exact http(s) origins: '${entry}'`,
      );
    }
    result.add(entry);
  }
  return result;
}

function splitPathSegmentsExact(pathname: string): readonly string[] | null {
  if (!pathname.startsWith('/')) return null;
  if (pathname === '/') return [];
  return pathname.slice(1).split('/');
}

function matchSegmentsAgainstMount<T extends CompiledStreamMountGuard>(
  segments: readonly string[],
  mounts: readonly T[],
): T | undefined {
  for (const mount of mounts) {
    const template = mount.endpoint.segments;
    if (segments.length !== template.length) continue;
    let matched = true;
    for (let i = 0; i < template.length; i += 1) {
      const expected = template[i]!;
      const actual = segments[i]!;
      if (actual.length === 0) {
        matched = false;
        break;
      }
      if (expected.kind === 'static' && actual !== expected.value) {
        matched = false;
        break;
      }
    }
    if (matched) return mount;
  }
  return undefined;
}

/**
 * Matches BOTH `rawPathname` and `decodedPath` against mounted stream templates before `withAuthn`.
 * If either matches a mounted stream endpoint, fails closed `400` on `%2F`/`%5C`, `..`/`.`,
 * percent-encoded static segments, raw/decoded target disagreement, or malformed percent-encoding.
 */
export function matchAndCanonicalizeStreamRequest<T extends CompiledStreamMountGuard>(
  rawPathname: string,
  decodedPath: string,
  mounts: readonly T[],
): StreamPathCanonicalizationResult<T> {
  const rawSegments = splitPathSegmentsExact(rawPathname);
  const decodedSegments = splitPathSegmentsExact(decodedPath);
  const rawMatch = rawSegments ? matchSegmentsAgainstMount(rawSegments, mounts) : undefined;
  const decodedMatch = decodedSegments
    ? matchSegmentsAgainstMount(decodedSegments, mounts)
    : undefined;

  if (!rawMatch && !decodedMatch) {
    return { kind: 'unmatched' };
  }
  if (rawMatch && decodedMatch && rawMatch.endpoint.id !== decodedMatch.endpoint.id) {
    return { kind: 'invalid', reason: 'ambiguous_stream_path' };
  }

  const target = rawMatch ?? decodedMatch!;
  if (ENCODED_PATH_SEPARATOR.test(rawPathname)) {
    return { kind: 'invalid', reason: 'encoded_path_separator' };
  }
  if (!rawSegments || rawSegments.length !== target.endpoint.segments.length) {
    return { kind: 'invalid', reason: 'non_canonical_stream_path' };
  }

  for (let i = 0; i < target.endpoint.segments.length; i += 1) {
    const expected = target.endpoint.segments[i]!;
    const rawSeg = rawSegments[i]!;
    if (rawSeg.length === 0 || rawSeg === '.' || rawSeg === '..') {
      return { kind: 'invalid', reason: 'invalid_stream_path_segment' };
    }
    if (expected.kind === 'static') {
      // Static segments MUST match raw verbatim (rejects `/api/%73treams/...`).
      if (rawSeg !== expected.value) {
        return { kind: 'invalid', reason: 'encoded_static_stream_segment' };
      }
      continue;
    }
    let decodedSeg: string;
    try {
      decodedSeg = decodeURIComponent(rawSeg);
    } catch {
      return { kind: 'invalid', reason: 'invalid_percent_encoding' };
    }
    if (
      decodedSeg.length === 0 ||
      decodedSeg === '.' ||
      decodedSeg === '..' ||
      decodedSeg.includes('/') ||
      decodedSeg.includes('\\')
    ) {
      return { kind: 'invalid', reason: 'invalid_stream_path_segment' };
    }
  }

  return { kind: 'matched', mount: target };
}

function hasInvalidForwardedHostChars(value: string): boolean {
  if (INVALID_FORWARDED_HOST_PRINTABLE.test(value)) return true;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

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
): { readonly ok: true; readonly origin: string } | {
  readonly ok: false;
  readonly status: 403 | 503;
  readonly reason: string;
} {
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

  const combined = URL.parse(`${proto}://${requestUrl.host}`);
  if (!combined) {
    return { ok: false, status: 403, reason: 'invalid_forwarded_origin' };
  }
  return { ok: true, origin: combined.origin };
}

function checkCookieOriginAndFetchMetadata(
  request: Request,
  remoteAddr: Deno.Addr | undefined,
  guard: CompiledStreamMountGuard,
): StreamCredentialGuardResult {
  const target = resolveEffectiveTargetOrigin(request, remoteAddr, guard.trustProxy);
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
    if (rawOrigin !== effectiveOrigin && !guard.allowedOrigins.has(rawOrigin)) {
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
      if (rawOrigin === null || !guard.allowedOrigins.has(rawOrigin)) {
        return { ok: false, status: 403, reason: 'cross_site_cookie_denied' };
      }
    } else if (secFetchSite === 'none') {
      if (!guard.allowDirectNavigation) {
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
        guard.allowDirectNavigation &&
        secFetchSite === 'none';
      if (!allowedNav) {
        return { ok: false, status: 403, reason: 'forbidden_fetch_destination' };
      }
    }
  }

  return { ok: true, credentialMode: 'cookie' };
}

/** Deterministic pre-authn credential selection and Cookie Origin/Fetch-Metadata guard. */
export function selectStreamCredentialAndGuard(
  request: Request,
  remoteAddr: Deno.Addr | undefined,
  guard: CompiledStreamMountGuard,
): StreamCredentialGuardResult {
  const clientAuth: StreamEndpointClientAuthMode = guard.endpoint.clientAuth;
  const hasAuthorization = request.headers.has('authorization');
  const authorization = hasAuthorization ? (request.headers.get('authorization') ?? '') : '';
  const hasValidBearer = hasAuthorization && RFC6750_BEARER_PATTERN.test(authorization);

  if (clientAuth === 'bearer') {
    if (!hasAuthorization) {
      return { ok: false, status: 401, reason: 'bearer_required' };
    }
    if (!hasValidBearer) {
      return { ok: false, status: 401, reason: 'invalid_authorization_header' };
    }
    return { ok: true, credentialMode: 'bearer' };
  }

  if (clientAuth === 'cookie') {
    if (hasAuthorization) {
      return { ok: false, status: 401, reason: 'bearer_not_allowed' };
    }
    return checkCookieOriginAndFetchMetadata(request, remoteAddr, guard);
  }

  if (hasAuthorization) {
    if (!hasValidBearer) {
      return { ok: false, status: 401, reason: 'invalid_authorization_header' };
    }
    return { ok: true, credentialMode: 'bearer' };
  }

  return checkCookieOriginAndFetchMetadata(request, remoteAddr, guard);
}
