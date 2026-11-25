/**
 * RFC A Empirical Probe 2 — Procedure-pipeline parity & security controls on `createRouterClient`.
 *
 * Proves that once cross-cutting procedure concerns (authentication, contract-meta authorization,
 * internal-audience checks, post-auth logical rate limiting, OTel tracing with ALS detachment,
 * unified requestId/logging, RFC 0001 contribution header projection + cache partitioning, and
 * AbortSignal cancellation) live in an oRPC-native procedure pipeline, `createRouterClient`
 * enforces every procedure-level guarantee without an HTTP `Request` while preserving HTTP parity.
 *
 * Runs against locked `@orpc/*@1.15.5` with Deno resource & ops sanitizers ON.
 *
 * Usage:
 *   mise exec -- deno test --frozen -A .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/router-client-parity.probe.ts
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { assert, assertEquals, assertNotEquals, assertRejects } from '@std/assert';
import { trace, context as otelContext, propagation, SpanKind } from 'npm:@opentelemetry/api@^1.9.1';
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from 'npm:@opentelemetry/sdk-trace-base@^2.7.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.7.1';
import { ORPCError, isDefinedError, safe } from 'npm:@orpc/client@^1.15.5';
import { call, createRouterClient, implement, os } from 'npm:@orpc/server@^1.15.5';
import { ORPCInstrumentation } from 'npm:@orpc/otel@^1.15.5';
import { baseContract } from '@netscript/contracts';
import { createService } from '@netscript/service';
import {
  createCompositeAuthenticator,
  createContractAuthorizer,
  createInternalCredentialAuthenticator,
  createStaticCredentialAuthenticator,
  isInternalServicePrincipal,
  type AuthenticatorPort,
  type AuthnRequest,
  type Principal,
} from '@netscript/service/auth';
import {
  createInstallationSecret,
  deriveInternalCredential,
} from '@netscript/service/internal-credential';
import { authorizeProcedurePolicy } from '../../../../packages/service/src/auth/contract/procedure-policy-decision.ts';
import type { ProcedureAccessPolicy } from '../../../../packages/service/src/auth/contract/contract-policy.ts';
import { createMemoryRateLimitStore, type RateLimitStore } from '@netscript/service/rate-limit';
import { createServiceClient } from '@netscript/sdk/client';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';
import { extractContext, withContext, injectContext, contextWithSpan } from '@netscript/telemetry/context';
import { z } from 'npm:zod@^4.6.5';

// Capture an empty AsyncLocalStorage snapshot at module load (before any caller ALS enters).
const cleanAlsSnapshot = AsyncLocalStorage.snapshot();

// Configure an in-memory OpenTelemetry tracer provider + ORPCInstrumentation once for the probe.
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

// Synthetic contract exercising all access postures + a contract-defined error.
const OrdersContract = {
  health: baseContract
    .route({ method: 'GET', path: '/orders/health' })
    .meta({ access: { authentication: 'none' } })
    .output(z.object({ ok: z.boolean() })),
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
  cancellable: baseContract
    .route({ method: 'POST', path: '/orders/cancellable' })
    .meta({ access: { authentication: 'required' } })
    .input(z.object({ label: z.string() }))
    .output(z.object({ label: z.string() })),
};

// Framework-private brand preventing external callers from forging a pre-verified Principal.
const VERIFIED_PRINCIPAL_BRAND = new WeakSet<Principal>();

function stampVerifiedPrincipal(principal: Principal): Principal {
  VERIFIED_PRINCIPAL_BRAND.add(principal);
  return principal;
}

interface ProcedurePipelineContext {
  /** Prepared lower-case headers (from HTTP Request or RFC 0001 contribution projection). */
  readonly headers?: Readonly<Record<string, string>>;
  /** Optional pre-authenticated principal (only trusted if brand-verified). */
  readonly principal?: Principal;
  /** Unified correlation request ID (propagated from HTTP X-Request-ID or generated once). */
  readonly requestId?: string;
  /** Optional W3C trace headers for explicit trace propagation across in-process calls. */
  readonly traceHeaders?: Readonly<Record<string, string>>;
  /** Test-only hook for asserting ALS isolation inside the handler. */
  readonly onHandlerEnter?: (observed: {
    readonly traceId: string | undefined;
    readonly parentSpanId: string | undefined;
    readonly userAlsValue: string | undefined;
  }) => void;
}

interface AuthLogEvent {
  readonly stage: 'authn' | 'authz';
  readonly decision: 'allow' | 'deny';
  readonly procedure: string;
  readonly requestId: string;
  readonly reason?: string;
  readonly subject?: string;
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
  procedurePath: readonly string[],
): AuthnRequest {
  const h = new Headers();
  if (headers) {
    for (const [k, v] of Object.entries(headers)) h.set(k, v);
  }
  const cookieHeader = h.get('cookie') ?? undefined;
  return {
    method: 'POST',
    path: `/api/rpc/v1/orders/${procedurePath.join('/')}`,
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
 * Composes NetScript's oRPC-native procedure pipeline around the Orders router:
 *   1. Unified requestId injection
 *   2. Procedure-local authn (skipping only if procedure is public OR principal is brand-verified)
 *   3. Procedure-local contract authorization (reads procedure['~orpc'].meta directly, zero path parsing)
 *   4. Post-auth logical rate limiting (keyed by tenant + subject, sharing RateLimitStore with HTTP)
 */
function createProcedurePipelineMiddleware(deps: {
  readonly authenticator: AuthenticatorPort;
  readonly rateLimit?: { readonly store: RateLimitStore; readonly limit: number; readonly windowMs: number };
  readonly authLogs: AuthLogEvent[];
  readonly authnCalls: { count: number };
}) {
  return os
    .$context<ProcedurePipelineContext>()
    .use(async function netscriptProcedurePipeline({ context, path, procedure, signal, next }) {
      const procedureName = path.join('.');
      const requestId = context.requestId ?? context.headers?.['x-request-id'] ?? crypto.randomUUID().slice(0, 8);
      const orpcDef = (procedure as unknown as {
        readonly '~orpc': { readonly meta?: unknown; readonly errorMap?: Record<string, unknown> };
      })['~orpc'];
      const policy = readProcedurePolicy({ '~orpc': orpcDef });
      const isContractDefined = (code: string): boolean =>
        Boolean(orpcDef.errorMap && Object.hasOwn(orpcDef.errorMap, code));

      // 1. Authentication (runs before input validation because router-level os.use shifts inputValidationIndex)
      let principal: Principal | undefined;
      if (policy?.authentication !== 'none') {
        if (context.principal && VERIFIED_PRINCIPAL_BRAND.has(context.principal)) {
          // Pre-authenticated by trusted HTTP edge — do not double-authenticate!
          principal = context.principal;
        } else {
          deps.authnCalls.count += 1;
          let result;
          try {
            result = await deps.authenticator.authenticate(
              toRequestlessAuthnRequest(context.headers, path),
            );
          } catch {
            deps.authLogs.push({ stage: 'authn', decision: 'deny', procedure: procedureName, requestId, reason: 'authn.error' });
            throw new ORPCError('SERVICE_UNAVAILABLE', {
              status: 503,
              message: 'Authentication service unavailable',
              data: { reason: 'authn.error' },
              defined: isContractDefined('SERVICE_UNAVAILABLE'),
            });
          }
          if (!result.ok) {
            deps.authLogs.push({ stage: 'authn', decision: 'deny', procedure: procedureName, requestId, reason: result.reason });
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
          principal = result.principal;
          deps.authLogs.push({ stage: 'authn', decision: 'allow', procedure: procedureName, requestId, subject: principal.subject });
        }

        // 2. Procedure-based contract authorization (zero path matching!)
        const effectivePolicy: ProcedureAccessPolicy = policy ?? {
          authentication: 'required',
          requiredScopes: [],
          requiredRoles: [],
        };
        const decision = authorizeProcedurePolicy(
          { principal, method: 'POST', path: `/api/rpc/v1/orders/${path.join('/')}` },
          effectivePolicy,
          isInternalServicePrincipal,
        );
        if (!decision.allow) {
          deps.authLogs.push({ stage: 'authz', decision: 'deny', procedure: procedureName, requestId, reason: decision.reason, subject: principal.subject });
          throw new ORPCError('FORBIDDEN', {
            status: 403,
            message: decision.reason,
            data: {},
            defined: isContractDefined('FORBIDDEN'),
          });
        }
        deps.authLogs.push({ stage: 'authz', decision: 'allow', procedure: procedureName, requestId, subject: principal.subject });
      }

      // 3. Post-auth logical rate limiting (tenant + subject scoped)
      if (deps.rateLimit && principal) {
        const tenantId = typeof principal.claims.tenantId === 'string' ? principal.claims.tenantId : 'global';
        const quota = await deps.rateLimit.store.consume({
          key: `${tenantId}:${principal.subject}`,
          limit: deps.rateLimit.limit,
          windowMs: deps.rateLimit.windowMs,
          now: Date.now(),
          signal,
        });
        if (!quota.allowed) {
          throw new ORPCError('RATE_LIMITED', {
            status: 429,
            message: 'Too many requests',
            data: {
              retryAfter: Math.max(1, Math.ceil((quota.resetAt - Date.now()) / 1000)),
              limit: deps.rateLimit.limit,
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
}

const userAls = new AsyncLocalStorage<string>();

async function createFixture(rateLimitQuota = 100) {
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
  const authenticator = createCompositeAuthenticator([internalAuth, staticAuth]);
  const sharedRateLimitStore = createMemoryRateLimitStore();
  const authLogs: AuthLogEvent[] = [];
  const authnCalls = { count: 0 };

  const impl = implement(OrdersContract).$context<ProcedurePipelineContext>();
  const rawRouter = impl.router({
    health: impl.health.handler(() => ({ ok: true })),
    getOrder: impl.getOrder.handler(({ input, context, errors }) => {
      const activeSpan = trace.getActiveSpan();
      context.onHandlerEnter?.({
        traceId: activeSpan?.spanContext().traceId,
        parentSpanId: undefined,
        userAlsValue: userAls.getStore(),
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

  const pipelineRouter = createProcedurePipelineMiddleware({
    authenticator,
    rateLimit: { store: sharedRateLimitStore, limit: rateLimitQuota, windowMs: 60_000 },
    authLogs,
    authnCalls,
  }).router(rawRouter);

  return {
    installationSecret,
    authenticator,
    sharedRateLimitStore,
    authLogs,
    authnCalls,
    pipelineRouter,
  };
}

Deno.test('RFC A parity 1: authn, contract authz, internal-audience anti-spoofing, and defined errors hold on createRouterClient', async () => {
  const { installationSecret, pipelineRouter, authLogs } = await createFixture();
  const internalToken = await deriveInternalCredential(installationSecret, 'orders');

  const client = createRouterClient(pipelineRouter, {
    context: (caller: { readonly token?: string; readonly locale?: string; readonly requestId?: string }): ProcedurePipelineContext => ({
      headers: {
        ...(caller.token ? { authorization: `Bearer ${caller.token}` } : {}),
        ...(caller.locale ? { 'accept-language': caller.locale } : {}),
      },
      requestId: caller.requestId,
    }),
  });

  // 1. Public procedure succeeds without credentials
  const health = await client.health(undefined, { context: {} });
  assertEquals(health, { ok: true });

  // 2. Protected procedure fails closed (401 UNAUTHORIZED) without credentials
  const [unauthErr, , unauthDefined] = await safe(client.getOrder({ orderId: 'ord-1' }, { context: {} }));
  assert(unauthErr instanceof ORPCError);
  assertEquals(unauthErr.code, 'UNAUTHORIZED');
  assertEquals(unauthErr.status, 401);
  assertEquals(unauthDefined, true); // matches baseContract UNAUTHORIZED

  // 3. Valid principal with required scope & role succeeds with unified requestId + locale + tenantId
  const order = await client.getOrder(
    { orderId: 'ord-42' },
    { context: { token: 'alice-token', locale: 'de-CH', requestId: 'req-trace-77' } },
  );
  assertEquals(order, {
    orderId: 'ord-42',
    subject: 'user:alice',
    tenantId: 'tenant-a',
    requestId: 'req-trace-77',
    locale: 'de-CH',
  });
  assert(authLogs.some((l) => l.stage === 'authn' && l.decision === 'allow' && l.requestId === 'req-trace-77'));
  assert(authLogs.some((l) => l.stage === 'authz' && l.decision === 'allow' && l.requestId === 'req-trace-77'));

  // 4. Missing scope denied (403 FORBIDDEN)
  const [forbidErr] = await safe(
    client.getOrder({ orderId: 'ord-42' }, { context: { token: 'bob-noscope' } }),
  );
  assert(forbidErr instanceof ORPCError);
  assertEquals(forbidErr.code, 'FORBIDDEN');
  assertEquals(forbidErr.status, 403);
  assert(forbidErr.message.includes('orders:read'));

  // 5. Internal audience rejects spoofed user principal (even with matching subject/roles/claims!)
  const [spoofErr] = await safe(
    client.internalReindex({ batchId: 'b1' }, { context: { token: 'spoof-internal' } }),
  );
  assert(spoofErr instanceof ORPCError);
  assertEquals(spoofErr.code, 'FORBIDDEN');
  assertEquals(spoofErr.status, 403);
  assertEquals(spoofErr.message, 'authz.internal-audience');

  // 6. Genuine internal-credential principal succeeds on internal procedure
  const internalRes = await client.internalReindex(
    { batchId: 'b1' },
    { context: { token: internalToken } },
  );
  assertEquals(internalRes, { accepted: true, subject: 'netscript:internal' });

  // 7. Contract-defined error narrows via isDefinedError() identically to HTTP
  const [lockedErr] = await safe(
    client.getOrder({ orderId: 'locked' }, { context: { token: 'alice-token' } }),
  );
  assert(isDefinedError(lockedErr));
  assertEquals(lockedErr.code, 'ORDER_LOCKED');
  assertEquals(lockedErr.status, 409);
  assertEquals(lockedErr.data, { orderId: 'locked', reason: 'settlement' });

  // 8. Spoofing an unbranded `principal` directly in context is ignored and fails closed
  const rawClient = createRouterClient(pipelineRouter, {
    context: (): ProcedurePipelineContext => ({
      principal: {
        subject: 'user:forged',
        scopes: ['orders:read'],
        roles: ['member'],
        scheme: 'bearer',
        claims: { tenantId: 'tenant-a' },
      },
    }),
  });
  const [forgedErr] = await safe(rawClient.getOrder({ orderId: 'ord-1' }));
  assert(forgedErr instanceof ORPCError);
  assertEquals(forgedErr.code, 'UNAUTHORIZED');
});

Deno.test('RFC A parity 2: shared post-auth logical rate limit enforces identical quota across HTTP and createRouterClient', async () => {
  const { authenticator, pipelineRouter, authnCalls } = await createFixture(2);

  // Mount the exact same pipelineRouter on HTTP (with HTTP edge stamping brand-verified principal so authn runs ONCE!)
  const mountedRouter = { v1: { orders: pipelineRouter } };
  const mountedContract = { v1: { orders: OrdersContract } };
  const running = await createService(mountedRouter, { name: 'orders-shared-quota' })
    .withAuthn({ authenticator })
    .withAuthz({ authorizer: createContractAuthorizer(mountedContract) })
    .withContext((c) => {
      const p = c.get('principal') as Principal | undefined;
      return {
        ...(p ? { principal: stampVerifiedPrincipal(p) } : {}),
        requestId: (c.get('requestId') as string | undefined) ?? 'http-req-1',
      };
    })
    .withRPC({ rpcPath: '/api/rpc' })
    .serve({ hostname: '127.0.0.1', port: 0, handleSignals: false });

  try {
    const bearer = createBearerSdkClientContribution<{ readonly token: string }>({
      context: { token: 'required' },
      resolveCredential: ({ context }) => context.token,
      responseCache: { mode: 'partitioned', partition: ({ context }) => context.token },
    });
    const httpClient = createServiceClient({
      contract: OrdersContract,
      serviceName: 'orders-shared-quota',
      routerName: 'orders',
      resolveServiceUrl: () => `http://127.0.0.1:${running.addr.port}`,
      contributions: [bearer] as const,
    });
    const routerClient = createRouterClient(pipelineRouter, {
      context: (caller: { readonly token: string }): ProcedurePipelineContext => ({
        headers: { authorization: `Bearer ${caller.token}` },
      }),
    });

    // Call 1 via HTTP consumes slot 1/2 (and did NOT double-authenticate inside pipeline!)
    const r1 = await httpClient.getOrder({ orderId: '1' }, { context: { token: 'alice-token' } });
    assertEquals(r1.subject, 'user:alice');
    assertEquals(authnCalls.count, 0); // HTTP edge verified principal; pipeline reused brand-verified principal!

    // Call 2 via createRouterClient consumes slot 2/2 (pipeline authenticates once)
    const r2 = await routerClient.getOrder({ orderId: '2' }, { context: { token: 'alice-token' } });
    assertEquals(r2.subject, 'user:alice');
    assertEquals(authnCalls.count, 1);

    // Call 3 via createRouterClient is DENIED 429 RATE_LIMITED (same tenant-a:user:alice bucket!)
    const [err3] = await safe(routerClient.getOrder({ orderId: '3' }, { context: { token: 'alice-token' } }));
    assert(err3 instanceof ORPCError);
    assertEquals(err3.code, 'RATE_LIMITED');
    assertEquals(err3.status, 429);

    // Call 4 via HTTP is ALSO DENIED 429 RATE_LIMITED (exact parity across transports!)
    const res4 = await safe(httpClient.getOrder({ orderId: '4' }, { context: { token: 'alice-token' } }));
    assertEquals(res4.isSuccess, false);
    if (!res4.isSuccess) {
      assertEquals((res4.error as ORPCError<string, unknown>).code, 'RATE_LIMITED');
    }
  } finally {
    await running.stop();
  }
});

Deno.test('RFC A parity 3: OTel tracing + explicit trace propagation vs ALS/ROOT_CONTEXT detachment on createRouterClient', async () => {
  const { pipelineRouter } = await createFixture();
  const tracer = trace.getTracer('rfc-a-probe');

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
          // Capture W3C trace headers from active caller span before detaching ALS
          const carrier: Record<string, string> = {};
          if (propagateTraceContext) {
            propagation.inject(otelContext.active(), carrier);
          }
          // Detach ALL caller AsyncLocalStorage stores, then explicitly re-attach only W3C trace context if enabled
          return await cleanAlsSnapshot(() =>
            withContext(
              propagateTraceContext ? extractContext(carrier) : extractContext({}),
              () => options.next(),
            )
          );
        },
      ],
    });

  // Case A: propagateTraceContext = true — callee inherits caller traceId, yet user ALS does NOT leak
  spanExporter.reset();
  let observedA: { traceId?: string; userAlsValue?: string } = {};
  let callerTraceIdA = '';
  const propClient = createIsolatedRouterClient(true);
  await userAls.run('caller-secret-als', async () => {
    await tracer.startActiveSpan('caller.op', { kind: SpanKind.CLIENT }, async (span) => {
      callerTraceIdA = span.spanContext().traceId;
      try {
        await propClient.getOrder(
          { orderId: 't-1' },
          {
            context: {
              token: 'alice-token',
              onHandlerEnter: (obs) => {
                observedA = obs;
              },
            },
          },
        );
      } finally {
        span.end();
      }
    });
  });

  const spansA = spanExporter.getFinishedSpans();
  assert(spansA.some((s) => s.name === 'call_procedure'), 'ORPCInstrumentation must emit call_procedure span');
  assert(spansA.some((s) => s.name === 'middleware.netscriptProcedurePipeline'), 'ORPCInstrumentation must emit middleware span');
  assert(spansA.some((s) => s.name === 'handler'), 'ORPCInstrumentation must emit handler span');
  assertEquals(observedA.traceId, callerTraceIdA);
  assertEquals(observedA.userAlsValue, undefined);

  // Case B: propagateTraceContext = false — callee starts fresh detached root trace AND user ALS is detached
  spanExporter.reset();
  let observedB: { traceId?: string; userAlsValue?: string } = {};
  let callerTraceIdB = '';
  const detachedClient = createIsolatedRouterClient(false);
  await userAls.run('caller-secret-als', async () => {
    await tracer.startActiveSpan('caller.detached', { kind: SpanKind.CLIENT }, async (span) => {
      callerTraceIdB = span.spanContext().traceId;
      try {
        await detachedClient.getOrder(
          { orderId: 't-2' },
          {
            context: {
              token: 'alice-token',
              onHandlerEnter: (obs) => {
                observedB = obs;
              },
            },
          },
        );
      } finally {
        span.end();
      }
    });
  });

  assert(observedB.traceId !== undefined);
  assertNotEquals(observedB.traceId, callerTraceIdB);
  assertEquals(observedB.userAlsValue, undefined);
});

Deno.test('RFC A parity 4: AbortSignal cancellation, bare call() pipeline enforcement, and unauthenticated input-validation ordering', async () => {
  const { pipelineRouter } = await createFixture();
  const client = createRouterClient(pipelineRouter, {
    context: (caller: { readonly token?: string }): ProcedurePipelineContext => ({
      headers: caller.token ? { authorization: `Bearer ${caller.token}` } : {},
    }),
  });

  // 1. AbortSignal cancellation
  const ac = new AbortController();
  const pending = client.cancellable(
    { label: 'slow' },
    { context: { token: 'alice-token' }, signal: ac.signal },
  );
  ac.abort(new Error('router-client-aborted'));
  await assertRejects(() => pending, Error, 'router-client-aborted');

  // 2. Bare `call()` on an individual procedure from pipelineRouter STILL enforces authn/authz!
  const [bareErr] = await safe(call(pipelineRouter.getOrder, { orderId: 'bare-1' }, { context: {} }));
  assert(bareErr instanceof ORPCError);
  assertEquals(bareErr.code, 'UNAUTHORIZED');

  // 3. Router-level middleware shifts `inputValidationIndex`, so unauthenticated calls with INVALID input
  //    still fail closed with 401 UNAUTHORIZED (NOT 400 BAD_REQUEST schema leak!).
  const [invalidInputUnauthErr] = await safe(
    client.getOrder({ orderId: 12345 as unknown as string }, { context: {} }),
  );
  assert(invalidInputUnauthErr instanceof ORPCError);
  assertEquals(invalidInputUnauthErr.code, 'UNAUTHORIZED');
});

Deno.test('RFC A parity 5: shared-reference vs Zod output cloning behavior on createRouterClient', async () => {
  const serverRecord = { id: 'rec-1', tags: ['original'] };

  // Procedure WITH Zod output schema (NetScript contract-first norm): Zod parse creates fresh object
  const withOutputSchema = os
    .output(z.object({ id: z.string(), tags: z.array(z.string()) }))
    .handler(() => serverRecord);

  // Procedure WITHOUT output schema: returns exact JS reference (aliasing hazard!)
  const withoutOutputSchema = os.handler(() => serverRecord);

  const resWithSchema = await call(withOutputSchema, undefined);
  resWithSchema.tags.push('mutated-by-caller');
  assertEquals(serverRecord.tags, ['original']); // Zod output validation isolated serverRecord!

  const resWithoutSchema = await call(withoutOutputSchema, undefined);
  resWithoutSchema.tags.push('mutated-by-caller');
  assertEquals(serverRecord.tags, ['original', 'mutated-by-caller']); // Demonstrates aliasing hazard!
});
