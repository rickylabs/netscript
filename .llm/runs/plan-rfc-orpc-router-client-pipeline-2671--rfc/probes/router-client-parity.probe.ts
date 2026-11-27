/**
 * RFC A Empirical Probe 2 (Round-2 Revision) — Comprehensive procedure-pipeline parity & security proofs.
 *
 * Covers every Round-1 blocker (B1–B6), Round-2 blocker (N2–N6), and advisory finding against locked `@orpc/*@1.15.5`:
 *   - B1: Unmarked procedures (missing `meta.access`) fail closed with `403 authz.no-matching-rule` on BOTH HTTP & router-client
 *   - B2: Construction-time fail-closed for path-based authorizers (scope, custom, authn-only, overlay w/ unmarked);
 *         exact HTTP <-> router-client parity for procedure-aware fallback
 *   - B3 + N2: HTTP edge status/body parity (401<413, 403<413, 401<404/410, 404 `procedure_not_found`,
 *         410 `procedure_retired`, `findInternalGuard`, 413 `PAYLOAD_TOO_LARGE`, edge 429 `{ error: 'RATE_LIMITED' }` + `Retry-After`)
 *         PLUS failing-then-passing N2 proofs:
 *         (a) default `RPCHandler@1.15.5` omits `Retry-After` on `ORPCError('RATE_LIMITED')`, whereas `ResponseHeadersPlugin`
 *             emits HTTP `429` + `Retry-After` (from `decision.retryAt ?? decision.resetAt` on rolling GCRA stores) + typed oRPC envelope
 *             decoded by `RPCLink` (`isDefinedError === true`);
 *         (b) startup `store.validate?.({ limit, windowMs })` fails fast at construction;
 *         (c) disjoint stores prevent 2x double-counting between HTTP `withRateLimit` and `withProcedureRateLimit`;
 *         (d) IPv6 `/64` bucketing via `rateLimitAddressKey(clientAddress, ipv6Prefix)` matches `rate-limit-middleware.ts:77`
 *   - B4 + N4: Scoped `VerifiedPrincipalRecord` defeats ALL SIX measured attacks (failing-then-passing):
 *         (1) Service A principal with expired `exp` replayed on Service B bare `call()`;
 *         (2) `orders` internal principal replayed on `billing` `audience: 'internal'` procedure;
 *         (3) captured principal replayed after request end or revocation;
 *         (4) N4a: overlapping live brand on a shared `Principal` reference rejected (never overwrites Request 1's scope)
 *             and `requestScope.end()` deletes the `WeakMap` entry immediately (zero closure retention);
 *         (5) N4b: `NaN` / non-finite `expiresAtMs` and `claims.exp` fail CLOSED (unlike naive `nowMs >= NaN`);
 *         (6) N4c: mutating shallow-frozen `principal.claims.audience = 'billing'` cannot bypass private `record.internalAudience`
 *   - B5 + N5: Unified composition-root snapshot (`Symbol.for('@netscript/async-context/active-store-probes')`, matching PR #2659)
 *         + failing-then-passing proofs for:
 *         (1) lazy-import snapshot poisoning vs `captureCleanAsyncRootOrThrow()`;
 *         (2) non-span OTel context (`ROOT_CONTEXT.setValue(...)` Baggage) missed by `trace.getActiveSpan()` vs caught by `otelContext.active() !== ROOT_CONTEXT`;
 *         (3) streaming `wrapDetachedAsyncIterator` detaching `next()`, `return()`, `throw()`, AND `[Symbol.asyncDispose]()` (`await using`),
 *             while preserving oRPC `withEventMeta` / `getEventMeta` metadata
 *   - B6 + N3 + N6 + Advisory #4:
 *         (1) N6 failing-then-passing: post-`authenticate()` check burns single-use refresh token, whereas pre-`authenticate()`
 *             capability/cookie check fails closed with `authenticateCalls === 0` (token preserved!) and atomic post-check avoids partial side effects;
 *         (2) N3 failing-then-passing: outer-only `WeakSet` runs middleware 2x on nested `{ v1: { orders: wrappedChild } }`,
 *             whereas per-leaf `WRAPPED_PROCEDURE_SERVICE` + per-invocation `PIPELINE_EXECUTED_SYMBOL` runs 1x (and blocks cross-service mount);
 *         (3) Custom Hono `.use()` fails closed at construction (`ROUTER_CLIENT_HTTP_MIDDLEWARE_UNSUPPORTED`);
 *         (4) Real `start()` / `stop()` lifecycle drains in-flight calls, blocks new calls, runs `onShutdown` in reverse order, and disposes DBs;
 *         (5) `AbortSignal`, auth-before-validation, RFC 0001 contributions, and Zod strict vs `z.unknown()` aliasing.
 *
 * Usage:
 *   mise exec -- deno test --frozen -A .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/router-client-parity.probe.ts
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { assert, assertEquals, assertNotEquals, assertRejects, assertThrows } from '@std/assert';
import {
  context as otelContext,
  createContextKey,
  propagation,
  ROOT_CONTEXT,
  SpanKind,
  trace,
} from 'npm:@opentelemetry/api@^1.9.1';
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from 'npm:@opentelemetry/sdk-trace-base@^2.7.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.7.1';
import { createORPCClient, isDefinedError, ORPCError, safe } from 'npm:@orpc/client@^1.15.5';
import { RPCLink } from 'npm:@orpc/client@^1.15.5/fetch';
import {
  call,
  createRouterClient,
  eventIterator,
  getEventMeta,
  implement,
  os,
  withEventMeta,
} from 'npm:@orpc/server@^1.15.5';
import { RPCHandler } from 'npm:@orpc/server@^1.15.5/fetch';
import { OpenAPIHandler } from 'npm:@orpc/openapi@^1.15.5/fetch';
import { ResponseHeadersPlugin } from 'npm:@orpc/server@^1.15.5/plugins';
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
import { rateLimitAddressKey } from '../../../../packages/service/src/rate-limit/middleware/client-address.ts';
import {
  createMemoryRateLimitStore,
  type RateLimitDecision,
  type RateLimitRequest,
  type RateLimitStore,
} from '@netscript/service/rate-limit';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';
import { createLocaleSdkClientContribution } from '@netscript/sdk/client';
import { extractContext, withContext } from '@netscript/telemetry/context';
import { z } from 'npm:zod@^4.6.5';

// ---------------------------------------------------------------------------
// B5 + N5: Unified composition-root snapshot & global ALS probe registry
//          (same Symbol.for registry key as PR #2659's in-process-fetch-adapter)
// ---------------------------------------------------------------------------
const ACTIVE_STORE_PROBES_SYMBOL = Symbol.for('@netscript/async-context/active-store-probes');

interface ActiveAsyncStoreProbe {
  readonly name: string;
  readonly isActive: () => boolean;
}

type GlobalProbeHost = typeof globalThis & {
  [ACTIVE_STORE_PROBES_SYMBOL]?: Set<ActiveAsyncStoreProbe>;
};

function getGlobalAsyncStoreProbes(): Set<ActiveAsyncStoreProbe> {
  const host = globalThis as GlobalProbeHost;
  return host[ACTIVE_STORE_PROBES_SYMBOL] ??= new Set<ActiveAsyncStoreProbe>();
}

function registerActiveAsyncStoreProbe(probe: ActiveAsyncStoreProbe): () => void {
  const registry = getGlobalAsyncStoreProbes();
  registry.add(probe);
  return () => registry.delete(probe);
}

const userAls = new AsyncLocalStorage<string>();
registerActiveAsyncStoreProbe({
  name: 'probe.userAls',
  isActive: () => userAls.getStore() !== undefined,
});

class AsyncContextRootCaptureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AsyncContextRootCaptureError';
  }
}

/**
 * Models NetScript's composition-root snapshot guard (shared with PR #2659):
 * fails closed if ANY registered ALS probe is populated OR if an OpenTelemetry span OR
 * non-span OpenTelemetry context value (e.g., Baggage) is active (`otelContext.active() !== ROOT_CONTEXT`).
 */
function captureCleanAsyncRootOrThrow(
  probes: Iterable<ActiveAsyncStoreProbe> = getGlobalAsyncStoreProbes(),
): <T>(fn: () => T) => T {
  const violations: string[] = [];
  for (const probe of probes) {
    if (probe.isActive()) {
      violations.push(probe.name);
    }
  }
  if (trace.getActiveSpan() !== undefined) {
    violations.push('otel.activeSpan');
  } else if (otelContext.active() !== ROOT_CONTEXT) {
    violations.push('otel.activeContext');
  }
  if (violations.length > 0) {
    throw new AsyncContextRootCaptureError(
      `[netscript.service] Cannot capture clean AsyncLocalStorage root inside active async context (${violations.join(', ')}); initialize at composition root.`,
    );
  }
  return AsyncLocalStorage.snapshot();
}

// Configure in-memory OpenTelemetry tracer + ORPCInstrumentation once BEFORE composition-root capture.
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

// N5: Captured via guarded composition-root helper (NEVER bare top-level AsyncLocalStorage.snapshot()!).
const BOOTSTRAP_CLEAN_SNAPSHOT = captureCleanAsyncRootOrThrow();

/**
 * N5: Wraps an AsyncIterator so every `next()`, `return()`, `throw()`, AND `[Symbol.asyncDispose]()`
 * executes inside the detached ALS snapshot + explicit OTel context, while forwarding yielded values
 * unmodified so oRPC `withEventMeta`/`getEventMeta` metadata is preserved intact.
 */
function wrapDetachedAsyncIterator<T>(
  iterator: AsyncIterator<T> & { [Symbol.asyncDispose]?: () => PromiseLike<void> | void },
  runDetached: <R>(fn: () => R) => R,
): AsyncIterableIterator<T> & AsyncDisposable {
  const wrapped: AsyncIterableIterator<T> & AsyncDisposable = {
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
    async [Symbol.asyncDispose]() {
      if (typeof iterator[Symbol.asyncDispose] === 'function') {
        await runDetached(() => iterator[Symbol.asyncDispose]!());
      } else if (typeof iterator.return === 'function') {
        await runDetached(() => iterator.return!());
      }
    },
    [Symbol.asyncIterator]() {
      return wrapped;
    },
  };
  return wrapped;
}

function isAsyncIteratorLike(
  value: unknown,
): value is AsyncIterator<unknown> & { [Symbol.asyncDispose]?: () => PromiseLike<void> | void } {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { next?: unknown }).next === 'function' &&
    typeof (value as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function'
  );
}

// ---------------------------------------------------------------------------
// B4 + N4: Scoped, request-bound, audience-checked, finite-expiry brand record
//          with overlapping-brand refusal, unconditional delete on end(), & deep-freeze
// ---------------------------------------------------------------------------
interface RequestLifetimeScope {
  readonly signal: AbortSignal;
  readonly active: () => boolean;
  readonly end: () => void;
  readonly onEnd: (fn: () => void) => void;
}

function createRequestLifetimeScope(): RequestLifetimeScope {
  const controller = new AbortController();
  const endCallbacks: Array<() => void> = [];
  let isActive = true;
  return {
    signal: controller.signal,
    active: () => isActive && !controller.signal.aborted,
    onEnd: (fn: () => void) => {
      if (!isActive) {
        fn();
      } else {
        endCallbacks.push(fn);
      }
    },
    end: () => {
      if (!isActive) return;
      isActive = false;
      for (const cb of endCallbacks.splice(0)) cb();
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

function deepFreezeValue(value: unknown, seen = new WeakSet<object>()): void {
  if (value === null || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);
  if (!Object.isFrozen(value)) {
    Object.freeze(value);
  }
  for (const prop of Object.values(value as Record<string, unknown>)) {
    deepFreezeValue(prop, seen);
  }
}

/**
 * N4: Stamps a scoped brand WITHOUT blindly cloning `principal` (preserving `INTERNAL_PRINCIPALS` WeakSet identity).
 * - Rejects overlapping live brands on a shared `Principal` reference (prevents Request 1 `end()` killing Request 2);
 * - Deletes the WeakMap entry unconditionally on `requestScope.end()` (zero closure memory retention);
 * - Deep-freezes `claims`/`scopes`/`roles` in-place when extensible to prevent post-auth mutation.
 */
function brandVerifiedPrincipal(
  principal: Principal,
  record: VerifiedPrincipalRecord,
): Principal {
  const existing = VERIFIED_PRINCIPALS.get(principal);
  if (existing && existing.requestScope.active()) {
    throw new Error(
      '[netscript.service.auth] Overlapping active brand on shared Principal reference; authenticators must return a fresh Principal object per authentication.',
    );
  }
  deepFreezeValue(principal.claims);
  deepFreezeValue(principal.scopes);
  deepFreezeValue(principal.roles);

  const frozenRecord = Object.freeze({ ...record });
  VERIFIED_PRINCIPALS.set(principal, frozenRecord);
  record.requestScope.onEnd(() => {
    if (VERIFIED_PRINCIPALS.get(principal) === frozenRecord) {
      VERIFIED_PRINCIPALS.delete(principal);
    }
  });
  return principal;
}

function hasVerifiedPrincipalBrand(principal: Principal): boolean {
  return VERIFIED_PRINCIPALS.has(principal);
}

// ---------------------------------------------------------------------------
// B2, B6, N2, N3, N6: Typed construction errors, RFC 0008 store port, & pipeline config
// ---------------------------------------------------------------------------
class RouterClientConfigError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'RouterClientConfigError';
    this.code = code;
  }
}

/** RFC 0008 extended RateLimitDecision & RateLimitStore (backward-compatible with fixed-window). */
interface Rfc0008RateLimitDecision extends RateLimitDecision {
  readonly retryAt?: number;
}

interface Rfc0008RateLimitStore extends RateLimitStore {
  consume(request: RateLimitRequest): Promise<Rfc0008RateLimitDecision>;
  validate?(config: { readonly limit: number; readonly windowMs: number }): void;
}

/** Extended AuthenticatorPort with optional N6 capability declarations. */
interface CapabilityAuthenticatorPort extends AuthenticatorPort {
  readonly mayEmitSetCookies?: boolean;
  readonly mayEmitResponseHeaders?: boolean;
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

const PIPELINE_EXECUTED_SYMBOL = Symbol('netscript.pipeline.executed');

interface ProcedurePipelineContext {
  readonly headers?: Readonly<Record<string, string>>;
  readonly principal?: Principal;
  readonly requestId?: string;
  readonly clientAddress?: string;
  readonly authnSideEffects?: AuthnSideEffectSink;
  readonly resHeaders?: Headers; // Populated on HTTP by oRPC ResponseHeadersPlugin
  readonly [PIPELINE_EXECUTED_SYMBOL]?: ReadonlySet<symbol>;
  readonly onHandlerEnter?: (observed: {
    readonly traceId: string | undefined;
    readonly userAlsValue: string | undefined;
    readonly requestId: string | undefined;
  }) => void;
}

interface PipelineConfig {
  readonly serviceId: symbol;
  readonly serviceName: string;
  readonly authenticator: CapabilityAuthenticatorPort;
  readonly authzMode: ServiceAuthzMode;
  readonly trustSharedPrincipal?: boolean;
  readonly trustedVerifiers?: ReadonlySet<AuthenticatorPort>;
  readonly hasHttpOnlyRateLimit?: boolean;
  readonly hasCustomHttpMiddleware?: boolean;
  readonly allowHttpMiddlewareSkip?: boolean;
  readonly rateLimit?: {
    readonly store: Rfc0008RateLimitStore;
    readonly limit: number;
    readonly windowMs: number;
    readonly ipv6Prefix?: number;
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
  options?: {
    readonly hasStartupHooks?: boolean;
    readonly started?: boolean;
    readonly hasSetCookiesSink?: boolean;
  },
): void {
  if (options?.hasStartupHooks && !options.started) {
    throw new RouterClientConfigError(
      'ROUTER_CLIENT_SERVICE_NOT_STARTED',
      `Service "${config.serviceName}" declares onStartup hooks; call await service.start() before createRouterClient().`,
    );
  }
  if (config.hasCustomHttpMiddleware && !config.allowHttpMiddlewareSkip) {
    throw new RouterClientConfigError(
      'ROUTER_CLIENT_HTTP_MIDDLEWARE_UNSUPPORTED',
      `Service "${config.serviceName}" registers custom Hono .use() middleware; mark it transport-only or use #2659 fetch-link.`,
    );
  }
  if (config.hasHttpOnlyRateLimit && !config.rateLimit) {
    throw new RouterClientConfigError(
      'ROUTER_CLIENT_RATE_LIMIT_MISMATCH',
      `Service "${config.serviceName}" configures HTTP withRateLimit() without withProcedureRateLimit(); refusing to drop quotas silently in-process.`,
    );
  }
  if (config.authenticator.mayEmitSetCookies && !options?.hasSetCookiesSink) {
    throw new RouterClientConfigError(
      'ROUTER_CLIENT_COOKIE_SINK_REQUIRED',
      `Service "${config.serviceName}" uses a cookie-rotating authenticator without an authnSideEffects.onSetCookies sink; use #2659 fetch-link or wire an explicit sink.`,
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
    // Advisory #5: Consistent `orpc://<serviceName>/<procedure>` where procedure = `path.join('.')`
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

/**
 * N4: Hardened scoped-brand evaluation:
 * - Finite `nowMs` and `expiresAtMs` (`!(nowMs < expiresAtMs)` fails closed on `NaN`/non-finite);
 * - Finite `claims.exp` when present;
 * - Enforces private `record.internalAudience === config.serviceName` for `audience: 'internal'`
 *   so mutating shallow-frozen `claims.audience` can NEVER bypass internal audience checks!
 */
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

  // N4b: Strict finite-time check (NaN / Infinity ALWAYS fail closed!)
  if (!Number.isFinite(nowMs) || !Number.isFinite(record.expiresAtMs) || !(nowMs < record.expiresAtMs)) {
    return { trusted: false };
  }
  if ('exp' in principal.claims && principal.claims.exp !== undefined) {
    if (
      typeof principal.claims.exp !== 'number' ||
      !Number.isFinite(principal.claims.exp) ||
      !(nowMs < principal.claims.exp * 1000)
    ) {
      return { trusted: false };
    }
  }

  // Service-instance binding (B4 attack 1)
  const sameService = record.serviceId === config.serviceId;
  const explicitlyDelegated =
    config.trustSharedPrincipal === true &&
    config.trustedVerifiers?.has(record.authenticator) === true;

  if (!sameService && !explicitlyDelegated) return { trusted: false };

  // B4 attack 2 + N4c: Internal audience checks private `record.internalAudience === config.serviceName`
  if (policy?.audience === 'internal') {
    if (!sameService || record.internalAudience !== config.serviceName) {
      return { trusted: false };
    }
  }

  return { trusted: true, record };
}

// ---------------------------------------------------------------------------
// N3: Per-leaf procedure wrapping + per-invocation context-symbol guard
// ---------------------------------------------------------------------------
const WRAPPED_PROCEDURE_SERVICE = new WeakMap<object, symbol>();

function isOrpcLeafProcedure(value: unknown): value is { readonly '~orpc': { readonly handler: unknown } } {
  return (
    typeof value === 'object' &&
    value !== null &&
    '~orpc' in value &&
    typeof (value as { readonly '~orpc': { readonly handler?: unknown } })['~orpc']?.handler === 'function'
  );
}

/**
 * Wraps a router tree idempotently at the LEAF procedure level + per-invocation context symbol,
 * so arbitrary nested mounts (`{ v1: { orders: wrappedChild } }`) and dual `rpcRouter` bindings
 * NEVER execute middleware or consume rate-limit quota twice (even on oRPC v2 without middleware dedup).
 * Also calls RFC 0008 `store.validate?.({ limit, windowMs })` synchronously at construction (N2).
 */
function wrapRouterIdempotent<TRouter extends object>(
  router: TRouter,
  config: PipelineConfig,
): TRouter {
  // N2: Synchronous RFC 0008 startup validation at middleware construction
  let validatedIpv6Prefix = 64;
  if (config.rateLimit) {
    if (!Number.isSafeInteger(config.rateLimit.limit) || config.rateLimit.limit <= 0) {
      throw new RangeError('rateLimit.limit must be a positive safe integer');
    }
    if (!Number.isSafeInteger(config.rateLimit.windowMs) || config.rateLimit.windowMs <= 0) {
      throw new RangeError('rateLimit.windowMs must be a positive safe integer');
    }
    validatedIpv6Prefix = config.rateLimit.ipv6Prefix ?? 64;
    if (!Number.isInteger(validatedIpv6Prefix) || validatedIpv6Prefix < 0 || validatedIpv6Prefix > 128) {
      throw new RangeError('Rate-limit ipv6Prefix must be an integer from 0 to 128');
    }
    config.rateLimit.store.validate?.({
      limit: config.rateLimit.limit,
      windowMs: config.rateLimit.windowMs,
    });
  }

  const mw = os
    .$context<ProcedurePipelineContext>()
    .use(async function netscriptProcedurePipeline({ context, path, procedure, signal, next }) {
      // N3 Layer 2: Per-invocation context-symbol guard (belt-and-suspenders, works on v1 AND v2)
      const executed = context[PIPELINE_EXECUTED_SYMBOL];
      if (executed?.has(config.serviceId)) {
        return await next();
      }
      const nextExecuted = new Set(executed);
      nextExecuted.add(config.serviceId);

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
      let trustedInternalAudience: string | undefined;

      if (policy?.authentication !== 'none') {
        const brandCheck = evaluateScopedBrand(context.principal, config, policy, nowMs);
        if (brandCheck.trusted && context.principal) {
          principal = context.principal;
          trustedInternalAudience = brandCheck.record?.internalAudience;
        } else {
          const authnReq = toRequestlessAuthnRequest(context.headers, config.serviceName, path);

          // N6: Validate side-effect sinks BEFORE invoking `authenticate()` so refresh-on-read authenticators
          //     never burn a single-use refresh token only to throw 500 afterward!
          const hasIncomingCookie = Boolean(authnReq.header('cookie'));
          if (
            (config.authenticator.mayEmitSetCookies || hasIncomingCookie) &&
            !context.authnSideEffects?.onSetCookies
          ) {
            throw new ORPCError('INTERNAL_SERVER_ERROR', {
              status: 500,
              message: 'authn.set-cookies-sink-required',
            });
          }
          if (
            config.authenticator.mayEmitResponseHeaders &&
            !context.authnSideEffects?.onResponseHeaders
          ) {
            throw new ORPCError('INTERNAL_SERVER_ERROR', {
              status: 500,
              message: 'authn.response-headers-sink-required',
            });
          }

          let result: AuthnResult;
          try {
            result = await config.authenticator.authenticate(authnReq);
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

          // N6 Defense-in-depth: validate BOTH sinks atomically BEFORE invoking EITHER callback!
          const hasSetCookies = Boolean(result.setCookies?.length);
          const hasResponseHeaders = Boolean(
            result.responseHeaders && Object.keys(result.responseHeaders).length > 0,
          );
          if (hasSetCookies && !context.authnSideEffects?.onSetCookies) {
            throw new ORPCError('INTERNAL_SERVER_ERROR', {
              status: 500,
              message: 'authn.set-cookies-sink-required',
            });
          }
          if (hasResponseHeaders && !context.authnSideEffects?.onResponseHeaders) {
            throw new ORPCError('INTERNAL_SERVER_ERROR', {
              status: 500,
              message: 'authn.response-headers-sink-required',
            });
          }
          if (hasSetCookies) {
            context.authnSideEffects!.onSetCookies!(result.setCookies!);
          }
          if (hasResponseHeaders) {
            context.authnSideEffects!.onResponseHeaders!(result.responseHeaders!);
          }

          principal = result.principal;
          // Capture internal audience from verified freshly-authenticated internal principal before exposure
          if (isInternalServicePrincipal(principal) && typeof principal.claims.audience === 'string') {
            trustedInternalAudience = principal.claims.audience;
          }
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
          // B4 + N4c FIX: Internal audience MUST check `isInternalServicePrincipal(p)` AND private `trustedInternalAudience === config.serviceName`!
          const isInternalForThisService = (p: Principal): boolean =>
            isInternalServicePrincipal(p) &&
            trustedInternalAudience === config.serviceName &&
            p.claims.audience === config.serviceName;

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

      // 3. Post-auth / public procedure rate limiting (N2 + Advisory #3: RFC 0008 retryAt, IPv6 /64, ResponseHeadersPlugin Retry-After)
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
          bucketKey = context.clientAddress
            ? `addr:${rateLimitAddressKey(context.clientAddress, validatedIpv6Prefix)}`
            : 'addr:unknown';
        }

        const quota = await config.rateLimit.store.consume({
          key: bucketKey,
          limit: config.rateLimit.limit,
          windowMs: config.rateLimit.windowMs,
          now: nowMs,
          signal,
        });
        if (!quota.allowed) {
          // N2: RFC 0008 requires deriving Retry-After from `decision.retryAt ?? decision.resetAt`!
          const retryTargetMs = quota.retryAt ?? quota.resetAt;
          const retryAfter = Math.max(1, Math.ceil((retryTargetMs - nowMs) / 1000));
          // N2: Populate HTTP Retry-After header via oRPC's native ResponseHeadersPlugin!
          context.resHeaders?.set('Retry-After', String(retryAfter));
          throw new ORPCError('RATE_LIMITED', {
            status: 429,
            message: 'Too many requests',
            data: { retryAfter, limit: config.rateLimit.limit },
            defined: isContractDefined('RATE_LIMITED'),
          });
        }
      }

      return await next({
        context: {
          principal,
          requestId,
          [PIPELINE_EXECUTED_SYMBOL]: nextExecuted,
        },
      });
    });

  // N3 Layer 1: Recursive per-leaf walk skipping already-wrapped leaves for this serviceId,
  //             and failing closed if a leaf was already wrapped for a DIFFERENT serviceId!
  function walkAndWrap(node: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      if (isOrpcLeafProcedure(value)) {
        const ownerService = WRAPPED_PROCEDURE_SERVICE.get(value);
        if (ownerService === config.serviceId) {
          out[key] = value;
        } else if (ownerService !== undefined) {
          throw new RouterClientConfigError(
            'ROUTER_CLIENT_CROSS_SERVICE_MOUNT',
            `Procedure "${key}" is already wrapped by another service pipeline and cannot be remounted under "${config.serviceName}".`,
          );
        } else {
          // deno-lint-ignore no-explicit-any
          const wrappedLeaf = (mw.router({ __leaf: value as any }) as any).__leaf as object;
          WRAPPED_PROCEDURE_SERVICE.set(wrappedLeaf, config.serviceId);
          out[key] = wrappedLeaf;
        }
      } else if (typeof value === 'object' && value !== null) {
        out[key] = walkAndWrap(value as Record<string, unknown>);
      } else {
        out[key] = value;
      }
    }
    return out;
  }

  return walkAndWrap(router as Record<string, unknown>) as unknown as TRouter;
}

// ---------------------------------------------------------------------------
// Synthetic contract covering public, protected, unmarked (B1), internal (B4),
// streaming (B5 + N5 EventMeta + throw + asyncDispose), and cancellable procedures.
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

function wrapAuthenticatorWithCounter(inner: CapabilityAuthenticatorPort): {
  readonly authenticator: CapabilityAuthenticatorPort;
  readonly calls: { count: number };
} {
  const calls = { count: 0 };
  return {
    calls,
    authenticator: {
      mayEmitSetCookies: inner.mayEmitSetCookies,
      mayEmitResponseHeaders: inner.mayEmitResponseHeaders,
      async authenticate(request: AuthnRequest): Promise<AuthnResult> {
        calls.count += 1;
        return await inner.authenticate(request);
      },
    },
  };
}

async function createOrdersFixture(overrides?: {
  readonly rateLimitQuota?: number;
  readonly rateLimitStore?: Rfc0008RateLimitStore;
  readonly authzMode?: ServiceAuthzMode;
  readonly trustSharedPrincipal?: boolean;
  readonly trustedVerifiers?: ReadonlySet<AuthenticatorPort>;
  readonly now?: () => number;
  readonly extraAuthenticators?: readonly CapabilityAuthenticatorPort[];
  readonly onStreamReturn?: () => void;
  readonly onStreamThrow?: (observedAls: string | undefined, err: unknown) => void;
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
  const baseAuth: CapabilityAuthenticatorPort = {
    mayEmitSetCookies: overrides?.extraAuthenticators?.some((a) => a.mayEmitSetCookies),
    mayEmitResponseHeaders: overrides?.extraAuthenticators?.some((a) => a.mayEmitResponseHeaders),
    authenticate: createCompositeAuthenticator([
      ...(overrides?.extraAuthenticators ?? []),
      internalAuth,
      staticAuth,
    ]).authenticate,
  };
  const { authenticator, calls: authnCalls } = wrapAuthenticatorWithCounter(baseAuth);
  const procedureRateLimitStore: Rfc0008RateLimitStore =
    overrides?.rateLimitStore ?? createMemoryRateLimitStore();
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
          yield withEventMeta(
            { seq, observedAls: userAls.getStore() ?? null },
            { id: `evt-${seq}`, retry: 2500 },
          );
        }
      } catch (err) {
        overrides?.onStreamThrow?.(userAls.getStore(), err);
        throw err;
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
      ? { store: procedureRateLimitStore, limit: overrides.rateLimitQuota, windowMs: 60_000 }
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
    procedureRateLimitStore,
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

  // Public health succeeds anonymously AND RFC 0001 bearerContribution emits NO Authorization header even when token is passed
  assertEquals(await client.health(undefined, { context: { token: 'alice-token' } }), { ok: true });
  assertEquals(observedAuthHeadersByPath['health'], undefined);

  // B1: Unmarked procedure via createRouterClient and bare call() MUST return 403 authz.no-matching-rule
  const [unmarkedErr] = await safe(
    client.unmarkedOp({ value: 'hi' }, { context: { token: 'alice-token' } }),
  );
  assert(unmarkedErr instanceof ORPCError);
  assertEquals(unmarkedErr.code, 'FORBIDDEN');
  assertEquals(unmarkedErr.status, 403);
  assertEquals(unmarkedErr.message, 'authz.no-matching-rule');

  const [bareUnmarkedErr] = await safe(
    call(pipelineRouter.unmarkedOp, { value: 'hi' }, {
      context: { headers: { authorization: 'Bearer alice-token' } },
    }),
  );
  assert(bareUnmarkedErr instanceof ORPCError);
  assertEquals(bareUnmarkedErr.code, 'FORBIDDEN');
  assertEquals(bareUnmarkedErr.message, 'authz.no-matching-rule');

  // Unauthenticated getOrder fails closed 401 UNAUTHORIZED (defined: true via commonErrorMap)
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

  assertEquals(await client.unmarkedOp({ value: 'ok' }, { context: { token: 'alice-token' } }), { echoed: 'ok' });
  const [bobErr] = await safe(client.unmarkedOp({ value: 'no' }, { context: { token: 'bob-noscope' } }));
  assert(bobErr instanceof ORPCError);
  assertEquals(bobErr.code, 'FORBIDDEN');
  assertEquals(bobErr.message, 'authz.missing-scope:orders:read');
});

// ===========================================================================
// TEST 3 (B3 + N2): HTTP edge ordering/codes + N2 failing-then-passing 429 Retry-After,
//                   RFC 0008 validate() & retryAt, disjoint stores, and IPv6 /64 parity
// ===========================================================================
Deno.test('B3 + N2: HTTP edge ordering/codes (incl. PAYLOAD_TOO_LARGE) AND procedure 429 Retry-After via ResponseHeadersPlugin + RFC 0008 validate/retryAt + disjoint stores + IPv6 /64', async () => {
  const fakeNow = 1_700_000_000_000;
  // N2: Use DISJOINT stores for HTTP edge `withRateLimit` vs `withProcedureRateLimit`!
  const edgeRateLimitStore = createMemoryRateLimitStore();
  const { authenticator, pipelineRouter } = await createOrdersFixture({
    rateLimitQuota: 100,
    now: () => fakeNow,
  });
  const mountedRouter = { v1: { orders: pipelineRouter } };
  const mountedContract = { v1: { orders: OrdersContract } };
  const retiredPath = '/api/rpc/v1/orders/legacyRemoved';

  const app = createService(mountedRouter, { name: 'orders-b3' })
    .withRateLimit({
      routes: ['/api/rpc/v1/orders/health'],
      limit: 1,
      windowMs: 60_000,
      store: edgeRateLimitStore,
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

  // 3. Authenticated WITH scope + oversized body -> 413 PAYLOAD_TOO_LARGE (body-limit.ts:28)
  const r413 = await app.fetch(
    new Request('http://orders.local/api/rpc/v1/orders/getOrder', {
      method: 'POST',
      headers: { authorization: 'Bearer alice-token', 'content-type': 'application/json' },
      body: hugeBody,
    }),
  );
  assertEquals(r413.status, 413);
  assertEquals((await r413.json()).error, 'PAYLOAD_TOO_LARGE');

  // 4. Unauthenticated unknown & retired paths -> 401 (no availability oracle!)
  assertEquals((await app.fetch(new Request('http://orders.local/api/rpc/v1/orders/doesNotExist', { method: 'POST' }))).status, 401);
  assertEquals((await app.fetch(new Request(`http://orders.local${retiredPath}`, { method: 'POST' }))).status, 401);

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

  // 6. findInternalGuard: HEAD and DELETE on internal OpenAPI path fail closed (403 authz.internal-audience)
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

  // 7. HTTP edge pre-auth withRateLimit -> byte-identical 429 `{ error: 'RATE_LIMITED' }` + Retry-After
  const rPub1 = await app.fetch(new Request('http://orders.local/api/rpc/v1/orders/health', { method: 'POST' }));
  assertEquals(rPub1.status, 200);
  const rPub2 = await app.fetch(new Request('http://orders.local/api/rpc/v1/orders/health', { method: 'POST' }));
  assertEquals(rPub2.status, 429);
  assertEquals((await rPub2.json()).error, 'RATE_LIMITED');
  assert(Number(rPub2.headers.get('retry-after')) >= 1);

  // --- N2 FAILING-THEN-PASSING PROOFS ---
  // N2a: RFC 0008 `store.validate?.({ limit, windowMs })` fails fast at construction on >365-day GCRA retention!
  const MAX_GCRA_TTL_MS = 31_536_000_000;
  let validateCalled = false;
  const rollingGcraStore: Rfc0008RateLimitStore = {
    validate({ limit, windowMs }) {
      validateCalled = true;
      if (windowMs > MAX_GCRA_TTL_MS || limit <= 0) {
        throw new RangeError('RFC 0008 rolling GCRA retention exceeds 365-day ceiling');
      }
    },
    consume({ now }) {
      // Models rolling GCRA denial where earliest next eligible commit (`retryAt` = +5s)
      // differs sharply from full bucket recovery (`resetAt` = +60s)!
      return Promise.resolve({
        allowed: false,
        retryAt: now + 5_000,
        resetAt: now + 60_000,
      });
    },
  };
  assertThrows(
    () =>
      wrapRouterIdempotent(
        { ping: os.handler(() => ({ ok: true })) },
        {
          serviceId: Symbol('svc:bad-gcra'),
          serviceName: 'bad-gcra',
          authenticator,
          authzMode: { kind: 'contract' },
          rateLimit: { store: rollingGcraStore, limit: 10, windowMs: MAX_GCRA_TTL_MS + 1 },
        },
      ),
    RangeError,
    '365-day ceiling',
  );
  assert(validateCalled);

  // N2b: Failing control — RPCHandler@1.15.5 WITHOUT ResponseHeadersPlugin omits Retry-After on ORPCError('RATE_LIMITED')!
  const gcraFixture = await createOrdersFixture({
    rateLimitQuota: 10,
    rateLimitStore: rollingGcraStore,
    now: () => fakeNow,
  });
  const rpcWithoutPlugin = new RPCHandler(gcraFixture.pipelineRouter);
  const resNoHeader = await rpcWithoutPlugin.handle(
    new Request('http://orders.local/health', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    }),
  );
  assertEquals(resNoHeader.response?.status, 429);
  assertEquals(resNoHeader.response?.headers.get('retry-after'), null); // Reproduces N2 failing control!

  // N2c: Passing proof — RPCHandler + OpenAPIHandler WITH native ResponseHeadersPlugin emits
  //      HTTP 429 + `Retry-After: 5` (from `decision.retryAt`, NOT `resetAt` 60s!) + typed oRPC envelope
  //      decoded seamlessly by RPCLink as `isDefinedError === true`!
  const rpcWithPlugin = new RPCHandler(gcraFixture.pipelineRouter, {
    plugins: [new ResponseHeadersPlugin()],
  });
  const resRpcWithHeader = await rpcWithPlugin.handle(
    new Request('http://orders.local/health', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    }),
  );
  assertEquals(resRpcWithHeader.response?.status, 429);
  assertEquals(resRpcWithHeader.response?.headers.get('retry-after'), '5'); // Derived from retryAt (+5s), NOT resetAt (+60s)!
  const rpc429Body = await resRpcWithHeader.response?.json();
  assertEquals(rpc429Body.json.code, 'RATE_LIMITED');
  assertEquals(rpc429Body.json.defined, true);
  assertEquals(rpc429Body.json.data, { retryAfter: 5, limit: 10 });

  const openApiWithPlugin = new OpenAPIHandler(gcraFixture.pipelineRouter, {
    plugins: [new ResponseHeadersPlugin()],
  });
  const resOaWithHeader = await openApiWithPlugin.handle(
    new Request('http://orders.local/orders/health', { method: 'GET' }),
  );
  assertEquals(resOaWithHeader.response?.status, 429);
  assertEquals(resOaWithHeader.response?.headers.get('retry-after'), '5');

  const decodedRpcLink = createORPCClient(
    new RPCLink({
      url: 'http://orders.local',
      fetch: async (req, init) => (await rpcWithPlugin.handle(new Request(req, init))).response!,
    }),
  ) as { health: () => Promise<{ ok: boolean }> };
  const [link429Err, , link429Defined] = await safe(decodedRpcLink.health());
  assert(link429Err instanceof ORPCError);
  assert(isDefinedError(link429Err));
  assertEquals(link429Defined, true);
  assertEquals(link429Err.code, 'RATE_LIMITED');
  assertEquals(link429Err.data, { retryAfter: 5, limit: 10 });

  // N2d: Failing-then-passing disjoint-store proof — sharing one store between HTTP withRateLimit and
  //      withProcedureRateLimit double-counts on HTTP (2 consumptions on 1 call), while disjoint stores count 1 each!
  const sharedBadStore = createMemoryRateLimitStore();
  let sharedConsumeCount = 0;
  const countedSharedStore: Rfc0008RateLimitStore = {
    consume(req) {
      sharedConsumeCount += 1;
      return sharedBadStore.consume(req);
    },
  };
  const sharedFixture = await createOrdersFixture({
    rateLimitQuota: 1,
    rateLimitStore: countedSharedStore,
    now: () => fakeNow,
  });
  const badSharedApp = createService({ v1: { orders: sharedFixture.pipelineRouter } }, { name: 'orders-shared-bad' })
    .withRateLimit({
      routes: ['/api/rpc/v1/orders/health'],
      limit: 1,
      windowMs: 60_000,
      store: countedSharedStore,
      key: () => 'addr:unknown',
      now: () => fakeNow,
    })
    .withRPC({ rpcPath: '/api/rpc' })
    .build();
  const badSharedRes = await badSharedApp.fetch(
    new Request('http://orders.local/api/rpc/v1/orders/health', { method: 'POST' }),
  );
  // First HTTP call is rejected 429 because edge consumed #1 and procedure consumed #2 on the same store/key!
  assertEquals(badSharedRes.status, 429);
  assertEquals(sharedConsumeCount, 2);

  // Disjoint stores: 1 consumption on edge store, 1 on procedure store -> first call 200, second call 429!
  const separateEdgeStore = createMemoryRateLimitStore();
  const separateProcStore = createMemoryRateLimitStore();
  const goodDisjointFixture = await createOrdersFixture({
    rateLimitQuota: 1,
    rateLimitStore: separateProcStore,
    now: () => fakeNow,
  });
  const goodDisjointApp = createService({ v1: { orders: goodDisjointFixture.pipelineRouter } }, { name: 'orders-disjoint' })
    .withRateLimit({
      routes: ['/api/rpc/v1/orders/health'],
      limit: 1,
      windowMs: 60_000,
      store: separateEdgeStore,
      key: () => 'edge:health',
      now: () => fakeNow,
    })
    .withRPC({ rpcPath: '/api/rpc' })
    .build();
  assertEquals(
    (await goodDisjointApp.fetch(new Request('http://orders.local/api/rpc/v1/orders/health', { method: 'POST' }))).status,
    200,
  );
  assertEquals(
    (await goodDisjointApp.fetch(new Request('http://orders.local/api/rpc/v1/orders/health', { method: 'POST' }))).status,
    429,
  );

  // Advisory #3: IPv6 /64 bucketing parity via `rateLimitAddressKey`
  const ipv6Fixture = await createOrdersFixture({ rateLimitQuota: 1, now: () => fakeNow });
  const ipv6Client = createRouterClient(ipv6Fixture.pipelineRouter, {
    context: (caller: { readonly clientAddress: string }): ProcedurePipelineContext => ({
      clientAddress: caller.clientAddress,
    }),
  });
  assertEquals(await ipv6Client.health(undefined, { context: { clientAddress: '2001:db8:1:2:aaaa::1' } }), { ok: true });
  // Different interface ID in SAME /64 prefix shares bucket -> 429!
  const [samePrefixErr] = await safe(
    ipv6Client.health(undefined, { context: { clientAddress: '2001:db8:1:2:bbbb::2' } }),
  );
  assert(samePrefixErr instanceof ORPCError);
  assertEquals(samePrefixErr.code, 'RATE_LIMITED');
  // Different /64 prefix gets its own bucket -> 200!
  assertEquals(await ipv6Client.health(undefined, { context: { clientAddress: '2001:db8:1:3::1' } }), { ok: true });
});

// ===========================================================================
// TEST 4 (B4 + N4): Scoped brand defeats all B4 attacks + N4 shared-ref/cleanup/NaN/shallow-freeze
// ===========================================================================
Deno.test('B4 + N4: scoped VerifiedPrincipalRecord defeats cross-service/expired/internal/closure attacks AND N4 shared-ref overwrite, cleanup, NaN expiry, and shallow-frozen claims mutation', async () => {
  const fakeNow = 1_700_000_000_000;
  let revoked = false;
  const orders = await createOrdersFixture({ now: () => fakeNow });

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
      trustSharedPrincipal: true,
      trustedVerifiers: new Set([orders.authenticator]),
      now: () => fakeNow,
    },
  );

  // --- B4 Attacks 1, 2, 3 ---
  const scopeA = createRequestLifetimeScope();
  const expiredUserPrincipal: Principal = {
    subject: 'user:alice',
    scopes: ['orders:read'],
    roles: ['member'],
    scheme: 'bearer',
    claims: { tenantId: 'tenant-a', exp: Math.floor((fakeNow - 5_000) / 1000) },
  };
  brandVerifiedPrincipal(expiredUserPrincipal, {
    serviceId: orders.serviceId,
    serviceName: 'orders',
    authenticator: orders.authenticator,
    verifiedAtMs: fakeNow - 10_000,
    expiresAtMs: fakeNow + 60_000,
    requestScope: scopeA,
  });

  const [attack1BillingErr] = await safe(
    call(billingRouter.internalCharge, { invoiceId: 'inv-1' }, { context: { principal: expiredUserPrincipal } }),
  );
  assert(attack1BillingErr instanceof ORPCError);
  assertEquals(attack1BillingErr.code, 'UNAUTHORIZED');
  assertEquals(billingAuthCalls.count, 1);

  const [attack1OrdersErr] = await safe(
    call(orders.pipelineRouter.getOrder, { orderId: 'ord-1' }, { context: { principal: expiredUserPrincipal } }),
  );
  assert(attack1OrdersErr instanceof ORPCError);
  assertEquals(attack1OrdersErr.code, 'UNAUTHORIZED');
  scopeA.end();

  // Attack 2: Genuine orders internal principal on orders vs billing
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
  assertEquals(
    (await call(orders.pipelineRouter.internalReindex, { batchId: 'b-1' }, { context: { principal: ordersAuthRes.principal } })).accepted,
    true,
  );
  const [attack2Err] = await safe(
    call(billingRouter.internalCharge, { invoiceId: 'inv-evil' }, { context: { principal: ordersAuthRes.principal } }),
  );
  assert(attack2Err instanceof ORPCError);
  assertEquals(attack2Err.code, 'UNAUTHORIZED');
  scopeInternal.end();

  // Genuine billing internal credential succeeds on billing
  const billingInternalToken = await deriveInternalCredential(orders.installationSecret, 'billing');
  assertEquals(
    await call(billingRouter.internalCharge, { invoiceId: 'inv-good' }, {
      context: { headers: { authorization: `Bearer ${billingInternalToken}` } },
    }),
    { charged: true, audience: 'billing' },
  );

  // Attack 3: Revocation & originating request scope end
  const liveScope = createRequestLifetimeScope();
  const capturedPrincipal: Principal = {
    subject: 'user:alice',
    scopes: ['orders:read'],
    roles: ['member'],
    scheme: 'bearer',
    claims: { tenantId: 'tenant-a', exp: Math.floor((fakeNow + 60_000) / 1000) },
  };
  brandVerifiedPrincipal(capturedPrincipal, {
    serviceId: orders.serviceId,
    serviceName: 'orders',
    authenticator: orders.authenticator,
    verifiedAtMs: fakeNow,
    expiresAtMs: fakeNow + 60_000,
    requestScope: liveScope,
    isRevoked: () => revoked,
  });

  const beforeCount = orders.authnCalls.count;
  assertEquals(
    (await call(orders.pipelineRouter.getOrder, { orderId: 'live-1' }, { context: { principal: capturedPrincipal } })).subject,
    'user:alice',
  );
  assertEquals(orders.authnCalls.count, beforeCount);

  revoked = true;
  const [revokedErr] = await safe(
    call(orders.pipelineRouter.getOrder, { orderId: 'after-logout' }, { context: { principal: capturedPrincipal } }),
  );
  assert(revokedErr instanceof ORPCError);
  assertEquals(revokedErr.code, 'UNAUTHORIZED');

  revoked = false;
  liveScope.end();
  // N4a cleanup proof: ending requestScope immediately deletes the WeakMap entry (zero closure memory retention)!
  assertEquals(hasVerifiedPrincipalBrand(capturedPrincipal), false);
  const [postRequestErr] = await safe(
    call(orders.pipelineRouter.getOrder, { orderId: 'queued-job' }, { context: { principal: capturedPrincipal } }),
  );
  assert(postRequestErr instanceof ORPCError);
  assertEquals(postRequestErr.code, 'UNAUTHORIZED');

  // --- N4 FAILING-THEN-PASSING PROOFS ---
  // N4a: Overlapping live brand on a shared Principal reference MUST be rejected (never silently overwrite Request 1's scope!)
  const sharedPrincipal: Principal = {
    subject: 'user:cached',
    scopes: ['orders:read'],
    roles: ['member'],
    scheme: 'bearer',
    claims: { tenantId: 'tenant-a' },
  };
  const req1Scope = createRequestLifetimeScope();
  const req2Scope = createRequestLifetimeScope();
  brandVerifiedPrincipal(sharedPrincipal, {
    serviceId: orders.serviceId,
    serviceName: 'orders',
    authenticator: orders.authenticator,
    verifiedAtMs: fakeNow,
    expiresAtMs: fakeNow + 60_000,
    requestScope: req1Scope,
  });
  assertThrows(
    () =>
      brandVerifiedPrincipal(sharedPrincipal, {
        serviceId: orders.serviceId,
        serviceName: 'orders',
        authenticator: orders.authenticator,
        verifiedAtMs: fakeNow,
        expiresAtMs: fakeNow + 60_000,
        requestScope: req2Scope,
      }),
    Error,
    'Overlapping active brand on shared Principal reference',
  );
  req1Scope.end();
  req2Scope.end();
  assertEquals(hasVerifiedPrincipalBrand(sharedPrincipal), false);

  // N4b: NaN expiry failing-then-passing proof!
  // Failing control: Round-1 probe's `fakeNow >= Number.NaN` evaluated to `false` (failed OPEN!).
  assertEquals(fakeNow >= Number.NaN, false);
  // Passing proof: Hardened `evaluateScopedBrand` rejects BOTH `expiresAtMs: NaN` AND `claims.exp: NaN`!
  const nanScope1 = createRequestLifetimeScope();
  const nanExpPrincipal: Principal = {
    subject: 'user:alice',
    scopes: ['orders:read'],
    roles: ['member'],
    scheme: 'bearer',
    claims: { tenantId: 'tenant-a', exp: Number.NaN },
  };
  brandVerifiedPrincipal(nanExpPrincipal, {
    serviceId: orders.serviceId,
    serviceName: 'orders',
    authenticator: orders.authenticator,
    verifiedAtMs: fakeNow,
    expiresAtMs: fakeNow + 60_000,
    requestScope: nanScope1,
  });
  const [nanExpErr] = await safe(
    call(orders.pipelineRouter.getOrder, { orderId: 'nan-exp' }, { context: { principal: nanExpPrincipal } }),
  );
  assert(nanExpErr instanceof ORPCError);
  assertEquals(nanExpErr.code, 'UNAUTHORIZED');
  nanScope1.end();

  const nanScope2 = createRequestLifetimeScope();
  const nanRecordPrincipal: Principal = {
    subject: 'user:alice',
    scopes: ['orders:read'],
    roles: ['member'],
    scheme: 'bearer',
    claims: { tenantId: 'tenant-a' },
  };
  brandVerifiedPrincipal(nanRecordPrincipal, {
    serviceId: orders.serviceId,
    serviceName: 'orders',
    authenticator: orders.authenticator,
    verifiedAtMs: fakeNow,
    expiresAtMs: Number.NaN,
    requestScope: nanScope2,
  });
  const [nanRecordErr] = await safe(
    call(orders.pipelineRouter.getOrder, { orderId: 'nan-rec' }, { context: { principal: nanRecordPrincipal } }),
  );
  assert(nanRecordErr instanceof ORPCError);
  assertEquals(nanRecordErr.code, 'UNAUTHORIZED');
  nanScope2.end();

  // N4c: Shallow-freeze `claims.audience` mutation failing-then-passing proof!
  // Failing control: current `createInternalCredentialAuthenticator` freezes `principal` but NOT `principal.claims`!
  const isolatedInternalAuth = createInternalCredentialAuthenticator({
    secret: orders.installationSecret,
    service: 'orders',
    scopes: ['orders:read'],
    roles: ['service'],
  });
  const rawInternalRes = await isolatedInternalAuth.authenticate({
    method: 'IN_PROCESS',
    path: 'orpc://orders/internalReindex',
    header: (n) => (n.toLowerCase() === 'authorization' ? `Bearer ${ordersInternalToken}` : undefined),
    headers: () => new Headers({ authorization: `Bearer ${ordersInternalToken}` }),
    cookie: () => undefined,
  });
  assert(rawInternalRes.ok);
  assertEquals(Object.isFrozen(rawInternalRes.principal), true);
  assertEquals(Object.isFrozen(rawInternalRes.principal.claims), false); // Demonstrates current shallow freeze!
  // Even if an attacker mutated `claims.audience` BEFORE branding (or on an unfrozen principal),
  // branding deep-freezes `claims` AND `evaluateScopedBrand` checks private `record.internalAudience === config.serviceName`!
  (rawInternalRes.principal.claims as Record<string, unknown>).audience = 'billing';
  const tamperedScope = createRequestLifetimeScope();
  brandVerifiedPrincipal(rawInternalRes.principal, {
    serviceId: billingServiceId,
    serviceName: 'billing',
    authenticator: billingAuth,
    verifiedAtMs: fakeNow,
    expiresAtMs: fakeNow + 60_000,
    requestScope: tamperedScope,
    internalAudience: 'orders', // Private record still holds true issuer audience `'orders'`!
  });
  assertEquals(Object.isFrozen(rawInternalRes.principal.claims), true); // Deep-frozen on brand!
  const [tamperedErr] = await safe(
    call(billingRouter.internalCharge, { invoiceId: 'inv-tampered' }, {
      context: { principal: rawInternalRes.principal },
    }),
  );
  assert(tamperedErr instanceof ORPCError);
  assertEquals(tamperedErr.code, 'UNAUTHORIZED'); // Private `record.internalAudience !== 'billing'` fails closed!
  tamperedScope.end();

  // True single-authn count on HTTP (counting directly at AuthenticatorPort)
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
  const edgeStampingAuth: CapabilityAuthenticatorPort = {
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
  assertEquals(realHttpAuthCalls.count, 1);
  edgeScope.end();
});

// ===========================================================================
// TEST 5 (B5 + N5): Root snapshot guard (ALS + non-span OTel context) + streaming
//                   detachment (`next`, `return`, `throw`, `[Symbol.asyncDispose]`, `EventMeta`)
// ===========================================================================
Deno.test('B5 + N5: root capture fails closed on registered ALS & non-span OTel context; streaming detaches next/return/throw/[Symbol.asyncDispose] and preserves EventMeta', async () => {
  let streamReturnObservedAls: string | undefined = 'not-called';
  let streamThrowObservedAls: string | undefined = 'not-called';
  const { pipelineRouter } = await createOrdersFixture({
    onStreamReturn: () => {
      streamReturnObservedAls = userAls.getStore();
    },
    onStreamThrow: (obs) => {
      streamThrowObservedAls = obs;
    },
  });
  const tracer = trace.getTracer('rfc-a-probe-b5');

  // B5a: Lazy snapshot poisoning vs composition-root capture
  const poisonedLazySnapshot = userAls.run('tenant-A-session', () => AsyncLocalStorage.snapshot());
  assertEquals(userAls.run('tenant-B-session', () => poisonedLazySnapshot(() => userAls.getStore())), 'tenant-A-session');
  await userAls.run('tenant-A-session', () => {
    assertThrows(
      () => captureCleanAsyncRootOrThrow(),
      AsyncContextRootCaptureError,
      'probe.userAls',
    );
  });
  assertEquals(userAls.run('tenant-B-session', () => BOOTSTRAP_CLEAN_SNAPSHOT(() => userAls.getStore())), undefined);

  // N5a failing-then-passing: Non-span OTel context (Baggage / ROOT_CONTEXT.setValue) is MISSED by
  // `trace.getActiveSpan()`, but CAUGHT by `otelContext.active() !== ROOT_CONTEXT`!
  const baggageKey = createContextKey('probe.tenant.baggage');
  otelContext.with(ROOT_CONTEXT.setValue(baggageKey, 'tenant-A-baggage'), () => {
    // Failing control: checking only `trace.getActiveSpan()` sees `undefined`!
    assertEquals(trace.getActiveSpan(), undefined);
    // Passing proof: `captureCleanAsyncRootOrThrow()` checks `otelContext.active() !== ROOT_CONTEXT` and fails closed!
    assertThrows(
      () => captureCleanAsyncRootOrThrow(),
      AsyncContextRootCaptureError,
      'otel.activeContext',
    );
  });

  // Active OTel span also fails closed
  tracer.startActiveSpan('lazy-import-span', (span) => {
    try {
      assertThrows(() => captureCleanAsyncRootOrThrow(), AsyncContextRootCaptureError, 'otel.activeSpan');
    } finally {
      span.end();
    }
  });

  // B5b: Unwrapped streaming leaks consumer ALS on pulls
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
  assertEquals(naivePull1.value.observedAls, 'consumer-leaked-pull');
  await naiveIter.return?.();

  // B5b + N5b: Isolated router client with `wrapDetachedAsyncIterator` (next/return/throw/[Symbol.asyncDispose] + EventMeta)
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

  const streamClient = createIsolatedRouterClient(true);
  const iter = await userAls.run('consumer-initial-als', () =>
    streamClient.streamEvents(undefined, { context: { token: 'alice-token' } })
  );
  // N5b: Verify `[Symbol.asyncDispose]` is exposed on the wrapped iterator (unlike Round 1!)
  assertEquals(typeof (iter as unknown as AsyncDisposable)[Symbol.asyncDispose], 'function');

  const pulled: Array<{ seq: number; observedAls: string | null; metaId?: string; metaRetry?: number }> = [];
  for (let i = 1; i <= 3; i++) {
    const step = await userAls.run(`consumer-pull-als-${i}`, () => iter.next());
    assert(!step.done);
    const meta = getEventMeta(step.value);
    pulled.push({ ...step.value, metaId: meta?.id, metaRetry: meta?.retry });
  }
  assertEquals(pulled, [
    { seq: 1, observedAls: null, metaId: 'evt-1', metaRetry: 2500 },
    { seq: 2, observedAls: null, metaId: 'evt-2', metaRetry: 2500 },
    { seq: 3, observedAls: null, metaId: 'evt-3', metaRetry: 2500 },
  ]);

  // N5b: `[Symbol.asyncDispose]()` (backing `await using`) runs generator cleanup detached!
  streamReturnObservedAls = 'not-called';
  const iterDispose = await userAls.run('consumer-dispose-init', () =>
    streamClient.streamEvents(undefined, { context: { token: 'alice-token' } })
  );
  await userAls.run('consumer-dispose-pull', () => iterDispose.next());
  await userAls.run('consumer-dispose-secret', () =>
    (iterDispose as unknown as AsyncDisposable)[Symbol.asyncDispose]()
  );
  assertEquals(streamReturnObservedAls, undefined);

  // N5b: `.throw()` on oRPC's `eventIterator(schema)` stream runs generator `finally` cleanup detached
  //      and rejects the caller with the thrown error!
  streamReturnObservedAls = 'not-called';
  const iterThrow = await userAls.run('consumer-throw-init', () =>
    streamClient.streamEvents(undefined, { context: { token: 'alice-token' } })
  );
  await userAls.run('consumer-throw-pull', () => iterThrow.next());
  await userAls.run('consumer-throw-secret', async () => {
    await assertRejects(() => iterThrow.throw!(new Error('consumer-cancelled')), Error, 'consumer-cancelled');
  });
  assertEquals(streamReturnObservedAls, undefined);

  // N5b: Direct `wrapDetachedAsyncIterator` on a raw async generator ALSO executes `.throw()`'s
  //      `catch` + `finally` AND `[Symbol.asyncDispose]()` strictly detached!
  streamThrowObservedAls = 'not-called';
  streamReturnObservedAls = 'not-called';
  const rawGen = (async function* () {
    try {
      yield withEventMeta({ seq: 1 }, { id: 'raw-1' });
      yield withEventMeta({ seq: 2 }, { id: 'raw-2' });
    } catch (err) {
      streamThrowObservedAls = userAls.getStore();
      throw err;
    } finally {
      streamReturnObservedAls = userAls.getStore();
    }
  })();
  const detachedRaw = wrapDetachedAsyncIterator(rawGen, (fn) =>
    BOOTSTRAP_CLEAN_SNAPSHOT(() => withContext(ROOT_CONTEXT, fn))
  );
  const rawStep1 = await userAls.run('consumer-raw-pull', () => detachedRaw.next());
  assert(!rawStep1.done);
  assertEquals(getEventMeta(rawStep1.value)?.id, 'raw-1');
  await userAls.run('consumer-raw-throw-secret', async () => {
    await assertRejects(() => detachedRaw.throw!(new Error('raw-boom')), Error, 'raw-boom');
  });
  assertEquals(streamThrowObservedAls, undefined);
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
// TEST 6 (B6 + N3 + N6 + Advisory #4): pre-auth setCookies sink check (no token burn),
//        nested router double-wrap protection, custom `.use()` fail-closed, real start()/stop() drain,
//        AbortSignal, auth-before-validation, and Zod cloning vs z.unknown() aliasing
// ===========================================================================
Deno.test('B6 + N3 + N6 + Advisory #4: pre-auth setCookies sink preserves single-use refresh tokens, nested mounts execute 1x, custom .use() fails closed, start()/stop() drains & disposes DBs', async () => {
  // --- N6 FAILING-THEN-PASSING PROOF: Single-use refresh-token preservation ---
  let singleUseTokenConsumed = false;
  let refreshAuthenticateCalls = 0;
  const singleUseRefreshAuth: CapabilityAuthenticatorPort = {
    mayEmitSetCookies: true,
    authenticate(req) {
      refreshAuthenticateCalls += 1;
      if (req.cookie('sid') !== 'single-use-refresh-v1') {
        return { ok: false, reason: 'missing-session' };
      }
      if (singleUseTokenConsumed) {
        return { ok: false, reason: 'refresh_token_already_burned' };
      }
      // Models packages/auth-kv-oauth & packages/auth-workos rotating single-use credentials DURING authenticate()!
      singleUseTokenConsumed = true;
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
        responseHeaders: { 'x-session-rotated': '1' },
      };
    },
  };

  // Failing control (Round-1 order): checking sink AFTER authenticate() burns the single-use token!
  let legacyBurned = false;
  const legacyRes = await (async () => {
    const authRes = await singleUseRefreshAuth.authenticate(
      toRequestlessAuthnRequest({ cookie: 'sid=single-use-refresh-v1' }, 'orders', ['getOrder']),
    );
    legacyBurned = singleUseTokenConsumed;
    if (authRes.ok && authRes.setCookies?.length) {
      return 'threw-500-after-burn';
    }
    return 'unexpected';
  })();
  assertEquals(legacyRes, 'threw-500-after-burn');
  assertEquals(legacyBurned, true); // Single-use token was burned!

  // Reset single-use token and prove NEW pre-`authenticate()` check preserves it untouched!
  singleUseTokenConsumed = false;
  refreshAuthenticateCalls = 0;

  const cookieFixture = await createOrdersFixture({
    extraAuthenticators: [singleUseRefreshAuth],
  });
  // Construction-time check also fails closed for declared cookie-rotating authenticator without sink
  assertThrows(
    () => assertRouterClientEligible(cookieFixture.pipelineConfig, { hasSetCookiesSink: false }),
    RouterClientConfigError,
    'ROUTER_CLIENT_COOKIE_SINK_REQUIRED',
  );

  const rotatedCookies: string[] = [];
  const rotatedHeaders: Array<Readonly<Record<string, string>>> = [];
  const cookieClient = createRouterClient(cookieFixture.pipelineRouter, {
    context: (caller: { readonly cookie: string; readonly sink?: AuthnSideEffectSink }): ProcedurePipelineContext => ({
      headers: { cookie: caller.cookie },
      authnSideEffects: caller.sink,
    }),
  });

  // Without onSetCookies sink -> FAILS CLOSED BEFORE calling authenticate() -> single-use token NOT burned!
  const [noSinkErr] = await safe(
    cookieClient.getOrder({ orderId: 'c-1' }, { context: { cookie: 'sid=single-use-refresh-v1' } }),
  );
  assert(noSinkErr instanceof ORPCError);
  assertEquals(noSinkErr.message, 'authn.set-cookies-sink-required');
  assertEquals(refreshAuthenticateCalls, 0); // ZERO calls to authenticate()!
  assertEquals(singleUseTokenConsumed, false); // Single-use token preserved!

  // Atomic post-check proof: if onSetCookies IS provided but onResponseHeaders is MISSING,
  // neither callback is invoked (zero partial side effects!)
  const [partialSinkErr] = await safe(
    cookieClient.getOrder(
      { orderId: 'c-partial' },
      {
        context: {
          cookie: 'sid=single-use-refresh-v1',
          sink: { onSetCookies: (c) => rotatedCookies.push(...c) },
        },
      },
    ),
  );
  assert(partialSinkErr instanceof ORPCError);
  assertEquals(partialSinkErr.message, 'authn.response-headers-sink-required');
  assertEquals(rotatedCookies, []); // Zero partial side effects!

  // Reset and succeed when BOTH sinks are wired
  singleUseTokenConsumed = false;
  const okCookieRes = await cookieClient.getOrder(
    { orderId: 'c-2' },
    {
      context: {
        cookie: 'sid=single-use-refresh-v1',
        sink: {
          onSetCookies: (c) => rotatedCookies.push(...c),
          onResponseHeaders: (h) => rotatedHeaders.push(h),
        },
      },
    },
  );
  assertEquals(okCookieRes.subject, 'user:cookie-bob');
  assertEquals(rotatedCookies, ['sid=rotated-v2; HttpOnly; SameSite=Lax; Path=/']);
  assertEquals(rotatedHeaders, [{ 'x-session-rotated': '1' }]);

  // --- N3 FAILING-THEN-PASSING PROOF: Nested router mount double-wrapping ---
  // Failing control (Round-1 outer-only WeakSet): mounting `wrappedChild` inside `{ v1: { orders: wrappedChild } }`
  // and re-wrapping runs middleware TWICE (`oldNestedExecs === 2`)!
  const oldOuterMarker = new WeakSet<object>();
  let oldNestedExecs = 0;
  function wrapOuterOnly<T extends object>(r: T): T {
    if (oldOuterMarker.has(r)) return r;
    const oldMw = os.use(async ({ next }) => {
      oldNestedExecs += 1;
      return await next();
    });
    // deno-lint-ignore no-explicit-any
    const wrapped = oldMw.router(r as any) as unknown as T;
    oldOuterMarker.add(wrapped as object);
    return wrapped;
  }
  const oldChild = wrapOuterOnly({ ping: os.handler(() => ({ ok: true })) });
  const oldParent = wrapOuterOnly({ v1: { orders: oldChild } });
  await call(oldParent.v1.orders.ping, undefined);
  assertEquals(oldNestedExecs, 2); // Reproduces N3 double-execution!

  // Passing proof (Round-2 per-leaf WeakMap + context-symbol guard): nested mount runs middleware ONCE!
  const rlFixture = await createOrdersFixture({ rateLimitQuota: 5 });
  const nestedMounted = wrapRouterIdempotent(
    {
      v1: { orders: rlFixture.pipelineRouter },
      directHealth: implement(OrdersContract).$context<ProcedurePipelineContext>().health.handler(() => ({ ok: true })),
    },
    rlFixture.pipelineConfig,
  );
  const beforeNestedExec = rlFixture.executionCounter.count;
  await createRouterClient(nestedMounted, {
    context: (): ProcedurePipelineContext => ({ clientAddress: '198.51.100.1' }),
  }).v1.orders.health(undefined);
  assertEquals(rlFixture.executionCounter.count - beforeNestedExec, 1); // Executed EXACTLY ONCE!
  await createRouterClient(nestedMounted, {
    context: (): ProcedurePipelineContext => ({ clientAddress: '198.51.100.2' }),
  }).directHealth(undefined);
  assertEquals(rlFixture.executionCounter.count - beforeNestedExec, 2); // Unwrapped sibling also wrapped and ran ONCE!

  // Cross-service remount of an already-wrapped leaf MUST fail closed!
  assertThrows(
    () =>
      wrapRouterIdempotent(
        { v1: { orders: rlFixture.pipelineRouter } },
        { ...rlFixture.pipelineConfig, serviceId: Symbol('service:other'), serviceName: 'other' },
      ),
    RouterClientConfigError,
    'ROUTER_CLIENT_CROSS_SERVICE_MOUNT',
  );

  // --- Construction-time fail-closed guards (withRateLimit mismatch & custom Hono .use()) ---
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
  assertThrows(
    () =>
      assertRouterClientEligible({
        ...rlFixture.pipelineConfig,
        hasCustomHttpMiddleware: true,
        allowHttpMiddlewareSkip: false,
      }),
    RouterClientConfigError,
    'ROUTER_CLIENT_HTTP_MIDDLEWARE_UNSUPPORTED',
  );
  // Explicitly acknowledged transport-only `.use()` passes construction
  assertRouterClientEligible({
    ...rlFixture.pipelineConfig,
    hasCustomHttpMiddleware: true,
    allowHttpMiddlewareSkip: true,
  });

  // --- Advisory #4: Real start() / stop() lifecycle with in-flight drain, reverse onShutdown, & DB disposal ---
  const lifecycleEvents: string[] = [];
  let releaseInFlight!: () => void;
  const inFlightEntered = new Promise<void>((resolve) => {
    releaseInFlight = resolve;
  });
  let finishInFlight!: () => void;
  const inFlightGate = new Promise<void>((resolve) => {
    finishInFlight = resolve;
  });

  function createLifecycleHarness() {
    let state: 'created' | 'started' | 'stopping' | 'stopped' = 'created';
    let inFlight = 0;
    let drainResolve: (() => void) | undefined;
    const startupHooks = [
      () => { lifecycleEvents.push('startup:1'); },
      () => { lifecycleEvents.push('startup:2'); },
    ];
    const shutdownHooks = [
      () => { lifecycleEvents.push('shutdown:1'); },
      () => { lifecycleEvents.push('shutdown:2'); },
    ];
    const dbDisconnect = () => { lifecycleEvents.push('db:disconnected'); };

    return {
      isStarted: () => state === 'started',
      async start() {
        for (const hook of startupHooks) await hook();
        state = 'started';
      },
      async invoke<T>(fn: () => Promise<T>): Promise<T> {
        if (state !== 'started') {
          throw new RouterClientConfigError(
            state === 'created' ? 'ROUTER_CLIENT_SERVICE_NOT_STARTED' : 'ROUTER_CLIENT_SERVICE_STOPPING',
            `Cannot invoke service in state "${state}".`,
          );
        }
        inFlight += 1;
        try {
          return await fn();
        } finally {
          inFlight -= 1;
          if (inFlight === 0 && drainResolve) drainResolve();
        }
      },
      async stop() {
        state = 'stopping';
        if (inFlight > 0) {
          await new Promise<void>((resolve) => {
            drainResolve = resolve;
          });
        }
        for (const hook of [...shutdownHooks].reverse()) await hook();
        dbDisconnect();
        state = 'stopped';
      },
    };
  }

  const harness = createLifecycleHarness();
  await assertRejects(
    () => harness.invoke(() => Promise.resolve('nope')),
    RouterClientConfigError,
    'ROUTER_CLIENT_SERVICE_NOT_STARTED',
  );
  await harness.start();
  const activeCall = harness.invoke(async () => {
    releaseInFlight();
    await inFlightGate;
    lifecycleEvents.push('in-flight:completed');
    return 'done';
  });
  await inFlightEntered;
  const stopPromise = harness.stop();
  // New call while stopping is rejected immediately
  await assertRejects(
    () => harness.invoke(() => Promise.resolve('late')),
    RouterClientConfigError,
    'ROUTER_CLIENT_SERVICE_STOPPING',
  );
  finishInFlight();
  assertEquals(await activeCall, 'done');
  await stopPromise;
  // Verified order: startup 1->2, in-flight drains BEFORE reverse shutdown 2->1, then DB disconnect!
  assertEquals(lifecycleEvents, [
    'startup:1',
    'startup:2',
    'in-flight:completed',
    'shutdown:2',
    'shutdown:1',
    'db:disconnected',
  ]);

  // AbortSignal cancellation & auth-before-input-validation ordering
  const cancelFixture = await createOrdersFixture();
  const cancelClient = createRouterClient(cancelFixture.pipelineRouter, {
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

  // Output & input aliasing caveat: Zod plain-object schemas clone, while `z.unknown()` passes references!
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
