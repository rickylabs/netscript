/**
 * Package-internal credential selection, Cookie Origin/Fetch-Metadata guard,
 * bounded policy step execution, and decision snapshotting for opt-in
 * authorized `createNetScriptChatStreamProxy`.
 */

import type {
  ServiceProxyTrust,
  StreamEndpointClientAuthMode,
  StreamProxyAuthDecision,
  StreamProxyClockPort,
} from '@netscript/plugin-streams-core/proxy';
import { CHAT_PROXY_VARY_HEADER } from './chat-proxy-headers.ts';

const RFC6750_BEARER_PATTERN = /^Bearer[ \t]+([A-Za-z0-9._~+/-]+=*)$/i;
const VALID_FORWARDED_PROTO = /^(http|https)$/i;
const INVALID_FORWARDED_HOST_PRINTABLE = /[,\s@/?#\\]/;

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

const ERROR_LABELS: Readonly<Record<number, string>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  405: 'METHOD_NOT_ALLOWED',
  500: 'INTERNAL_SERVER_ERROR',
  502: 'BAD_GATEWAY',
};

/** Result of deterministic credential selection and Cookie CSRF/Origin checks. */
export type ChatCredentialGuardResult =
  | { readonly ok: true; readonly credentialMode: 'bearer' | 'cookie' }
  | { readonly ok: false; readonly status: 401 | 403 | 503; readonly reason: string };

function hasInvalidForwardedHostChars(value: string): boolean {
  if (INVALID_FORWARDED_HOST_PRINTABLE.test(value)) return true;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/** Sanitizes a caller-supplied refusal reason into a short non-secret diagnostic code. */
export function sanitizeDiagnosticReason(reason: unknown, fallback: string): string {
  if (typeof reason !== 'string') return fallback;
  const trimmed = reason.trim();
  if (trimmed.length === 0 || trimmed.length > 128) return fallback;
  if (!/^[A-Za-z0-9._:-]+$/.test(trimmed)) return fallback;
  return trimmed;
}

/** Constructs a redacted JSON error response with proxy cache/security headers. */
export function createChatProxyErrorResponse(
  status: number,
  reason: string,
  extraHeaders?: Readonly<Record<string, string>>,
): Response {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'vary': CHAT_PROXY_VARY_HEADER,
  });
  if (extraHeaders) {
    for (const [name, value] of Object.entries(extraHeaders)) {
      headers.set(name, value);
    }
  }
  return new Response(
    JSON.stringify({ error: ERROR_LABELS[status] ?? 'SERVICE_UNAVAILABLE', reason }),
    { status, headers },
  );
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
):
  | { readonly ok: true; readonly origin: string }
  | { readonly ok: false; readonly status: 403 | 503; readonly reason: string } {
  const requestUrl = new URL(request.url);
  if (!trustProxy || !remoteAddr || !('hostname' in remoteAddr)) {
    return { ok: true, origin: requestUrl.origin };
  }
  let trusted = false;
  try {
    trusted = trustProxy(remoteAddr.hostname) === true;
  } catch {
    return { ok: false, status: 503, reason: 'policy_unavailable' };
  }
  if (!trusted) return { ok: true, origin: requestUrl.origin };

  const hasProto = request.headers.has('x-forwarded-proto');
  const hasHost = request.headers.has('x-forwarded-host');
  if (!hasProto && !hasHost) return { ok: true, origin: requestUrl.origin };

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
    if (!origin) return { ok: false, status: 403, reason: 'invalid_forwarded_origin' };
    return { ok: true, origin };
  }

  const combined = URL.parse(`${proto}://${requestUrl.host}`);
  if (!combined) return { ok: false, status: 403, reason: 'invalid_forwarded_origin' };
  return { ok: true, origin: combined.origin };
}

/** Deterministic RFC 6750 credential selection and Cookie Origin/Fetch-Metadata guard. */
export function selectChatCredentialAndGuard(
  request: Request,
  remoteAddr: Deno.Addr | undefined,
  clientAuth: StreamEndpointClientAuthMode,
  allowedOrigins: ReadonlySet<string>,
  trustProxy: ServiceProxyTrust,
): ChatCredentialGuardResult {
  const hasAuthorization = request.headers.has('authorization');
  const authorization = hasAuthorization ? (request.headers.get('authorization') ?? '') : '';
  const hasValidBearer = hasAuthorization && RFC6750_BEARER_PATTERN.test(authorization);

  if (clientAuth === 'bearer') {
    if (!hasAuthorization) return { ok: false, status: 401, reason: 'bearer_required' };
    if (!hasValidBearer) return { ok: false, status: 401, reason: 'invalid_authorization_header' };
    return { ok: true, credentialMode: 'bearer' };
  }
  if (clientAuth === 'cookie') {
    if (hasAuthorization) return { ok: false, status: 401, reason: 'bearer_not_allowed' };
  } else if (hasAuthorization) {
    if (!hasValidBearer) return { ok: false, status: 401, reason: 'invalid_authorization_header' };
    return { ok: true, credentialMode: 'bearer' };
  }

  const target = resolveEffectiveTargetOrigin(request, remoteAddr, trustProxy);
  if (!target.ok) return target;
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
    if (rawOrigin !== effectiveOrigin && !allowedOrigins.has(rawOrigin)) {
      return { ok: false, status: 403, reason: 'cross_site_cookie_denied' };
    }
  }

  if (request.headers.has('sec-fetch-site')) {
    const secFetchSite = (request.headers.get('sec-fetch-site') ?? '').trim().toLowerCase();
    if (secFetchSite === 'same-origin') {
      if (rawOrigin !== null && rawOrigin !== effectiveOrigin) {
        return { ok: false, status: 403, reason: 'cross_site_cookie_denied' };
      }
    } else if (secFetchSite === 'cross-site' || secFetchSite === 'same-site') {
      if (rawOrigin === null || !allowedOrigins.has(rawOrigin)) {
        return { ok: false, status: 403, reason: 'cross_site_cookie_denied' };
      }
    } else if (secFetchSite === 'none') {
      return { ok: false, status: 403, reason: 'direct_navigation_denied' };
    } else {
      return { ok: false, status: 403, reason: 'invalid_fetch_metadata' };
    }
  }

  if (request.headers.has('sec-fetch-dest')) {
    const secFetchDest = (request.headers.get('sec-fetch-dest') ?? '').trim().toLowerCase();
    if (FORBIDDEN_COOKIE_DESTINATIONS.has(secFetchDest)) {
      return { ok: false, status: 403, reason: 'forbidden_fetch_destination' };
    }
  }

  return { ok: true, credentialMode: 'cookie' };
}

/** Single-read exception-safe snapshot of an admission `authorize` decision. */
export function snapshotChatAuthDecision<TGrant>(
  value: unknown,
): StreamProxyAuthDecision<TGrant> | null {
  try {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const allow = Reflect.get(value, 'allow');
    if (allow === true) {
      if (!Object.hasOwn(value, 'grant')) return null;
      const grant = Reflect.get(value, 'grant') as TGrant;
      const expiresAtMs = Reflect.get(value, 'expiresAtMs');
      if (expiresAtMs !== undefined && typeof expiresAtMs !== 'number') return null;
      const responseHeaders = Reflect.get(value, 'responseHeaders') as
        | Readonly<Record<string, string>>
        | undefined;
      const setCookies = Reflect.get(value, 'setCookies') as readonly string[] | undefined;
      return {
        allow: true,
        grant,
        ...(expiresAtMs !== undefined ? { expiresAtMs } : {}),
        ...(responseHeaders !== undefined ? { responseHeaders } : {}),
        ...(setCookies !== undefined ? { setCookies } : {}),
      };
    }
    if (allow === false) {
      const status = Reflect.get(value, 'status');
      const reason = Reflect.get(value, 'reason');
      if ((status === 401 || status === 403) && typeof reason === 'string') {
        return { allow: false, status, reason };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Executes an admission policy hook bounded by `ClockPort` timeout and abort signals. */
export async function runBoundedChatAuthorize<T>(
  clock: StreamProxyClockPort,
  timeoutMs: number,
  requestSignal: AbortSignal,
  shutdownSignal: AbortSignal | undefined,
  fn: (signal: AbortSignal) => T | Promise<T>,
): Promise<
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly kind: 'aborted' | 'timeout' | 'error' }
> {
  const controller = new AbortController();
  let settled = false;
  const onParentAbort = (): void => controller.abort();
  requestSignal.addEventListener('abort', onParentAbort, { once: true });
  shutdownSignal?.addEventListener('abort', onParentAbort, { once: true });

  let cancelTimer: (() => void) | undefined;
  let onAbortRace: (() => void) | undefined;
  try {
    const stepPromise = Promise.resolve().then(() => fn(controller.signal));
    void stepPromise.catch(() => {});

    return await new Promise((resolve) => {
      const finish = (
        result:
          | { readonly ok: true; readonly value: T }
          | { readonly ok: false; readonly kind: 'aborted' | 'timeout' | 'error' },
      ): void => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      onAbortRace = (): void => {
        controller.abort();
        finish({ ok: false, kind: 'aborted' });
      };
      if (requestSignal.aborted || shutdownSignal?.aborted) {
        onAbortRace();
        return;
      }
      requestSignal.addEventListener('abort', onAbortRace, { once: true });
      shutdownSignal?.addEventListener('abort', onAbortRace, { once: true });

      cancelTimer = clock.schedule(timeoutMs, () => {
        controller.abort();
        finish({ ok: false, kind: 'timeout' });
      });

      stepPromise.then(
        (value) => finish({ ok: true, value }),
        () => finish({ ok: false, kind: controller.signal.aborted ? 'aborted' : 'error' }),
      );
    });
  } finally {
    cancelTimer?.();
    requestSignal.removeEventListener('abort', onParentAbort);
    shutdownSignal?.removeEventListener('abort', onParentAbort);
    if (onAbortRace) {
      requestSignal.removeEventListener('abort', onAbortRace);
      shutdownSignal?.removeEventListener('abort', onAbortRace);
    }
  }
}
