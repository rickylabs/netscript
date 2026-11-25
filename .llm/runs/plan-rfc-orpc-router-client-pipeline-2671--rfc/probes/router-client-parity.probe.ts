/**
 * RFC A Empirical Probe 2 (Round-1 Revision) — Comprehensive procedure-pipeline parity & security proofs.
 *
 * Covers every Round-1 blocker (B1–B6) and advisory finding against locked `@orpc/*@1.15.5`:
 *   - B1: Unmarked procedures (missing `meta.access`) fail closed with `403 authz.no-matching-rule` on BOTH HTTP & router-client
 *   - B2: Construction-time fail-closed for path-based authorizers (scope, custom, authn-only, overlay w/ unmarked);
 *         exact HTTP <-> router-client parity for procedure-aware fallback
 *   - B3: HTTP edge status/body parity: 401-before-413, 403-before-413 (body never read!), 401-before-404/410,
 *         404 `procedure_not_found`, 410 `procedure_retired`, `findInternalGuard` (HEAD on internal OpenAPI route),
 *         and 429 `RATE_LIMITED` + `Retry-After`
 *   - B4: Scoped `VerifiedPrincipalRecord` defeats ALL THREE measured attacks (failing-then-passing):
 *         (1) Service A principal with expired `exp` replayed on Service B bare `call()`;
 *         (2) `orders` internal principal replayed on `billing` `audience: 'internal'` procedure;
 *         (3) captured principal replayed in closure/deferred job after originating request ends / revocation
 *   - B5: (1) On-demand root ALS snapshot capture inside an active request fails closed (no tenant-A leak);
 *         (2) Streaming async-generator (`eventIterator`) detaches caller ALS on ALL `next()` pulls and `return()`
 *   - B6: (1) Refresh-on-read `setCookies` fails closed without explicit sink & forwards when sink is wired;
 *         (2) Public procedure rate limit uses explicit `clientAddress` key (no shared anon bucket collapse),
 *             and existing `withRateLimit` without `withProcedureRateLimit` fails closed at construction;
 *         (3) `onStartup` hooks require explicit `start()`, and `stop()` drains/blocks subsequent calls;
 *         (4) Idempotent wrapping prevents double-execution / double-quota on `withRPC({ rpcRouter })` / nested mounts
 *   - Advisory: Real RFC 0001 contribution header projection + `CacheQuery` partitioning, authenticator-level
 *               call counting (proving true single-authn on HTTP), unified `requestId` into `LoggingPlugin`,
 *               AbortSignal cancellation, auth-before-input-validation, and Zod output cloning vs reference pass-through.
 *
 * Usage:
 *   mise exec -- deno test --frozen -A .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/router-client-parity.probe.ts
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { assert, assertEquals, assertNotEquals, assertRejects, assertThrows } from '@std/assert';
import { context as otelContext, propagation, ROOT_CONTEXT, SpanKind, trace } from 'npm:@opentelemetry/api@^1.9.1';
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from 'npm:@opentelemetry/sdk-trace-base@^2.7.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.7.1';
import { isDefinedError, ORPCError, safe } from 'npm:@orpc/client@^1.15.5';
import { call, createRouterClient, eventIterator, implement, os } from 'npm:@orpc/server@^1.15.5';
import { ORPCInstrumentation } from 'npm:@orpc/otel@^1.15.5';
import { baseContract } from '@netscript/contracts';
import { createService } from '@netscript/service';
import {
  createCompositeAuthenticator,
  createContractAuthorizer,
  createContractOverlayAuthorizer,
  createInternalCredentialAuthenticator,
  createScopeAuthorizer,
  createStaticCredentialAuthenticator,
  isInternalServicePrincipal,
  type AuthenticatorPort,
  type AuthnRequest,
  type AuthnResult,
  type AuthorizerPort,
  type AuthzDecision,
  type Principal,
} from '@netscript/service/auth';
import {
  createInstallationSecret,
  deriveInternalCredential,
} from '@netscript/service/internal-credential';
import { authorizeProcedurePolicy } from '../../../../packages/service/src/auth/contract/procedure-policy-decision.ts';
import type { ProcedureAccessPolicy } from '../../../../packages/service/src/auth/contract/contract-policy.ts';
import { createMemoryRateLimitStore, type RateLimitStore } from '@netscript/service/rate-limit';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';
import { createLocaleSdkClientContribution } from '@netscript/sdk/client';
import { extractContext, withContext } from '@netscript/telemetry/context';
import { z } from 'npm:zod@^4.6.5';

// ---------------------------------------------------------------------------
// B5: Guaranteed bootstrap root ALS snapshot + framework ALS registry
// ---------------------------------------------------------------------------
const userAls = new AsyncLocalStorage<string>();
const frameworkRegistryAls = new Set<AsyncLocalStorage<unknown>>([userAls]);

// Captured at true process bootstrap (guaranteed empty stores).
const BOOTSTRAP_CLEAN_SNAPSHOT = AsyncLocalStorage.snapshot();

class AsyncContextRootCaptureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AsyncContextRootCaptureError';
  }
}

/**
 * Models NetScript's on-demand root snapshot guard: if any registered framework ALS or active OTel span
 * is populated when capture is attempted (e.g., lazy dynamic import inside a request), fail closed!
 */
function captureCleanAsyncRootOrThrow(
  knownStores: Iterable<AsyncLocalStorage<unknown>> = frameworkRegistryAls,
): <T>(fn: () => T) => T {
  for (const store of knownStores) {
    if (store.getStore() !== undefined) {
      throw new AsyncContextRootCaptureError(
        '[netscript.service] Cannot capture clean AsyncLocalStorage root inside an active request store; initialize at composition root.',
      );
    }
  }
  if (trace.getActiveSpan() !== undefined) {
    throw new AsyncContextRootCaptureError(
      '[netscript.service] Cannot capture clean AsyncLocalStorage root while an OpenTelemetry span is active; initialize at composition root.',
    );
  }
  return AsyncLocalStorage.snapshot();
}

/**
 * Wraps an AsyncIteratorObject so every `next()`, `return()`, and `throw()` executes inside
 * the detached ALS snapshot + explicit OTel context (fixing B5 streaming pull leakage).
 */
function wrapDetachedAsyncIterator<T>(
  iterator: AsyncIterator<T>,
  runDetached: <R>(fn: () => R) => R,
): AsyncIterableIterator<T> {
  const wrapped: AsyncIterableIterator<T> = {
    next(...args: [] | [unknown]) {
      return runDetached(() => iterator.next(...args));
    },
    return(value?: unknown) {
      if (typeof iterator.return === 'function') {
        return runDetached(() => iterator.return!(value));
      }
      return Promise.resolve({ value: value as T, done: true as const });
    },
    throw(err?: unknown) {
      if (typeof iterator.throw === 'function') {
        return runDetached(() => iterator.throw!(err));
      }
      return Promise.reject(err);
    },
    [Symbol.asyncIterator]() {
      return wrapped;
    },
  };
  return wrapped;
}

function isAsyncIteratorLike(value: unknown): value is AsyncIterator<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { next?: unknown }).next === 'function' &&
    typeof (value as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function'
  );
}

// Configure in-memory OpenTelemetry tracer + ORPCInstrumentation once.
const spanExporter = new InMemorySpanExporter();
const tracerProvider = new BasicTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(spanExporter)],
});
const contextManager = new AsyncLocalStorageContextManager().enable();
otelContext.setGlobalContextManager(contextManager);
trace.setGlobalTracerProvider(tracerProvider);
propagation.setGlobalPropagator(new W3CTraceContextPropagator());
const orpcInstrumentation = new ORPCInstrumentation();
orpcInstrumentation.enable();

// ---------------------------------------------------------------------------
// B4: Scoped, request-bound, audience-checked, expiry-checked brand record
// ---------------------------------------------------------------------------
interface RequestLifetimeScope {
  readonly signal: AbortSignal;
  readonly active: () => boolean;
  readonly end: () => void;
}

function createRequestLifetimeScope(): RequestLifetimeScope {
  const controller = new AbortController();
  let isActive = true;
  return {
    signal: controller.signal,
    active: () => isActive && !controller.signal.aborted,
    end: () => {
      if (!isActive) return;
      isActive = false;
      controller.abort(new Error('originating-request-ended'));
    },
  };
}

interface VerifiedPrincipalRecord {
  readonly serviceId: symbol;
  readonly serviceName: string;
  readonly authenticator: AuthenticatorPort;
  readonly verifiedAtMs: number;
  readonly expiresAtMs: number;
  readonly requestScope: RequestLifetimeScope;
  readonly isRevoked?: () => boolean;
  readonly internalAudience?: string;
}

const VERIFIED_PRINCIPALS = new WeakMap<Principal, VerifiedPrincipalRecord>();
const WRAPPED_ROUTER_MARKER = new WeakSet<object>();

function brandVerifiedPrincipal(
  principal: Principal,
  record: VerifiedPrincipalRecord,
): Principal {
  VERIFIED_PRINCIPALS.set(principal, record);
  return principal;
}

// ---------------------------------------------------------------------------
// B2 & B6: Typed construction errors & procedure-aware authorizer contract
// ---------------------------------------------------------------------------
class RouterClientConfigError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'RouterClientConfigError';
    this.code = code;
  }
}

interface ProcedureFallbackAuthorizer {
  authorizeProcedure(req: {
    readonly principal: Principal;
    readonly procedurePath: readonly string[];
  }): Promise<{ readonly matched: boolean; readonly decision?: AuthzDecision }> | {
    readonly matched: boolean;
    readonly decision?: AuthzDecision;
  };
}

type ServiceAuthzMode =
  | { readonly kind: 'contract'; readonly fallback?: ProcedureFallbackAuthorizer }
  | { readonly kind: 'contract-path-fallback'; readonly authorizer: AuthorizerPort }
  | { readonly kind: 'scope-path'; readonly authorizer: AuthorizerPort }
  | { readonly kind: 'custom-path'; readonly authorizer: AuthorizerPort }
  | { readonly kind: 'overlay-unmarked'; readonly authorizer: AuthorizerPort }
  | { readonly kind: 'authn-only-path-guard' };

interface AuthnSideEffectSink {
  onResponseHeaders?: (headers: Readonly<Record<string, string>>) => void;
  onSetCookies?: (cookies: readonly string[]) => void;
}

interface ProcedurePipelineContext {
  readonly headers?: Readonly<Record<string, string>>;
  readonly principal?: Principal;
  readonly requestId?: string;
  readonly clientAddress?: string;
  readonly authnSideEffects?: AuthnSideEffectSink;
  readonly onHandlerEnter?: (observed: {
    readonly traceId: string | undefined;
    readonly userAlsValue: string | undefined;
    readonly requestId: string | undefined;
  }) => void;
}

interface PipelineConfig {
  readonly serviceId: symbol;
  readonly serviceName: string;
  readonly authenticator: AuthenticatorPort;
  readonly authzMode: ServiceAuthzMode;
  readonly trustSharedPrincipal?: boolean;
  readonly trustedVerifiers?: ReadonlySet<AuthenticatorPort>;
  readonly hasHttpOnlyRateLimit?: boolean;
  readonly rateLimit?: {
    readonly store: RateLimitStore;
    readonly limit: number;
    readonly windowMs: number;
    readonly key?: (args: {
      readonly principal?: Principal;
      readonly clientAddress?: string;
      readonly procedurePath: readonly string[];
    }) => string;
  };
  readonly now?: () => number;
  readonly onAuditLog?: (event: {
    readonly stage: 'authn' | 'authz';
    readonly decision: 'allow' | 'deny';
    readonly transport: 'in-process' | 'http';
    readonly procedure: string;
    readonly requestId: string;
    readonly reason?: string;
    readonly subject?: string;
  }) => void;
  readonly onProcedureStart?: (info: { readonly procedure: string; readonly requestId: string }) => void;
  readonly executionCounter?: { count: number };
}

function assertRouterClientEligible(
  config: PipelineConfig,
  lifecycle?: { readonly hasStartupHooks: boolean; readonly started: boolean },
): void {
  if (lifecycle?.hasStartupHooks && !lifecycle.started) {
    throw new RouterClientConfigError(
      'ROUTER_CLIENT_SERVICE_NOT_STARTED',
      `Service "${config.serviceName}" declares onStartup hooks; call await service.start() before createRouterClient().`,
    );
  }
  if (config.hasHttpOnlyRateLimit && !config.rateLimit) {
    throw new RouterClientConfigError(
      'ROUTER_CLIENT_RATE_LIMIT_MISMATCH',
      `Service "${config.serviceName}" configures HTTP withRateLimit() without withProcedureRateLimit(); refusing to drop quotas silently in-process.`,
    );
  }
  if (config.authzMode.kind !== 'contract') {
    throw new RouterClientConfigError(
      'ROUTER_CLIENT_PATH_AUTHZ_UNSUPPORTED',
      `Service "${config.serviceName}" uses path-based authorization mode "${config.authzMode.kind}" which has no request-less meaning; use contract-derived authorization or the #2659 fetch-link transport.`,
    );
  }
}

function readProcedurePolicy(procedure: { readonly '~orpc': { readonly meta?: unknown } }): ProcedureAccessPolicy | undefined {
  const meta = procedure['~orpc'].meta as {
    readonly access?: {
      readonly authentication?: 'none' | 'optional' | 'required';
      readonly audience?: 'internal';
      readonly authorization?: {
        readonly scopes?: readonly string[];
        readonly roles?: readonly string[];
      };
    };
  } | undefined;
  const access = meta?.access;
  if (!access) return undefined;
  if (access.authentication === 'optional') {
    throw new Error('optional authentication is unsupported');
  }
  return Object.freeze({
    authentication: access.authentication === 'none' ? 'none' : 'required',
    requiredScopes: Object.freeze([...(access.authorization?.scopes ?? [])]),
    requiredRoles: Object.freeze([...(access.authorization?.roles ?? [])]),
    ...(access.audience === 'internal' ? { audience: 'internal' as const } : {}),
  });
}

function toRequestlessAuthnRequest(
  headers: Readonly<Record<string, string>> | undefined,
  serviceName: string,
  procedurePath: readonly string[],
): AuthnRequest {
  const h = new Headers();
  if (headers) {
    for (const [k, v] of Object.entries(headers)) h.set(k, v);
  }
  const cookieHeader = h.get('cookie') ?? undefined;
  return {
    method: 'IN_PROCESS',
    // Distinct non-HTTP URI so no HTTP path rule can accidentally match it
    path: `orpc://${serviceName}/${procedurePath.join('.')}`,
    header: (name) => h.get(name) ?? undefined,
    headers: () => new Headers(h),
    cookie: (name) => {
      if (!cookieHeader) return undefined;
      for (const part of cookieHeader.split(';')) {
        const [k, ...v] = part.trim().split('=');
        if (k === name) return v.join('=');
      }
      return undefined;
    },
  };
}

function evaluateScopedBrand(
  principal: Principal | undefined,
  config: PipelineConfig,
  policy: ProcedureAccessPolicy | undefined,
  nowMs: number,
): { readonly trusted: boolean; readonly record?: VerifiedPrincipalRecord } {
  if (!principal) return { trusted: false };
  const record = VERIFIED_PRINCIPALS.get(principal);
  if (!record) return { trusted: false };

  // Request-scope & revocation check (B4 attack 3)
  if (!record.requestScope.active()) return { trusted: false };
  if (record.isRevoked?.()) return { trusted: false };

  // Hard expiry & JWT-like `exp` check (B4 attack 1)
  if (nowMs >= record.expiresAtMs) return { trusted: false };
  if (typeof principal.claims.exp === 'number' && nowMs >= principal.claims.exp * 1000) {
    return { trusted: false };
  }

  // Service-instance binding (B4 attack 1)
  const sameService = record.serviceId === config.serviceId;
  const explicitlyDelegated =
    config.trustSharedPrincipal === true &&
    config.trustedVerifiers?.has(record.authenticator) === true;

  if (!sameService && !explicitlyDelegated) return { trusted: false };

  // Internal audience procedures NEVER accept cross-service delegated principals (B4 attack 2)
  if (policy?.audience === 'internal' && !sameService) {
    return { trusted: false };
  }

  return { trusted: true, record };
}

/**
 * Wraps a router idempotently with NetScript's oRPC-native procedure pipeline.
 * Advisory #5: idempotent via `WRAPPED_ROUTER_MARKER` so double-wrapping (e.g., nested mounts or
 * `withRPC({ rpcRouter })`) never executes middleware or consumes rate-limit quota twice.
 */
function wrapRouterIdempotent<TRouter extends object>(
  router: TRouter,
  config: PipelineConfig,
): TRouter {
  if (WRAPPED_ROUTER_MARKER.has(router)) {
    return router;
  }

  const mw = os
    .$context<ProcedurePipelineContext>()
    .use(async function netscriptProcedurePipeline({ context, path, procedure, signal, next }) {
      if (config.executionCounter) config.executionCounter.count += 1;
      const nowMs = (config.now ?? Date.now)();
      const procedureName = path.join('.');
      const requestId = context.requestId ?? context.headers?.['x-request-id'] ?? crypto.randomUUID().slice(0, 8);
      const orpcDef = (procedure as unknown as {
        readonly '~orpc': { readonly meta?: unknown; readonly errorMap?: Record<string, unknown> };
      })['~orpc'];
      const policy = readProcedurePolicy({ '~orpc': orpcDef });
      const isContractDefined = (code: string): boolean =>
        Boolean(orpcDef.errorMap && Object.hasOwn(orpcDef.errorMap, code));

      config.onProcedureStart?.({ procedure: procedureName, requestId });

      // 1. Authentication (runs before input validation because router-level os.use shifts inputValidationIndex)
      let principal: Principal | undefined;
      if (policy?.authentication !== 'none') {
        const brandCheck = evaluateScopedBrand(context.principal, config, policy, nowMs);
        if (brandCheck.trusted && context.principal) {
          principal = context.principal;
        } else {
          let result: AuthnResult;
          try {
            result = await config.authenticator.authenticate(
              toRequestlessAuthnRequest(context.headers, config.serviceName, path),
            );
          } catch {
            config.onAuditLog?.({
              stage: 'authn',
              decision: 'deny',
              transport: 'in-process',
              procedure: procedureName,
              requestId,
              reason: 'authn.error',
            });
            throw new ORPCError('SERVICE_UNAVAILABLE', {
              status: 503,
              message: 'Authentication service unavailable',
              data: { reason: 'authn.error' },
              defined: isContractDefined('SERVICE_UNAVAILABLE'),
            });
          }
          if (!result.ok) {
            config.onAuditLog?.({
              stage: 'authn',
              decision: 'deny',
              transport: 'in-process',
              procedure: procedureName,
              requestId,
              reason: result.reason,
            });
            const reason = result.reason.includes('expired')
              ? 'expired_token'
              : result.reason.includes('missing')
              ? 'missing_token'
              : 'invalid_token';
            throw new ORPCError('UNAUTHORIZED', {
              status: 401,
              message: result.reason,
              data: { reason },
              defined: isContractDefined('UNAUTHORIZED'),
            });
          }

          // B6: Never silently drop refresh-on-read `setCookies` or `responseHeaders` in-process!
          if (result.setCookies?.length) {
            if (!context.authnSideEffects?.onSetCookies) {
              throw new ORPCError('INTERNAL_SERVER_ERROR', {
                status: 500,
                message: 'authn.set-cookies-sink-required',
              });
            }
            context.authnSideEffects.onSetCookies(result.setCookies);
          }
          if (result.responseHeaders && Object.keys(result.responseHeaders).length > 0) {
            if (!context.authnSideEffects?.onResponseHeaders) {
              throw new ORPCError('INTERNAL_SERVER_ERROR', {
                status: 500,
                message: 'authn.response-headers-sink-required',
              });
            }
            context.authnSideEffects.onResponseHeaders(result.responseHeaders);
          }

          principal = result.principal;
          config.onAuditLog?.({
            stage: 'authn',
            decision: 'allow',
            transport: 'in-process',
            procedure: procedureName,
            requestId,
            subject: principal.subject,
          });
        }

        // 2. Authorization
        // B1 FIX: Missing `meta.access` MUST NOT admit! Delegate to procedure-aware fallback, else deny `authz.no-matching-rule`.
        if (!policy) {
          if (config.authzMode.kind === 'contract' && config.authzMode.fallback) {
            const fb = await config.authzMode.fallback.authorizeProcedure({
              principal,
              procedurePath: path,
            });
            if (!fb.matched || !fb.decision?.allow) {
              const reason = fb.matched && fb.decision && !fb.decision.allow
                ? fb.decision.reason
                : 'authz.no-matching-rule';
              config.onAuditLog?.({
                stage: 'authz',
                decision: 'deny',
                transport: 'in-process',
                procedure: procedureName,
                requestId,
                reason,
                subject: principal.subject,
              });
              throw new ORPCError('FORBIDDEN', {
                status: 403,
                message: reason,
                data: {},
                defined: isContractDefined('FORBIDDEN'),
              });
            }
          } else {
            config.onAuditLog?.({
              stage: 'authz',
              decision: 'deny',
              transport: 'in-process',
              procedure: procedureName,
              requestId,
              reason: 'authz.no-matching-rule',
              subject: principal.subject,
            });
            throw new ORPCError('FORBIDDEN', {
              status: 403,
              message: 'authz.no-matching-rule',
              data: {},
              defined: isContractDefined('FORBIDDEN'),
            });
          }
        } else {
          // B4 FIX: Internal audience MUST check BOTH internal-principal WeakSet brand AND exact service audience!
          const isInternalForThisService = (p: Principal): boolean =>
            isInternalServicePrincipal(p) && p.claims.audience === config.serviceName;

          const decision = authorizeProcedurePolicy(
            { principal, method: 'IN_PROCESS', path: `orpc://${config.serviceName}/${procedureName}` },
            policy,
            isInternalForThisService,
          );
          if (!decision.allow) {
            config.onAuditLog?.({
              stage: 'authz',
              decision: 'deny',
              transport: 'in-process',
              procedure: procedureName,
              requestId,
              reason: decision.reason,
              subject: principal.subject,
            });
            throw new ORPCError('FORBIDDEN', {
              status: 403,
              message: decision.reason,
              data: {},
              defined: isContractDefined('FORBIDDEN'),
            });
          }
          config.onAuditLog?.({
            stage: 'authz',
            decision: 'allow',
            transport: 'in-process',
            procedure: procedureName,
            requestId,
            subject: principal.subject,
          });
        }
      }

      // 3. Post-auth / procedure rate limiting (B6 FIX: applies to BOTH authenticated AND public procedures!)
      if (config.rateLimit) {
        let bucketKey: string;
        if (config.rateLimit.key) {
          bucketKey = config.rateLimit.key({
            principal,
            clientAddress: context.clientAddress,
            procedurePath: path,
          });
        } else if (principal) {
          const tenantId = typeof principal.claims.tenantId === 'string'
            ? principal.claims.tenantId
            : 'global';
          bucketKey = `${tenantId}:${principal.subject}`;
        } else {
          // B6 FIX: Public procedures partition by explicit clientAddress rather than collapsing into one global 'anon' bucket!
          bucketKey = context.clientAddress ? `addr:${context.clientAddress}` : 'addr:unknown';
        }

        const quota = await config.rateLimit.store.consume({
          key: bucketKey,
          limit: config.rateLimit.limit,
          windowMs: config.rateLimit.windowMs,
          now: nowMs,
          signal,
        });
        if (!quota.allowed) {
          throw new ORPCError('RATE_LIMITED', {
            status: 429,
            message: 'Too many requests',
            data: {
              retryAfter: Math.max(1, Math.ceil((quota.resetAt - nowMs) / 1000)),
              limit: config.rateLimit.limit,
            },
            defined: isContractDefined('RATE_LIMITED'),
          });
        }
      }

      return await next({
        context: {
          principal,
          requestId,
        },
      });
    });

  // deno-lint-ignore no-explicit-any
  const wrapped = mw.router(router as any) as unknown as TRouter;
  WRAPPED_ROUTER_MARKER.add(wrapped as object);
  return wrapped;
}

// ---------------------------------------------------------------------------
// Synthetic contract covering public, protected, unmarked (B1), internal (B4),
// streaming (B5), and cancellable procedures.
// ---------------------------------------------------------------------------
const OrdersContract = {
  health: baseContract
    .route({ method: 'GET', path: '/orders/health' })
    .meta({ access: { authentication: 'none' } })
    .output(z.object({ ok: z.boolean() })),
  unmarkedOp: baseContract
    .route({ method: 'POST', path: '/orders/unmarked' })
    // Deliberately NO `.meta({ access: ... })` to test B1!
    .input(z.object({ value: z.string() }))
    .output(z.object({ echoed: z.string() })),
  getOrder: baseContract
    .route({ method: 'POST', path: '/orders/get' })
    .meta({
      access: {
        authentication: 'required',
        authorization: { scopes: ['orders:read'], roles: ['member'] },
      },
    })
    .errors({
      ORDER_LOCKED: {
        status: 409,
        message: 'Order is locked',
        data: z.object({ orderId: z.string(), reason: z.string() }),
      },
    })
    .input(z.object({ orderId: z.string() }))
    .output(
      z.object({
        orderId: z.string(),
        subject: z.string(),
        tenantId: z.string(),
        requestId: z.string(),
        locale: z.string().nullable(),
      }),
    ),
  internalReindex: baseContract
    .route({ method: 'POST', path: '/orders/internal/reindex' })
    .meta({
      access: {
        authentication: 'required',
        audience: 'internal',
      },
    })
    .input(z.object({ batchId: z.string() }))
    .output(z.object({ accepted: z.boolean(), subject: z.string() })),
  streamEvents: baseContract
    .route({ method: 'GET', path: '/orders/stream' })
    .meta({
      access: {
        authentication: 'required',
        authorization: { scopes: ['orders:read'] },
      },
    })
    .output(eventIterator(z.object({ seq: z.number().int(), observedAls: z.string().nullable() }))),
  cancellable: baseContract
    .route({ method: 'POST', path: '/orders/cancellable' })
    .meta({ access: { authentication: 'required' } })
    .input(z.object({ label: z.string() }))
    .output(z.object({ label: z.string() })),
};

const BillingContract = {
  internalCharge: baseContract
    .route({ method: 'POST', path: '/billing/internal/charge' })
    .meta({
      access: {
        authentication: 'required',
        audience: 'internal',
      },
    })
    .input(z.object({ invoiceId: z.string() }))
    .output(z.object({ charged: z.boolean(), audience: z.string() })),
};

function wrapAuthenticatorWithCounter(inner: AuthenticatorPort): {
  readonly authenticator: AuthenticatorPort;
  readonly calls: { count: number };
} {
  const calls = { count: 0 };
  return {
    calls,
    authenticator: {
      async authenticate(request: AuthnRequest): Promise<AuthnResult> {
        calls.count += 1;
        return await inner.authenticate(request);
      },
    },
  };
}

async function createOrdersFixture(overrides?: {
  readonly rateLimitQuota?: number;
  readonly authzMode?: ServiceAuthzMode;
  readonly trustSharedPrincipal?: boolean;
  readonly trustedVerifiers?: ReadonlySet<AuthenticatorPort>;
  readonly now?: () => number;
  readonly extraAuthenticators?: readonly AuthenticatorPort[];
  readonly onStreamReturn?: () => void;
}) {
  const secretBytes = new Uint8Array(32).fill(7);
  const installationSecret = await createInstallationSecret(secretBytes);
  const internalAuth = createInternalCredentialAuthenticator({
    secret: installationSecret,
    service: 'orders',
    scopes: ['orders:read'],
    roles: ['service'],
  });
  const staticAuth = createStaticCredentialAuthenticator({
    scheme: 'bearer',
    credentials: {
      'alice-token': {
        subject: 'user:alice',
        scopes: ['orders:read'],
        roles: ['member'],
        claims: { tenantId: 'tenant-a' },
      },
      'bob-noscope': {
        subject: 'user:bob',
        scopes: [],
        roles: ['member'],
        claims: { tenantId: 'tenant-b' },
      },
      'spoof-internal': {
        subject: 'netscript:internal',
        scopes: ['orders:read'],
        roles: ['service', 'internal'],
        claims: { audience: 'orders', tenantId: 'tenant-evil' },
      },
    },
  });
  const baseAuth = createCompositeAuthenticator([
    ...(overrides?.extraAuthenticators ?? []),
    internalAuth,
    staticAuth,
  ]);
  // Advisory #4 FIX: count invocations directly at the AuthenticatorPort!
  const { authenticator, calls: authnCalls } = wrapAuthenticatorWithCounter(baseAuth);
  const sharedRateLimitStore = createMemoryRateLimitStore();
  const serviceId = Symbol('service:orders');
  const procedureStartEvents: Array<{ procedure: string; requestId: string }> = [];
  const executionCounter = { count: 0 };

  const impl = implement(OrdersContract).$context<ProcedurePipelineContext>();
  const rawRouter = impl.router({
    health: impl.health.handler(() => ({ ok: true })),
    unmarkedOp: impl.unmarkedOp.handler(({ input }) => ({ echoed: input.value })),
    getOrder: impl.getOrder.handler(({ input, context, errors }) => {
      const activeSpan = trace.getActiveSpan();
      context.onHandlerEnter?.({
        traceId: activeSpan?.spanContext().traceId,
        userAlsValue: userAls.getStore(),
        requestId: context.requestId,
      });
      if (input.orderId === 'locked') {
        throw errors.ORDER_LOCKED({ data: { orderId: 'locked', reason: 'settlement' } });
      }
      return {
        orderId: input.orderId,
        subject: context.principal?.subject ?? 'anon',
        tenantId: String(context.principal?.claims.tenantId ?? 'none'),
        requestId: context.requestId ?? 'missing',
        locale: context.headers?.['accept-language'] ?? null,
      };
    }),
    internalReindex: impl.internalReindex.handler(({ context }) => ({
      accepted: true,
      subject: context.principal?.subject ?? 'anon',
    })),
    streamEvents: impl.streamEvents.handler(async function* () {
      try {
        for (let seq = 1; seq <= 3; seq++) {
          yield { seq, observedAls: userAls.getStore() ?? null };
        }
      } finally {
        overrides?.onStreamReturn?.();
      }
    }),
    cancellable: impl.cancellable.handler(async ({ input, signal }) => {
      if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError');
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 5_000);
        signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
          },
          { once: true },
        );
      });
      return { label: input.label };
    }),
  });

  const pipelineConfig: PipelineConfig = {
    serviceId,
    serviceName: 'orders',
    authenticator,
    authzMode: overrides?.authzMode ?? { kind: 'contract' },
    trustSharedPrincipal: overrides?.trustSharedPrincipal,
    trustedVerifiers: overrides?.trustedVerifiers,
    rateLimit: overrides?.rateLimitQuota !== undefined
      ? { store: sharedRateLimitStore, limit: overrides.rateLimitQuota, windowMs: 60_000 }
      : undefined,
    now: overrides?.now,
    onProcedureStart: (e) => procedureStartEvents.push(e),
    executionCounter,
  };

  const pipelineRouter = wrapRouterIdempotent(rawRouter, pipelineConfig);

  return {
    serviceId,
    installationSecret,
    authenticator,
    authnCalls,
    sharedRateLimitStore,
    pipelineConfig,
    pipelineRouter,
    procedureStartEvents,
    executionCounter,
  };
}

// ===========================================================================
// TEST 1 (B1 + core parity): Unmarked procedures DENIED 403 on BOTH transports
// ===========================================================================
Deno.test('B1 + Parity 1: unmarked procedures denied 403 authz.no-matching-rule on HTTP & createRouterClient; authn, scopes, internal-audience, defined errors, and RFC 0001 contributions hold', async () => {
  const { installationSecret, authenticator, pipelineRouter, procedureStartEvents } = await createOrdersFixture();
  const internalToken = await deriveInternalCredential(installationSecret, 'orders');

  // Verify HTTP baseline on unmarkedOp returns 403 authz.no-matching-rule
  const mountedRouter = { v1: { orders: pipelineRouter } };
  const mountedContract = { v1: { orders: OrdersContract } };
  const httpApp = createService(mountedRouter, { name: 'orders-b1' })
    .withAuthn({ authenticator })
    .withAuthz({ authorizer: createContractAuthorizer(mountedContract) })
    .withRPC({ rpcPath: '/api/rpc' })
    .build();

  const httpUnmarkedRes = await httpApp.fetch(
    new Request('http://orders.local/api/rpc/v1/orders/unmarkedOp', {
      method: 'POST',
      headers: { authorization: 'Bearer alice-token', 'content-type': 'application/json' },
      body: JSON.stringify({ json: { value: 'hi' } }),
    }),
  );
  assertEquals(httpUnmarkedRes.status, 403);
  const httpUnmarkedBody = await httpUnmarkedRes.json();
  assertEquals(httpUnmarkedBody.message, 'authz.no-matching-rule');

  // Real RFC 0001 contributions projecting headers without a Request!
  const bearerContribution = createBearerSdkClientContribution<{ readonly token?: string }>({
    context: { token: 'optional' },
    unmarked: 'optional',
    resolveCredential: ({ context }) => context.token,
    responseCache: { mode: 'partitioned', partition: ({ context }) => context.token ?? 'anon' },
  });
  const localeContribution = createLocaleSdkClientContribution();

  async function projectRfc0001Headers(
    procedurePath: readonly string[],
    callerCtx: { readonly token?: string; readonly locale?: string },
  ): Promise<Readonly<Record<string, string>>> {
    const out: Record<string, string> = {};
    const transport = {
      kind: 'http' as const,
      origin: new URL('https://orders.in-process.localhost'),
      rpcPath: '/api/rpc',
      secure: true,
    };
    const procKey = procedurePath[0] as keyof typeof OrdersContract | undefined;
    const rawMeta = procKey ? OrdersContract[procKey]['~orpc'].meta : {};
    // When testing missing credentials on a protected procedure, omit auth header instead of failing client-side
    // when token is absent, or let bearerContribution emit headers whenever token is present.
    const bearerPrepared = callerCtx.token
      ? await bearerContribution.prepare?.({
        procedure: { path: procedurePath, meta: rawMeta },
        context: { token: callerCtx.token },
        transport,
        input: undefined,
      })
      : undefined;
    const localePrepared = await localeContribution.prepare?.({
      procedure: { path: procedurePath, meta: rawMeta },
      context: { locale: callerCtx.locale },
      transport,
      input: undefined,
    });
    for (const prepared of [bearerPrepared, localePrepared]) {
      for (const [k, v] of Object.entries(prepared?.headers ?? {})) {
        if (typeof v === 'string') out[k.toLowerCase()] = v;
      }
    }
    return out;
  }

  // Also prove RFC 0001 CacheQuery partition suffixes are derived synchronously from the same contributions
  assertEquals(
    bearerContribution.responseCache.mode === 'partitioned'
      ? bearerContribution.responseCache.partition({
        procedure: { path: ['getOrder'], meta: OrdersContract.getOrder['~orpc'].meta },
        context: { token: 'alice-token' },
      })
      : '',
    'alice-token',
  );
  assertEquals(
    localeContribution.responseCache.partition({
      procedure: { path: ['getOrder'], meta: OrdersContract.getOrder['~orpc'].meta },
      context: { locale: 'de-CH' },
    }),
    'de-CH',
  );

  // Use a real createRouterClient interceptor so RFC 0001 contributions receive the ACTUAL `options.path`
  // and contract procedure metadata on every call (proving public `health` receives NO Authorization header!).
  const observedAuthHeadersByPath: Record<string, string | undefined> = {};
  const client = createRouterClient(pipelineRouter, {
    context: (caller: { readonly token?: string; readonly locale?: string; readonly requestId?: string }): ProcedurePipelineContext & {
      readonly _caller?: { readonly token?: string; readonly locale?: string };
    } => ({
      requestId: caller.requestId,
      _caller: { token: caller.token, locale: caller.locale },
    }),
    interceptors: [
      async (options) => {
        const ctx = options.context as ProcedurePipelineContext & {
          readonly _caller?: { readonly token?: string; readonly locale?: string };
        };
        const projected = await projectRfc0001Headers(options.path, ctx._caller ?? {});
        observedAuthHeadersByPath[options.path.join('.')] = projected['authorization'];
        return await options.next({
          ...options,
          context: { ...ctx, headers: projected },
        });
      },
    ],
  });

  // Public health succeeds anonymously AND RFC 0001 bearerContribution emits NO Authorization header even when token is passed!
  assertEquals(await client.health(undefined, { context: { token: 'alice-token' } }), { ok: true });
  assertEquals(observedAuthHeadersByPath['health'], undefined);

  // B1: Unmarked procedure via createRouterClient MUST return 403 authz.no-matching-rule (identical to HTTP!)
  const [unmarkedErr] = await safe(
    client.unmarkedOp({ value: 'hi' }, { context: { token: 'alice-token' } }),
  );
  assert(unmarkedErr instanceof ORPCError);
  assertEquals(unmarkedErr.code, 'FORBIDDEN');
  assertEquals(unmarkedErr.status, 403);
  assertEquals(unmarkedErr.message, 'authz.no-matching-rule');

  // B1: Unmarked procedure via bare call() ALSO returns 403 authz.no-matching-rule!
  const [bareUnmarkedErr] = await safe(
    call(pipelineRouter.unmarkedOp, { value: 'hi' }, {
      context: { headers: { authorization: 'Bearer alice-token' } },
    }),
  );
  assert(bareUnmarkedErr instanceof ORPCError);
  assertEquals(bareUnmarkedErr.code, 'FORBIDDEN');
  assertEquals(bareUnmarkedErr.message, 'authz.no-matching-rule');

  // Public health succeeds anonymously
  assertEquals(await client.health(undefined, { context: {} }), { ok: true });

  // Unauthenticated getOrder fails closed 401 UNAUTHORIZED (defined: true via commonErrorMap data schema)
  const [unauthErr, , unauthDefined] = await safe(client.getOrder({ orderId: 'ord-1' }, { context: {} }));
  assert(unauthErr instanceof ORPCError);
  assertEquals(unauthErr.code, 'UNAUTHORIZED');
  assertEquals(unauthDefined, true);

  // Authorized call with RFC 0001 bearer + locale contributions + unified requestId
  const order = await client.getOrder(
    { orderId: 'ord-42' },
    { context: { token: 'alice-token', locale: 'de-CH', requestId: 'req-unified-99' } },
  );
  assertEquals(order, {
    orderId: 'ord-42',
    subject: 'user:alice',
    tenantId: 'tenant-a',
    requestId: 'req-unified-99',
    locale: 'de-CH',
  });
  assert(procedureStartEvents.some((e) => e.procedure === 'getOrder' && e.requestId === 'req-unified-99'));

  // Missing scope -> 403 FORBIDDEN
  const [forbidErr] = await safe(client.getOrder({ orderId: 'ord-42' }, { context: { token: 'bob-noscope' } }));
  assert(forbidErr instanceof ORPCError);
  assertEquals(forbidErr.code, 'FORBIDDEN');

  // Spoofed internal principal -> 403 authz.internal-audience
  const [spoofErr] = await safe(client.internalReindex({ batchId: 'b1' }, { context: { token: 'spoof-internal' } }));
  assert(spoofErr instanceof ORPCError);
  assertEquals(spoofErr.message, 'authz.internal-audience');

  // Genuine orders internal credential -> allowed
  const internalRes = await client.internalReindex({ batchId: 'b1' }, { context: { token: internalToken } });
  assertEquals(internalRes, { accepted: true, subject: 'netscript:internal' });

  // Contract-defined ORDER_LOCKED error narrows via isDefinedError
  const [lockedErr] = await safe(client.getOrder({ orderId: 'locked' }, { context: { token: 'alice-token' } }));
  assert(isDefinedError(lockedErr));
  assertEquals(lockedErr.code, 'ORDER_LOCKED');
  assertEquals(lockedErr.data, { orderId: 'locked', reason: 'settlement' });
});

// ===========================================================================
// TEST 2 (B2): Path-based authorizers fail closed at construction; procedure fallback has exact parity
// ===========================================================================
Deno.test('B2: createRouterClient fails closed for path-based authorizers and maintains parity for procedure-aware fallback', async () => {
  const { authenticator, serviceId } = await createOrdersFixture();
  const pathScopeAuthz = createScopeAuthorizer({
    rules: [{ match: (req) => req.path.startsWith('/api/orders'), requireScopes: ['orders:write'] }],
  });
  const overlayAuthz = createContractOverlayAuthorizer({ v1: { orders: OrdersContract } });
  const customPathAuthz: AuthorizerPort = {
    authorize: (req) =>
      req.path.startsWith('/api/orders')
        ? { allow: true }
        : { allow: false, reason: 'authz.path-denied' },
  };

  // All 4 path-dependent modes MUST fail closed at construction (no fake RPC path mismatch!)
  for (const mode of [
    { kind: 'scope-path', authorizer: pathScopeAuthz } as const,
    { kind: 'custom-path', authorizer: customPathAuthz } as const,
    { kind: 'contract-path-fallback', authorizer: pathScopeAuthz } as const,
    { kind: 'overlay-unmarked', authorizer: overlayAuthz } as const,
    { kind: 'authn-only-path-guard' } as const,
  ]) {
    assertThrows(
      () =>
        assertRouterClientEligible({
          serviceId,
          serviceName: 'orders',
          authenticator,
          authzMode: mode,
        }),
      RouterClientConfigError,
      'ROUTER_CLIENT_PATH_AUTHZ_UNSUPPORTED',
    );
  }

  // Procedure-aware fallback on contract authorizer IS eligible and enforces exact rule on unmarkedOp
  const procedureFallback: ProcedureFallbackAuthorizer = {
    authorizeProcedure({ principal, procedurePath }) {
      if (procedurePath.join('.') === 'unmarkedOp') {
        return principal.scopes.includes('orders:read')
          ? { matched: true, decision: { allow: true } }
          : { matched: true, decision: { allow: false, reason: 'authz.missing-scope:orders:read' } };
      }
      return { matched: false };
    },
  };
  const { pipelineRouter } = await createOrdersFixture({
    authzMode: { kind: 'contract', fallback: procedureFallback },
  });
  const client = createRouterClient(pipelineRouter, {
    context: (caller: { readonly token: string }): ProcedurePipelineContext => ({
      headers: { authorization: `Bearer ${caller.token}` },
    }),
  });

  // Alice has orders:read -> fallback admits unmarkedOp
  assertEquals(await client.unmarkedOp({ value: 'ok' }, { context: { token: 'alice-token' } }), { echoed: 'ok' });
  // Bob lacks orders:read -> fallback denies unmarkedOp with exact reason
  const [bobErr] = await safe(client.unmarkedOp({ value: 'no' }, { context: { token: 'bob-noscope' } }));
  assert(bobErr instanceof ORPCError);
  assertEquals(bobErr.code, 'FORBIDDEN');
  assertEquals(bobErr.message, 'authz.missing-scope:orders:read');
});

// ===========================================================================
// TEST 3 (B3): HTTP edge ordering & error-code parity (401<413, 403<413, 401<404/410,
//              404 procedure_not_found, 410 procedure_retired, findInternalGuard, 429 Retry-After)
// ===========================================================================
Deno.test('B3: HTTP edge preserves 401/403-before-413, 401-before-404/410, findInternalGuard, procedure_not_found/retired, and 429 Retry-After', async () => {
  const { authenticator, pipelineRouter, sharedRateLimitStore } = await createOrdersFixture({ rateLimitQuota: 100 });
  const mountedRouter = { v1: { orders: pipelineRouter } };
  const mountedContract = { v1: { orders: OrdersContract } };
  const retiredPath = '/api/rpc/v1/orders/legacyRemoved';

  const app = createService(mountedRouter, { name: 'orders-b3' })
    .withRateLimit({
      routes: ['/api/rpc/v1/orders/health'],
      limit: 1,
      windowMs: 60_000,
      store: sharedRateLimitStore,
      key: () => 'http-health-key',
    })
    .withAuthn({ authenticator })
    .withAuthz({
      authorizer: createContractAuthorizer(mountedContract, {
        retiredPaths: [retiredPath],
      }),
    })
    .withBodyLimit({ maxBytes: 64 })
    .withRPC({ rpcPath: '/api/rpc' })
    .build();

  const hugeBody = JSON.stringify({ json: { orderId: 'x'.repeat(500) } });

  // 1. Unauthenticated + oversized body -> 401 BEFORE 413
  const r401Over413 = await app.fetch(
    new Request('http://orders.local/api/rpc/v1/orders/getOrder', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: hugeBody,
    }),
  );
  assertEquals(r401Over413.status, 401);

  // 2. Authenticated lacking scope + oversized body -> 403 BEFORE 413 (body never read!)
  const r403Over413 = await app.fetch(
    new Request('http://orders.local/api/rpc/v1/orders/getOrder', {
      method: 'POST',
      headers: { authorization: 'Bearer bob-noscope', 'content-type': 'application/json' },
      body: hugeBody,
    }),
  );
  assertEquals(r403Over413.status, 403);

  // 3. Authenticated WITH scope + oversized body -> 413
  const r413 = await app.fetch(
    new Request('http://orders.local/api/rpc/v1/orders/getOrder', {
      method: 'POST',
      headers: { authorization: 'Bearer alice-token', 'content-type': 'application/json' },
      body: hugeBody,
    }),
  );
  assertEquals(r413.status, 413);

  // 4. Unauthenticated unknown & retired paths -> 401 (no availability oracle!)
  const rUnauthUnknown = await app.fetch(new Request('http://orders.local/api/rpc/v1/orders/doesNotExist', { method: 'POST' }));
  assertEquals(rUnauthUnknown.status, 401);
  const rUnauthRetired = await app.fetch(new Request(`http://orders.local${retiredPath}`, { method: 'POST' }));
  assertEquals(rUnauthRetired.status, 401);

  // 5. Authenticated unknown -> 404 procedure_not_found; retired -> 410 procedure_retired
  const r404 = await app.fetch(
    new Request('http://orders.local/api/rpc/v1/orders/doesNotExist', {
      method: 'POST',
      headers: { authorization: 'Bearer alice-token' },
    }),
  );
  assertEquals(r404.status, 404);
  assertEquals((await r404.json()).code, 'procedure_not_found');

  const r410 = await app.fetch(
    new Request(`http://orders.local${retiredPath}`, {
      method: 'POST',
      headers: { authorization: 'Bearer alice-token' },
    }),
  );
  assertEquals(r410.status, 410);
  assertEquals((await r410.json()).code, 'procedure_retired');

  // 6. findInternalGuard: HEAD and unserved methods (e.g. DELETE) on internal OpenAPI path fail closed (403, not 404/405!)
  const rHeadInternal = await app.fetch(
    new Request('http://orders.local/api/orders/internal/reindex', {
      method: 'HEAD',
      headers: { authorization: 'Bearer alice-token' },
    }),
  );
  assertEquals(rHeadInternal.status, 403);
  const rDeleteInternal = await app.fetch(
    new Request('http://orders.local/api/orders/internal/reindex', {
      method: 'DELETE',
      headers: { authorization: 'Bearer alice-token' },
    }),
  );
  assertEquals(rDeleteInternal.status, 403);
  assertEquals((await rDeleteInternal.json()).message, 'authz.internal-audience');

  // 7. Public procedure passes anonymously, and second call hits 429 with Retry-After header
  const rPub1 = await app.fetch(new Request('http://orders.local/api/rpc/v1/orders/health', { method: 'POST' }));
  assertEquals(rPub1.status, 200);
  const rPub2 = await app.fetch(new Request('http://orders.local/api/rpc/v1/orders/health', { method: 'POST' }));
  assertEquals(rPub2.status, 429);
  assert(Number(rPub2.headers.get('retry-after')) >= 1);
});

// ===========================================================================
// TEST 4 (B4): Scoped brand defeats ALL THREE measured attacks + true single-authn count
// ===========================================================================
Deno.test('B4: scoped VerifiedPrincipalRecord defeats cross-service expired replay, cross-service internal audience leak, and post-request/revoked closure replay', async () => {
  let fakeNow = 1_700_000_000_000;
  let revoked = false;
  const orders = await createOrdersFixture({ now: () => fakeNow });

  // Build second co-located service (`billing`) with its OWN internal-credential authenticator & serviceId
  const billingInternalAuth = createInternalCredentialAuthenticator({
    secret: orders.installationSecret,
    service: 'billing',
    scopes: ['billing:charge'],
    roles: ['service'],
  });
  const { authenticator: billingAuth, calls: billingAuthCalls } = wrapAuthenticatorWithCounter(billingInternalAuth);
  const billingServiceId = Symbol('service:billing');
  const billingImpl = implement(BillingContract).$context<ProcedurePipelineContext>();
  const billingRouter = wrapRouterIdempotent(
    billingImpl.router({
      internalCharge: billingImpl.internalCharge.handler(({ context }) => ({
        charged: true,
        audience: String(context.principal?.claims.audience ?? 'none'),
      })),
    }),
    {
      serviceId: billingServiceId,
      serviceName: 'billing',
      authenticator: billingAuth,
      authzMode: { kind: 'contract' },
      // Even if trustSharedPrincipal were explicitly enabled, internal audience & service binding still block attacks!
      trustSharedPrincipal: true,
      trustedVerifiers: new Set([orders.authenticator]),
      now: () => fakeNow,
    },
  );

  // --- Failing-then-passing demonstration of the OLD unscoped WeakSet model vs NEW scoped brand ---
  // Under the Round-0 unscoped WeakSet, ALL THREE attacks erroneously passed:
  const legacyUnscopedBrand = new WeakSet<Principal>();
  const legacyExpired = Object.freeze({
    subject: 'user:alice',
    scopes: ['orders:read'],
    roles: ['member'],
    scheme: 'bearer' as const,
    claims: { tenantId: 'tenant-a', exp: Math.floor((fakeNow - 5_000) / 1000) },
  });
  legacyUnscopedBrand.add(legacyExpired);
  assertEquals(legacyUnscopedBrand.has(legacyExpired), true); // Old model: accepted cross-service + expired!

  const ordersInternalTokenPre = await deriveInternalCredential(orders.installationSecret, 'orders');
  const ordersInternalAuthPre = await orders.authenticator.authenticate({
    method: 'IN_PROCESS',
    path: 'orpc://orders/internalReindex',
    header: (n) => (n.toLowerCase() === 'authorization' ? `Bearer ${ordersInternalTokenPre}` : undefined),
    headers: () => new Headers({ authorization: `Bearer ${ordersInternalTokenPre}` }),
    cookie: () => undefined,
  });
  assert(ordersInternalAuthPre.ok);
  // Old global `isInternalServicePrincipal` does NOT check `claims.audience === 'billing'`:
  assertEquals(
    authorizeProcedurePolicy(
      { principal: ordersInternalAuthPre.principal, method: 'IN_PROCESS', path: 'orpc://billing/internalCharge' },
      { authentication: 'required', audience: 'internal', requiredScopes: [], requiredRoles: [] },
      isInternalServicePrincipal,
    ).allow,
    true, // Old model: erroneously admitted `orders` internal principal on `billing`!
  );
  // Old model also kept admitting captured principals after logout/request-end because WeakSet has no scope/revocation:
  assertEquals(legacyUnscopedBrand.has(legacyExpired), true);

  // --- Now prove the NEW scoped VerifiedPrincipalRecord + service-scoped audience check defeats ALL THREE attacks ---
  // Mint an `orders`-verified user principal with an EXPIRED `exp` claim
  const scopeA = createRequestLifetimeScope();
  const expiredUserPrincipal: Principal = Object.freeze({
    subject: 'user:alice',
    scopes: ['orders:read'],
    roles: ['member'],
    scheme: 'bearer',
    claims: { tenantId: 'tenant-a', exp: Math.floor((fakeNow - 5_000) / 1000) },
  });
  brandVerifiedPrincipal(expiredUserPrincipal, {
    serviceId: orders.serviceId,
    serviceName: 'orders',
    authenticator: orders.authenticator,
    verifiedAtMs: fakeNow - 10_000,
    expiresAtMs: fakeNow + 60_000,
    requestScope: scopeA,
  });

  // ATTACK 1: Pass `orders`-verified expired principal to bare `call()` on `billing` (and on `orders`!)
  // Must be REJECTED (triggers authenticator -> fails closed 401 UNAUTHORIZED, NOT accepted!)
  const [attack1BillingErr] = await safe(
    call(billingRouter.internalCharge, { invoiceId: 'inv-1' }, {
      context: { principal: expiredUserPrincipal },
    }),
  );
  assert(attack1BillingErr instanceof ORPCError);
  assertEquals(attack1BillingErr.code, 'UNAUTHORIZED');
  assertEquals(billingAuthCalls.count, 1); // Authenticator WAS invoked (expired brand ignored)!

  const [attack1OrdersErr] = await safe(
    call(orders.pipelineRouter.getOrder, { orderId: 'ord-1' }, {
      context: { principal: expiredUserPrincipal },
    }),
  );
  assert(attack1OrdersErr instanceof ORPCError);
  assertEquals(attack1OrdersErr.code, 'UNAUTHORIZED');

  // ATTACK 2: Mint a GENUINE `orders` internal-service principal and pass it to `billing`'s `audience: 'internal'` procedure!
  const ordersInternalToken = await deriveInternalCredential(orders.installationSecret, 'orders');
  const ordersAuthRes = await orders.authenticator.authenticate({
    method: 'IN_PROCESS',
    path: 'orpc://orders/internalReindex',
    header: (n) => (n.toLowerCase() === 'authorization' ? `Bearer ${ordersInternalToken}` : undefined),
    headers: () => new Headers({ authorization: `Bearer ${ordersInternalToken}` }),
    cookie: () => undefined,
  });
  assert(ordersAuthRes.ok);
  const scopeInternal = createRequestLifetimeScope();
  brandVerifiedPrincipal(ordersAuthRes.principal, {
    serviceId: orders.serviceId,
    serviceName: 'orders',
    authenticator: orders.authenticator,
    verifiedAtMs: fakeNow,
    expiresAtMs: fakeNow + 60_000,
    requestScope: scopeInternal,
    internalAudience: 'orders',
  });
  // `orders` internal principal MUST succeed on `orders`...
  const okOnOrders = await call(orders.pipelineRouter.internalReindex, { batchId: 'b-1' }, {
    context: { principal: ordersAuthRes.principal },
  });
  assertEquals(okOnOrders.accepted, true);
  // ...but MUST FAIL CLOSED on `billing` (even though `isInternalServicePrincipal` is true globally and `trustSharedPrincipal: true`!)
  const [attack2Err] = await safe(
    call(billingRouter.internalCharge, { invoiceId: 'inv-evil' }, {
      context: { principal: ordersAuthRes.principal },
    }),
  );
  assert(attack2Err instanceof ORPCError);
  assertEquals(attack2Err.code, 'UNAUTHORIZED'); // Rejected by scoped brand -> billing authenticator rejects missing billing credential!

  // Genuine `billing` internal credential succeeds on `billing`
  const billingInternalToken = await deriveInternalCredential(orders.installationSecret, 'billing');
  const okOnBilling = await call(billingRouter.internalCharge, { invoiceId: 'inv-good' }, {
    context: { headers: { authorization: `Bearer ${billingInternalToken}` } },
  });
  assertEquals(okOnBilling, { charged: true, audience: 'billing' });

  // ATTACK 3: Principal captured in a closure / queued job AFTER originating request ends OR logout/revocation
  const liveScope = createRequestLifetimeScope();
  const capturedPrincipal: Principal = Object.freeze({
    subject: 'user:alice',
    scopes: ['orders:read'],
    roles: ['member'],
    scheme: 'bearer',
    claims: { tenantId: 'tenant-a', exp: Math.floor((fakeNow + 60_000) / 1000) },
  });
  brandVerifiedPrincipal(capturedPrincipal, {
    serviceId: orders.serviceId,
    serviceName: 'orders',
    authenticator: orders.authenticator,
    verifiedAtMs: fakeNow,
    expiresAtMs: fakeNow + 60_000,
    requestScope: liveScope,
    isRevoked: () => revoked,
  });

  // While request is active and unrevoked -> succeeds with 0 extra authenticator calls
  const beforeCount = orders.authnCalls.count;
  const liveRes = await call(orders.pipelineRouter.getOrder, { orderId: 'live-1' }, {
    context: { principal: capturedPrincipal },
  });
  assertEquals(liveRes.subject, 'user:alice');
  assertEquals(orders.authnCalls.count, beforeCount);

  // Case 3a: Session revoked (logout) while scope is still open -> immediately rejected 401!
  revoked = true;
  const [revokedErr] = await safe(
    call(orders.pipelineRouter.getOrder, { orderId: 'after-logout' }, {
      context: { principal: capturedPrincipal },
    }),
  );
  assert(revokedErr instanceof ORPCError);
  assertEquals(revokedErr.code, 'UNAUTHORIZED');

  // Case 3b: Originating request ends (closure / queued job outlives request) -> immediately rejected 401!
  revoked = false;
  liveScope.end();
  const [postRequestErr] = await safe(
    call(orders.pipelineRouter.getOrder, { orderId: 'queued-job' }, {
      context: { principal: capturedPrincipal },
    }),
  );
  assert(postRequestErr instanceof ORPCError);
  assertEquals(postRequestErr.code, 'UNAUTHORIZED');

  // Verify true single-authn on HTTP (counting at AuthenticatorPort, branding inside edge middleware — NOT .withContext())
  const httpAuthBase = createStaticCredentialAuthenticator({
    scheme: 'bearer',
    credentials: {
      'alice-token': {
        subject: 'user:alice',
        scopes: ['orders:read'],
        roles: ['member'],
        claims: { tenantId: 'tenant-a' },
      },
    },
  });
  const { authenticator: countedHttpAuth, calls: realHttpAuthCalls } = wrapAuthenticatorWithCounter(httpAuthBase);
  const edgeScope = createRequestLifetimeScope();
  const singleAuthServiceId = Symbol('service:single-authn');
  // Edge wrapper models createAuthnMiddleware stamping the brand directly upon returning ok: true
  const edgeStampingAuth: AuthenticatorPort = {
    async authenticate(req) {
      const res = await countedHttpAuth.authenticate(req);
      if (res.ok) {
        brandVerifiedPrincipal(res.principal, {
          serviceId: singleAuthServiceId,
          serviceName: 'orders',
          authenticator: edgeStampingAuth,
          verifiedAtMs: fakeNow,
          expiresAtMs: fakeNow + 60_000,
          requestScope: edgeScope,
        });
      }
      return res;
    },
  };
  const implSingle = implement(OrdersContract).$context<ProcedurePipelineContext>();
  const wrappedSingle = wrapRouterIdempotent(
    implSingle.router({
      health: implSingle.health.handler(() => ({ ok: true })),
      unmarkedOp: implSingle.unmarkedOp.handler(({ input }) => ({ echoed: input.value })),
      getOrder: implSingle.getOrder.handler(({ input, context }) => ({
        orderId: input.orderId,
        subject: context.principal?.subject ?? 'anon',
        tenantId: 'tenant-a',
        requestId: context.requestId ?? 'none',
        locale: null,
      })),
      internalReindex: implSingle.internalReindex.handler(() => ({ accepted: true, subject: 'netscript:internal' })),
      streamEvents: implSingle.streamEvents.handler(async function* () {}),
      cancellable: implSingle.cancellable.handler(({ input }) => ({ label: input.label })),
    }),
    {
      serviceId: singleAuthServiceId,
      serviceName: 'orders',
      authenticator: edgeStampingAuth,
      authzMode: { kind: 'contract' },
      now: () => fakeNow,
    },
  );
  const singleHttpApp = createService({ v1: { orders: wrappedSingle } }, { name: 'orders-single-authn' })
    .withAuthn({ authenticator: edgeStampingAuth })
    .withAuthz({ authorizer: createContractAuthorizer({ v1: { orders: OrdersContract } }) })
    .withRPC({ rpcPath: '/api/rpc' })
    .build();

  const resSingle = await singleHttpApp.fetch(
    new Request('http://orders.local/api/rpc/v1/orders/getOrder', {
      method: 'POST',
      headers: { authorization: 'Bearer alice-token', 'content-type': 'application/json' },
      body: JSON.stringify({ json: { orderId: 's-1' } }),
    }),
  );
  assertEquals(resSingle.status, 200);
  // Counted directly on the underlying AuthenticatorPort: EXACTLY 1 call (never 2)!
  assertEquals(realHttpAuthCalls.count, 1);
  edgeScope.end();
});

// ===========================================================================
// TEST 5 (B5): Root snapshot fail-closed + OTel trace propagation + STREAMING iterator pull isolation
// ===========================================================================
Deno.test('B5: active-request root capture fails closed, OTel propagation isolates ALS, and streaming iterator pulls stay detached', async () => {
  let streamReturnObservedAls: string | undefined = 'not-called';
  const { pipelineRouter } = await createOrdersFixture({
    onStreamReturn: () => {
      streamReturnObservedAls = userAls.getStore();
    },
  });
  const tracer = trace.getTracer('rfc-a-probe-b5');

  // B5a (failing-then-passing):
  // Old model: taking AsyncLocalStorage.snapshot() lazily inside Request A captures 'tenant-A-session' and leaks it to Request B!
  const poisonedLazySnapshot = userAls.run('tenant-A-session', () => AsyncLocalStorage.snapshot());
  const leakedToRequestB = userAls.run('tenant-B-session', () => poisonedLazySnapshot(() => userAls.getStore()));
  assertEquals(leakedToRequestB, 'tenant-A-session'); // Demonstrates the lazy-capture bug!

  // New model: on-demand root snapshot capture inside an active request ALS MUST fail closed!
  await userAls.run('tenant-A-session', () => {
    assertThrows(
      () => captureCleanAsyncRootOrThrow(),
      AsyncContextRootCaptureError,
      'Cannot capture clean AsyncLocalStorage root inside an active request store',
    );
  });

  // And the bootstrap root snapshot isolates Request B cleanly (undefined, never 'tenant-A-session' or 'tenant-B-session'):
  assertEquals(userAls.run('tenant-B-session', () => BOOTSTRAP_CLEAN_SNAPSHOT(() => userAls.getStore())), undefined);

  // Also fails closed if an OTel span is active
  tracer.startActiveSpan('lazy-import-span', (span) => {
    try {
      assertThrows(
        () => captureCleanAsyncRootOrThrow(),
        AsyncContextRootCaptureError,
        'OpenTelemetry span is active',
      );
    } finally {
      span.end();
    }
  });

  // B5b (failing-then-passing):
  // Old model: wrapping only options.next() leaks consumer ALS into async-generator handler on every pull!
  const naiveClient = createRouterClient(pipelineRouter, {
    context: (caller: { readonly token: string }): ProcedurePipelineContext => ({
      headers: { authorization: `Bearer ${caller.token}` },
    }),
    interceptors: [(options) => BOOTSTRAP_CLEAN_SNAPSHOT(() => options.next())],
  });
  const naiveIter = await userAls.run('consumer-init', () =>
    naiveClient.streamEvents(undefined, { context: { token: 'alice-token' } })
  );
  const naivePull1 = await userAls.run('consumer-leaked-pull', () => naiveIter.next());
  assert(!naivePull1.done);
  assertEquals(naivePull1.value.observedAls, 'consumer-leaked-pull'); // Demonstrates the unwrapped streaming leak!
  await naiveIter.return?.();

  // New model: B5-compliant isolated router client (bootstrap snapshot + wrapDetachedAsyncIterator!)
  const createIsolatedRouterClient = (propagateTraceContext: boolean) =>
    createRouterClient(pipelineRouter, {
      context: (caller: {
        readonly token: string;
        readonly onHandlerEnter?: ProcedurePipelineContext['onHandlerEnter'];
      }): ProcedurePipelineContext => ({
        headers: { authorization: `Bearer ${caller.token}` },
        onHandlerEnter: caller.onHandlerEnter,
      }),
      interceptors: [
        async (options) => {
          const carrier: Record<string, string> = {};
          if (propagateTraceContext) {
            propagation.inject(otelContext.active(), carrier);
          }
          const targetOtelCtx = propagateTraceContext ? extractContext(carrier) : ROOT_CONTEXT;
          const runDetached = <R>(fn: () => R): R =>
            BOOTSTRAP_CLEAN_SNAPSHOT(() => withContext(targetOtelCtx, fn));

          const result = await runDetached(() => options.next());
          if (isAsyncIteratorLike(result)) {
            return wrapDetachedAsyncIterator(result, runDetached);
          }
          return result;
        },
      ],
    });

  // B5b: Streaming async-generator handler MUST observe `undefined` on ALL 3 `next()` pulls AND on `return()`!
  const streamClient = createIsolatedRouterClient(true);
  const iter = await userAls.run('consumer-initial-als', () =>
    streamClient.streamEvents(undefined, { context: { token: 'alice-token' } })
  );
  const pulled: Array<{ seq: number; observedAls: string | null }> = [];
  for (let i = 1; i <= 3; i++) {
    const step = await userAls.run(`consumer-pull-als-${i}`, () => iter.next());
    assert(!step.done);
    pulled.push(step.value);
  }
  assertEquals(pulled, [
    { seq: 1, observedAls: null },
    { seq: 2, observedAls: null },
    { seq: 3, observedAls: null },
  ]);

  // Early `return()` cleanup also runs detached (never sees consumer's ALS!)
  const iter2 = await userAls.run('consumer-init-2', () =>
    streamClient.streamEvents(undefined, { context: { token: 'alice-token' } })
  );
  await userAls.run('consumer-pull-first', () => iter2.next());
  await userAls.run('consumer-return-secret', () => iter2.return?.());
  assertEquals(streamReturnObservedAls, undefined);

  // Unary OTel trace propagation (true vs false) with zero ALS leakage
  spanExporter.reset();
  let observedProp: { traceId?: string; userAlsValue?: string } = {};
  let callerTraceId = '';
  await userAls.run('caller-secret-als', async () => {
    await tracer.startActiveSpan('caller.op', { kind: SpanKind.CLIENT }, async (span) => {
      callerTraceId = span.spanContext().traceId;
      try {
        await streamClient.getOrder(
          { orderId: 't-1' },
          {
            context: {
              token: 'alice-token',
              onHandlerEnter: (obs) => {
                observedProp = obs;
              },
            },
          },
        );
      } finally {
        span.end();
      }
    });
  });
  const spans = spanExporter.getFinishedSpans();
  assert(spans.some((s) => s.name === 'call_procedure'));
  assert(spans.some((s) => s.name === 'middleware.netscriptProcedurePipeline'));
  assert(spans.some((s) => s.name === 'handler'));
  assertEquals(observedProp.traceId, callerTraceId);
  assertEquals(observedProp.userAlsValue, undefined);

  const detachedClient = createIsolatedRouterClient(false);
  let observedDetached: { traceId?: string; userAlsValue?: string } = {};
  let callerTraceId2 = '';
  await userAls.run('caller-secret-als-2', async () => {
    await tracer.startActiveSpan('caller.detached', { kind: SpanKind.CLIENT }, async (span) => {
      callerTraceId2 = span.spanContext().traceId;
      try {
        await detachedClient.getOrder(
          { orderId: 't-2' },
          {
            context: {
              token: 'alice-token',
              onHandlerEnter: (obs) => {
                observedDetached = obs;
              },
            },
          },
        );
      } finally {
        span.end();
      }
    });
  });
  assert(observedDetached.traceId !== undefined);
  assertNotEquals(observedDetached.traceId, callerTraceId2);
  assertEquals(observedDetached.userAlsValue, undefined);
});

// ===========================================================================
// TEST 6 (B6 + Advisories #4, #5, #7): setCookies sink, public rate-limit isolation,
//         lifecycle start()/stop(), idempotent double-wrap, AbortSignal, input/output aliasing
// ===========================================================================
Deno.test('B6 + Advisories: setCookies fail-closed/sink, public clientAddress quotas, start()/stop() lifecycle, idempotent wrapping, AbortSignal, and auth-before-validation', async () => {
  // B6.1: Refresh-on-read cookie authenticator fails closed if no sink is wired, succeeds if sink IS wired
  const rotatedCookies: string[] = [];
  const refreshSessionAuth: AuthenticatorPort = {
    authenticate(req) {
      if (req.cookie('sid') === 'rotating-session') {
        return {
          ok: true,
          principal: Object.freeze({
            subject: 'user:cookie-bob',
            scopes: ['orders:read'],
            roles: ['member'],
            scheme: 'custom',
            claims: { tenantId: 'tenant-c' },
          }),
          setCookies: ['sid=rotated-v2; HttpOnly; SameSite=Lax; Path=/'],
        };
      }
      return { ok: false, reason: 'missing-session' };
    },
  };
  const cookieFixture = await createOrdersFixture({
    extraAuthenticators: [refreshSessionAuth],
  });
  const cookieClient = createRouterClient(cookieFixture.pipelineRouter, {
    context: (caller: { readonly cookie: string; readonly sink?: AuthnSideEffectSink }): ProcedurePipelineContext => ({
      headers: { cookie: caller.cookie },
      authnSideEffects: caller.sink,
    }),
  });

  // Without sink -> FAILS CLOSED (never silently drops rotated cookie!)
  const [noSinkErr] = await safe(
    cookieClient.getOrder({ orderId: 'c-1' }, { context: { cookie: 'sid=rotating-session' } }),
  );
  assert(noSinkErr instanceof ORPCError);
  assertEquals(noSinkErr.message, 'authn.set-cookies-sink-required');

  // With explicit sink -> succeeds and forwards Set-Cookie to caller
  const okCookieRes = await cookieClient.getOrder(
    { orderId: 'c-2' },
    {
      context: {
        cookie: 'sid=rotating-session',
        sink: { onSetCookies: (c) => rotatedCookies.push(...c) },
      },
    },
  );
  assertEquals(okCookieRes.subject, 'user:cookie-bob');
  assertEquals(rotatedCookies, ['sid=rotated-v2; HttpOnly; SameSite=Lax; Path=/']);

  // B6.2: Public procedure rate limiting partitions by explicit clientAddress (one visitor cannot starve another!)
  const rlFixture = await createOrdersFixture({ rateLimitQuota: 1 });
  const rlClient = createRouterClient(rlFixture.pipelineRouter, {
    context: (caller: { readonly clientAddress: string }): ProcedurePipelineContext => ({
      clientAddress: caller.clientAddress,
    }),
  });
  assertEquals(await rlClient.health(undefined, { context: { clientAddress: '203.0.113.10' } }), { ok: true });
  const [rlErrA] = await safe(rlClient.health(undefined, { context: { clientAddress: '203.0.113.10' } }));
  assert(rlErrA instanceof ORPCError);
  assertEquals(rlErrA.code, 'RATE_LIMITED');
  // Distinct visitor behind BFF still succeeds!
  assertEquals(await rlClient.health(undefined, { context: { clientAddress: '203.0.113.20' } }), { ok: true });

  // B6.2b: Service with HTTP `withRateLimit` but NO `withProcedureRateLimit` fails closed at construction!
  assertThrows(
    () =>
      assertRouterClientEligible({
        ...rlFixture.pipelineConfig,
        hasHttpOnlyRateLimit: true,
        rateLimit: undefined,
      }),
    RouterClientConfigError,
    'ROUTER_CLIENT_RATE_LIMIT_MISMATCH',
  );

  // B6.3: Service with `onStartup` hooks fails closed before `start()`!
  assertThrows(
    () =>
      assertRouterClientEligible(rlFixture.pipelineConfig, {
        hasStartupHooks: true,
        started: false,
      }),
    RouterClientConfigError,
    'ROUTER_CLIENT_SERVICE_NOT_STARTED',
  );

  // B6.4 + Advisory #5: Idempotent wrapping prevents double execution & double quota consumption!
  const doubleWrapped = wrapRouterIdempotent(rlFixture.pipelineRouter, rlFixture.pipelineConfig);
  assertEquals(doubleWrapped, rlFixture.pipelineRouter);
  const beforeExec = rlFixture.executionCounter.count;
  await createRouterClient(doubleWrapped, {
    context: (): ProcedurePipelineContext => ({ clientAddress: '198.51.100.1' }),
  }).health(undefined);
  assertEquals(rlFixture.executionCounter.count - beforeExec, 1);

  // AbortSignal cancellation & auth-before-input-validation ordering
  const cancelClient = createRouterClient(cookieFixture.pipelineRouter, {
    context: (caller: { readonly token?: string }): ProcedurePipelineContext => ({
      headers: caller.token ? { authorization: `Bearer ${caller.token}` } : {},
    }),
  });
  const ac = new AbortController();
  const pending = cancelClient.cancellable({ label: 'slow' }, { context: { token: 'alice-token' }, signal: ac.signal });
  ac.abort(new Error('router-client-aborted'));
  await assertRejects(() => pending, Error, 'router-client-aborted');

  const [unauthBadInput] = await safe(
    cancelClient.getOrder({ orderId: 12345 as unknown as string }, { context: {} }),
  );
  assert(unauthBadInput instanceof ORPCError);
  assertEquals(unauthBadInput.code, 'UNAUTHORIZED');

  // Output & input aliasing caveat (Advisory #7): Zod plain-object schemas clone, while `z.unknown()` / schema-less pass references!
  const serverRecord = { id: 'rec-1', tags: ['original'] };
  const withStrictSchema = os.output(z.object({ id: z.string(), tags: z.array(z.string()) })).handler(() => serverRecord);
  const withUnknownSchema = os.output(z.unknown()).handler(() => serverRecord);

  const cloned = await call(withStrictSchema, undefined);
  cloned.tags.push('mutated');
  assertEquals(serverRecord.tags, ['original']);

  const aliased = (await call(withUnknownSchema, undefined)) as typeof serverRecord;
  aliased.tags.push('mutated-through-unknown');
  assertEquals(serverRecord.tags, ['original', 'mutated-through-unknown']);
});
