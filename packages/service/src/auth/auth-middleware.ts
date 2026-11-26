/**
 * Hono middleware that enforces NetScript service authentication and authorization.
 *
 * @example
 * ```ts
 * import {
 *   createService,
 *   type AuthenticatorPort,
 *   type ServiceRouter,
 * } from "@netscript/service";
 *
 * declare const authenticator: AuthenticatorPort;
 * declare const router: ServiceRouter;
 *
 * const service = createService(router, { name: "users" })
 *   .withAuthn({ authenticator });
 * void service;
 * ```
 *
 * @module
 */

import type { Context, MiddlewareHandler } from 'hono';
import { createLogger, type Logger } from '@netscript/logger';
import type { AnonymousRule, AuthnOptions, AuthzOptions } from './options.ts';
import type {
  ProcedurePolicyResolution,
  ProcedurePolicyResolver,
} from './contract/contract-policy.ts';
import {
  getStreamProxyRequestState,
  type StreamProxyRequestState,
} from './contract/stream-request-state.ts';
import type { AuthnRequest, AuthnResult, Principal } from './types.ts';
import { PROCEDURE_ERROR_CODES } from './types.ts';

/** Default path prefixes guarded by auth middleware. */
export const DEFAULT_PROTECTED_PREFIXES: readonly string[] = ['/api'];

/** Default path prefixes left public even when auth is enabled. */
export const DEFAULT_ANONYMOUS_PREFIXES: readonly string[] = ['/health'];

const AUTH_LOGGER = createLogger(['netscript', 'service', 'auth']);

const STREAM_AUTHN_ERROR_VARY = 'Authorization, Cookie, Origin, Sec-Fetch-Site, Sec-Fetch-Dest';

/**
 * Explicitly permitted non-credential request metadata headers forwarded to `withAuthn` on
 * matched stream requests. Every other header (including `x-api-key`, `x-authenticated-*`, and
 * the unselected credential transport) is omitted so authenticators can only authenticate using
 * the pre-selected `credentialMode`.
 */
const STREAM_AUTHN_METADATA_HEADERS: ReadonlySet<string> = new Set([
  'accept',
  'accept-language',
  'forwarded',
  'host',
  'origin',
  'referer',
  'sec-fetch-dest',
  'sec-fetch-mode',
  'sec-fetch-site',
  'traceparent',
  'tracestate',
  'user-agent',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-request-id',
]);

/** Authn middleware options with an optional bound contract-policy resolver. */
export interface AuthnMiddlewareOptions extends AuthnOptions {
  /** Shared resolver used to make matched public procedures anonymous. */
  readonly policyResolver?: ProcedurePolicyResolver;
}

/** Creates Hono middleware that authenticates guarded requests. */
export function createAuthnMiddleware(options: AuthnMiddlewareOptions): MiddlewareHandler {
  const guard = normalizeGuard(options);

  return async (c, next) => {
    const streamState = getStreamProxyRequestState(c.req.raw);
    const policy = resolvePolicy(options.policyResolver, c);
    if (!requiresAuthentication(c, guard, policy, streamState)) {
      return await next();
    }

    let outcome:
      | {
        readonly ok: true;
        readonly principal: Principal;
        readonly raw: AuthnResult;
        readonly responseHeaders?: Readonly<Record<string, string>>;
        readonly setCookies?: readonly string[];
      }
      | { readonly ok: false; readonly reason: string };
    try {
      const result = await options.authenticator.authenticate(toAuthnRequest(c, streamState));
      if (result.ok) {
        outcome = streamState !== undefined
          ? { ok: true, principal: result.principal, raw: result }
          : {
            ok: true,
            principal: result.principal,
            raw: result,
            responseHeaders: result.responseHeaders,
            setCookies: result.setCookies,
          };
      } else {
        outcome = { ok: false, reason: result.reason };
      }
    } catch {
      await logAuthDecision(c, {
        stage: 'authn',
        decision: 'deny',
        reason: 'authn.error',
      });
      return authnUnavailable(c, streamState);
    }

    if (!outcome.ok) {
      await logAuthDecision(c, {
        stage: 'authn',
        decision: 'deny',
        reason: outcome.reason,
      });
      return unauthorized(c, outcome.reason);
    }

    c.set('principal', outcome.principal);
    if (streamState !== undefined) {
      // Hand off the raw AuthnResult without reading `responseHeaders`/`setCookies` outside the
      // stream route wrapper's protected validation boundary (so throwing getters yield 503).
      streamState.authnResult = outcome.raw;
    } else {
      applyAuthnResponse(c, outcome.responseHeaders, outcome.setCookies);
    }
    await logAuthDecision(c, {
      stage: 'authn',
      decision: 'allow',
      principal: outcome.principal,
    });
    return await next();
  };
}

/** Authz middleware options with internal guard prefixes. */
export interface AuthzMiddlewareOptions extends AuthzOptions {
  /** Path prefixes the authz stage guards. Defaults to `["/api"]`. */
  readonly protect?: readonly string[];
  /** Legacy path prefixes or exact requests left public. Defaults to `["/health"]`. */
  readonly allowAnonymous?: readonly AnonymousRule[];
  /** Shared resolver used to recognize matched public procedures before principal lookup. */
  readonly policyResolver?: ProcedurePolicyResolver;
}

/** Creates Hono middleware that authorizes guarded requests. */
export function createAuthzMiddleware(options: AuthzMiddlewareOptions): MiddlewareHandler {
  const guard = normalizeGuard(options);
  const denyByDefault = options.denyByDefault ?? true;

  return async (c, next) => {
    const principal = c.get('principal');
    const streamState = getStreamProxyRequestState(c.req.raw);
    try {
      const policy = resolvePolicy(options.policyResolver, c);
      if (isPublicProcedure(policy) && !streamState?.authenticationRequired) {
        return await next();
      }
      if (!policy?.matched && !streamState?.authenticationRequired && !isGuardedRequest(c, guard)) {
        return await next();
      }

      if (!principal) {
        await logAuthDecision(c, {
          stage: 'authz',
          decision: 'deny',
          reason: 'missing-principal',
        });
        return unauthorized(c, 'missing-principal');
      }

      const decision = await options.authorizer.authorize({
        principal,
        method: c.req.method,
        path: c.req.path,
        rawPath: rawPathname(c),
      });

      if (!decision.allow) {
        await logAuthDecision(c, {
          stage: 'authz',
          decision: 'deny',
          principal,
          reason: decision.reason,
        });
        if (decision.code === PROCEDURE_ERROR_CODES.NOT_FOUND) {
          return c.json({ error: 'NOT_FOUND', message: decision.reason, code: decision.code }, 404);
        }
        if (decision.code === PROCEDURE_ERROR_CODES.RETIRED) {
          return c.json({ error: 'GONE', message: decision.reason, code: decision.code }, 410);
        }
        return forbidden(c, decision.reason);
      }

      await logAuthDecision(c, {
        stage: 'authz',
        decision: 'allow',
        principal,
      });
      return await next();
    } catch {
      await logAuthDecision(c, {
        stage: 'authz',
        decision: 'deny',
        principal,
        reason: 'authz.error',
      });
      return denyByDefault ? forbidden(c, 'authz.error') : await next();
    }
  };
}

function resolvePolicy(
  resolver: ProcedurePolicyResolver | undefined,
  c: Context,
): ProcedurePolicyResolution | undefined {
  return resolver?.resolve({ method: c.req.method, path: rawPathname(c), routePath: c.req.path });
}

/**
 * Returns the undecoded pathname the oRPC handlers match. Hono's `c.req.path` is percent-decoded,
 * and a decoded path can select a different procedure than the one oRPC executes.
 */
function rawPathname(c: Context): string {
  const url = c.req.url;
  const start = url.indexOf('/', url.indexOf('//') + 2);
  if (start < 0) return '/';
  const end = url.slice(start).search(/[?#]/);
  return end < 0 ? url.slice(start) : url.slice(start, start + end);
}

interface RequestGuard {
  readonly protect: readonly string[];
  readonly allowAnonymous: readonly AnonymousRule[];
}

function requiresAuthentication(
  c: Context,
  guard: RequestGuard,
  resolution: ProcedurePolicyResolution | undefined,
  streamState: StreamProxyRequestState | undefined,
): boolean {
  if (streamState !== undefined) {
    return streamState.authenticationRequired;
  }
  if (resolution?.matched) {
    return resolution.policy?.authentication !== 'none';
  }
  return isGuardedRequest(c, guard);
}

function isPublicProcedure(resolution: ProcedurePolicyResolution | undefined): boolean {
  return resolution?.matched === true && resolution.policy?.authentication === 'none';
}

function normalizeGuard(options: {
  readonly protect?: readonly string[];
  readonly allowAnonymous?: readonly AnonymousRule[];
}): RequestGuard {
  return {
    protect: [...(options.protect?.length ? options.protect : DEFAULT_PROTECTED_PREFIXES)],
    allowAnonymous:
      (options.allowAnonymous?.length ? options.allowAnonymous : DEFAULT_ANONYMOUS_PREFIXES).map(
        normalizeAnonymousRule,
      ),
  };
}

function normalizeAnonymousRule(rule: AnonymousRule): AnonymousRule {
  if (typeof rule === 'string') return rule;
  const methods = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'];
  if (!rule || !methods.includes(rule.method)) {
    throw new TypeError(
      `[netscript.service.auth] invalid anonymous request: ${rule?.method} ${rule?.path}: unsupported method`,
    );
  }
  const path = rule.path;
  if (
    typeof path !== 'string' || !path.startsWith('/') || /[%*:{}?#\\\s]/.test(path) ||
    path.includes('//') || (path !== '/' && path.endsWith('/'))
  ) {
    throw new TypeError(
      `[netscript.service.auth] invalid anonymous request: ${rule.method} ${path}: invalid exact path`,
    );
  }
  return { method: rule.method, path };
}

function isGuardedRequest(c: Context, guard: RequestGuard): boolean {
  const path = c.req.path;
  if (
    guard.allowAnonymous.some((rule) =>
      typeof rule === 'string'
        ? matchesPrefix(path, rule)
        : c.req.method === rule.method && rawPathname(c) === rule.path && path === rule.path
    )
  ) {
    return false;
  }
  return guard.protect.some((prefix) => matchesPrefix(path, prefix));
}

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);
}

function toAuthnRequest(
  c: Context,
  streamState: StreamProxyRequestState | undefined,
): AuthnRequest {
  if (streamState !== undefined) {
    const allowedCredentialHeader = streamState.credentialMode === 'bearer'
      ? 'authorization'
      : 'cookie';
    const isAllowedHeader = (name: string): boolean => {
      const lower = name.toLowerCase();
      return lower === allowedCredentialHeader || STREAM_AUTHN_METADATA_HEADERS.has(lower);
    };
    return {
      method: c.req.method,
      path: c.req.path,
      header: (name) => (isAllowedHeader(name) ? c.req.header(name) : undefined),
      headers: () => {
        const scoped = new Headers();
        for (const [name, value] of c.req.raw.headers.entries()) {
          if (isAllowedHeader(name)) {
            scoped.append(name, value);
          }
        }
        return scoped;
      },
      cookie: (name) =>
        streamState.credentialMode === 'cookie'
          ? readCookie(c.req.header('cookie'), name)
          : undefined,
    };
  }
  return {
    method: c.req.method,
    path: c.req.path,
    header: (name) => c.req.header(name),
    headers: () => new Headers(c.req.raw.headers),
    cookie: (name) => readCookie(c.req.header('cookie'), name),
  };
}

function authnUnavailable(
  c: Context,
  streamState: StreamProxyRequestState | undefined,
): Response {
  if (streamState !== undefined) {
    return new Response(
      JSON.stringify({ error: 'SERVICE_UNAVAILABLE', reason: 'authn_unavailable' }),
      {
        status: 503,
        headers: new Headers({
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
          'vary': STREAM_AUTHN_ERROR_VARY,
        }),
      },
    );
  }
  return c.json({
    error: 'SERVICE_UNAVAILABLE',
    message: 'Authentication service unavailable',
  }, 503);
}

function applyAuthnResponse(
  c: Context,
  headers: Readonly<Record<string, string>> | undefined,
  setCookies: readonly string[] | undefined,
): void {
  for (const [name, value] of Object.entries(headers ?? {})) {
    c.header(name, value);
  }
  for (const cookie of setCookies ?? []) {
    c.header('Set-Cookie', cookie, { append: true });
  }
}

function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (rawKey === name) {
      return rawValue.join('=');
    }
  }
  return undefined;
}

function unauthorized(c: Context, message: string): Response {
  return c.json({ error: 'UNAUTHORIZED', message }, 401);
}

function forbidden(c: Context, message: string): Response {
  return c.json({ error: 'FORBIDDEN', message }, 403);
}

async function logAuthDecision(
  c: Context,
  event: {
    readonly stage: 'authn' | 'authz';
    readonly decision: 'allow' | 'deny';
    readonly principal?: Principal;
    readonly reason?: string;
  },
): Promise<void> {
  const logger = readLogger(c);
  const subjectHash = event.principal ? await hashSubject(event.principal.subject) : undefined;
  const fields = {
    stage: event.stage,
    decision: event.decision,
    method: c.req.method,
    path: c.req.path,
    scheme: event.principal?.scheme,
    subjectHash,
    reason: event.reason,
  };
  const message = event.decision === 'allow' ? 'auth decision allow' : 'auth decision deny';

  if (event.decision === 'allow') {
    logger.info(message, fields);
  } else {
    logger.warn(message, fields);
  }
}

function readLogger(c: Context): Logger {
  return c.get('logger') ?? AUTH_LOGGER;
}

async function hashSubject(subject: string): Promise<string> {
  const bytes = new TextEncoder().encode(subject);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
