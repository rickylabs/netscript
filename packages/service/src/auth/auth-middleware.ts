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
import type { AuthnOptions, AuthzOptions } from './options.ts';
import type { ProcedurePolicyResolution, ProcedurePolicyResolver } from './contract-policy.ts';
import type { AuthnRequest, Principal } from './types.ts';

/** Default path prefixes guarded by auth middleware. */
export const DEFAULT_PROTECTED_PREFIXES: readonly string[] = ['/api'];

/** Default path prefixes left public even when auth is enabled. */
export const DEFAULT_ANONYMOUS_PREFIXES: readonly string[] = ['/health'];

const AUTH_LOGGER = createLogger(['netscript', 'service', 'auth']);

/** Authn middleware options with an optional bound contract-policy resolver. */
export interface AuthnMiddlewareOptions extends AuthnOptions {
  /** Shared resolver used to make matched public procedures anonymous. */
  readonly policyResolver?: ProcedurePolicyResolver;
}

/** Creates Hono middleware that authenticates guarded requests. */
export function createAuthnMiddleware(options: AuthnMiddlewareOptions): MiddlewareHandler {
  const guard = normalizeGuard(options);

  return async (c, next) => {
    try {
      const policy = resolvePolicy(options.policyResolver, c);
      if (!requiresAuthentication(c.req.path, guard, policy)) {
        return await next();
      }

      const result = await options.authenticator.authenticate(toAuthnRequest(c));
      if (!result.ok) {
        await logAuthDecision(c, {
          stage: 'authn',
          decision: 'deny',
          reason: result.reason,
        });
        return unauthorized(c, result.reason);
      }

      c.set('principal', result.principal);
      applyAuthnResponse(c, result.responseHeaders, result.setCookies);
      await logAuthDecision(c, {
        stage: 'authn',
        decision: 'allow',
        principal: result.principal,
      });
      return await next();
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'authentication-failed';
      await logAuthDecision(c, {
        stage: 'authn',
        decision: 'deny',
        reason: 'authn.error',
      });
      return unauthorized(c, reason);
    }
  };
}

/** Authz middleware options with internal guard prefixes. */
export interface AuthzMiddlewareOptions extends AuthzOptions {
  /** Path prefixes the authz stage guards. Defaults to `["/api"]`. */
  readonly protect?: readonly string[];
  /** Path prefixes always left public even under a guarded prefix. Defaults to `["/health"]`. */
  readonly allowAnonymous?: readonly string[];
  /** Shared resolver used to recognize matched public procedures before principal lookup. */
  readonly policyResolver?: ProcedurePolicyResolver;
}

/** Creates Hono middleware that authorizes guarded requests. */
export function createAuthzMiddleware(options: AuthzMiddlewareOptions): MiddlewareHandler {
  const guard = normalizeGuard(options);
  const denyByDefault = options.denyByDefault ?? true;

  return async (c, next) => {
    const principal = c.get('principal');
    try {
      const policy = resolvePolicy(options.policyResolver, c);
      if (isPublicProcedure(policy)) {
        return await next();
      }
      if (!policy?.matched && !isGuardedPath(c.req.path, guard)) {
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
      });

      if (!decision.allow) {
        await logAuthDecision(c, {
          stage: 'authz',
          decision: 'deny',
          principal,
          reason: decision.reason,
        });
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
  return resolver?.resolve({ method: c.req.method, path: c.req.path });
}

function requiresAuthentication(
  path: string,
  guard: { readonly protect: readonly string[]; readonly allowAnonymous: readonly string[] },
  resolution: ProcedurePolicyResolution | undefined,
): boolean {
  if (resolution?.matched) {
    return resolution.policy?.authentication !== 'none';
  }
  return isGuardedPath(path, guard);
}

function isPublicProcedure(resolution: ProcedurePolicyResolution | undefined): boolean {
  return resolution?.matched === true && resolution.policy?.authentication === 'none';
}

function normalizeGuard(options: {
  readonly protect?: readonly string[];
  readonly allowAnonymous?: readonly string[];
}): { readonly protect: readonly string[]; readonly allowAnonymous: readonly string[] } {
  return {
    protect: options.protect?.length ? options.protect : DEFAULT_PROTECTED_PREFIXES,
    allowAnonymous: options.allowAnonymous?.length
      ? options.allowAnonymous
      : DEFAULT_ANONYMOUS_PREFIXES,
  };
}

function isGuardedPath(
  path: string,
  guard: { readonly protect: readonly string[]; readonly allowAnonymous: readonly string[] },
): boolean {
  if (guard.allowAnonymous.some((prefix) => matchesPrefix(path, prefix))) {
    return false;
  }
  return guard.protect.some((prefix) => matchesPrefix(path, prefix));
}

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);
}

function toAuthnRequest(c: Context): AuthnRequest {
  return {
    method: c.req.method,
    path: c.req.path,
    header: (name) => c.req.header(name),
    headers: () => new Headers(c.req.raw.headers),
    cookie: (name) => readCookie(c.req.header('cookie'), name),
  };
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
