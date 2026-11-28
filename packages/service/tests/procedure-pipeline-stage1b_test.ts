import { AsyncLocalStorage } from 'node:async_hooks';
import { assert, assertEquals, assertExists, assertRejects, assertThrows } from '@std/assert';
import { configure, type LogRecord, resetLogging } from '@netscript/logger';
import { getRootContext, withContext } from '@netscript/telemetry/context';
import { context as otelContext, ROOT_CONTEXT, trace } from 'npm:@opentelemetry/api@^1.9.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { isDefinedError, safe } from '@orpc/client';
import {
  call,
  createRouterClient,
  eventIterator,
  getEventMeta,
  implement,
  ORPCError,
  os,
  withEventMeta,
} from '@orpc/server';
import { z } from 'zod';
import { baseContract } from '@netscript/contracts';
import {
  type ActiveAsyncStoreProbe,
  AsyncContextRootCaptureError,
  type AuthenticatorPort,
  type AuthnRequest,
  type AuthnResult,
  type AuthnSideEffects,
  createContractAuthorizer,
  createService,
  type MatchAwareAuthorizerPort,
  type Principal,
  type ProcedureAuthorizerPort,
} from '../mod.ts';
import {
  createCompositeAuthenticator,
  createInstallationSecret,
  createInternalCredentialAuthenticator,
  createStaticCredentialAuthenticator,
  deriveInternalCredential,
  isInternalServicePrincipal,
} from '../src/auth/mod.ts';
import {
  brandVerifiedPrincipal,
  createRequestPrincipalScope,
  hasVerifiedPrincipalBrand,
  isVerifiedPrincipalTrusted,
} from '../src/runtime/verified-principal.ts';
import {
  ACTIVE_ASYNC_STORE_PROBES_SYMBOL,
  captureCleanAsyncRootOrThrow,
  wrapDetachedAsyncIterator,
} from '../src/runtime/async-context-isolation.ts';
import { getStartedServiceInternals } from '../src/runtime/started-service.ts';
import { createMemoryRateLimitStore, type RateLimitStore } from '../src/rate-limit/mod.ts';

const OrdersStage1bContract = {
  health: baseContract
    .route({ method: 'GET', path: '/orders/health' })
    .meta({ access: { authentication: 'none' } })
    .output(z.object({ ok: z.boolean() })),
  unmarkedOp: baseContract
    .route({ method: 'POST', path: '/orders/unmarked' })
    .input(z.object({ value: z.string().min(1) }))
    .output(z.object({ echoed: z.string(), subject: z.string() })),
  getOrder: baseContract
    .route({ method: 'POST', path: '/orders/get' })
    .meta({
      access: {
        authentication: 'required',
        authorization: { scopes: ['orders:read'], roles: ['member'] },
      },
    })
    .input(z.object({ orderId: z.string().min(1) }))
    .output(z.object({ orderId: z.string(), subject: z.string() })),
  internalReindex: baseContract
    .route({ method: 'POST', path: '/orders/internal/reindex' })
    .meta({
      access: {
        authentication: 'required',
        audience: 'internal',
      },
    })
    .input(z.object({ batchId: z.string().min(1) }))
    .output(z.object({ accepted: z.boolean(), subject: z.string() })),
  streamEvents: baseContract
    .route({ method: 'GET', path: '/orders/stream' })
    .meta({
      access: {
        authentication: 'required',
        authorization: { scopes: ['orders:read'] },
      },
    })
    .output(eventIterator(z.object({ seq: z.number().int(), als: z.string().nullable() }))),
};

function createTestAuthenticator(overrides?: {
  readonly extraAuthenticators?: readonly AuthenticatorPort[];
  readonly onAuthenticate?: (req: AuthnRequest) => void;
}) {
  const staticAuth = createStaticCredentialAuthenticator({
    scheme: 'bearer',
    credentials: {
      'alice-token': {
        subject: 'user:alice',
        scopes: ['orders:read'],
        roles: ['member'],
        claims: { tenantId: 'tenant-a', nested: { role: 'owner' } },
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
        roles: ['service'],
        claims: { audience: 'orders' },
      },
    },
  });
  const composite = createCompositeAuthenticator([
    ...(overrides?.extraAuthenticators ?? []),
    staticAuth,
  ]);
  const calls = { count: 0, requests: [] as AuthnRequest[] };
  const authenticator: AuthenticatorPort = {
    mayEmitSetCookies: overrides?.extraAuthenticators?.some((a) => a.mayEmitSetCookies),
    mayEmitResponseHeaders: overrides?.extraAuthenticators?.some((a) => a.mayEmitResponseHeaders),
    async authenticate(request: AuthnRequest): Promise<AuthnResult> {
      calls.count += 1;
      calls.requests.push(request);
      overrides?.onAuthenticate?.(request);
      return await composite.authenticate(request);
    },
  };
  return { authenticator, calls };
}

Deno.test('Stage 1b: captureCleanAsyncRootOrThrow rejects active ALS probes, active spans, and non-span OTel context', async () => {
  const localAls = new AsyncLocalStorage<string>();
  const probe: ActiveAsyncStoreProbe = {
    name: 'test.stage1b.als',
    isActive: () => localAls.getStore() !== undefined,
  };
  const existing: unknown = Reflect.get(globalThis, ACTIVE_ASYNC_STORE_PROBES_SYMBOL);
  const registry = existing instanceof Set
    ? (existing as Set<ActiveAsyncStoreProbe>)
    : new Set<ActiveAsyncStoreProbe>();
  if (!(existing instanceof Set)) {
    Reflect.set(globalThis, ACTIVE_ASYNC_STORE_PROBES_SYMBOL, registry);
  }
  registry.add(probe);
  otelContext.disable();
  const otelManager = new AsyncLocalStorageContextManager().enable();
  otelContext.setGlobalContextManager(otelManager);

  try {
    // 1. Clean composition root succeeds.
    const runner = captureCleanAsyncRootOrThrow();
    assertEquals(runner.runDetached(() => localAls.getStore()), undefined);

    // 2. Active registered ALS probe fails closed.
    localAls.run('tenant-poison', () => {
      const err = assertThrows(() => captureCleanAsyncRootOrThrow(), AsyncContextRootCaptureError);
      assertEquals(err.code, 'ASYNC_CONTEXT_ROOT_CAPTURE_FAILED');
      assert(err.activeSources.includes('test.stage1b.als'));
    });

    // 3. Active non-span OTel context (ROOT_CONTEXT.setValue) fails closed even with no active span.
    const nonSpanKey = Symbol('non-span-otel-value');
    const customOtelCtx = getRootContext().setValue(nonSpanKey, 'ambient-baggage');
    withContext(customOtelCtx, () => {
      const err = assertThrows(() => captureCleanAsyncRootOrThrow(), AsyncContextRootCaptureError);
      assertEquals(err.code, 'ASYNC_CONTEXT_ROOT_CAPTURE_FAILED');
      assert(err.activeSources.includes('@opentelemetry/api.activeContext'));
    });

    // 4. Active OTel span fails closed.
    const activeSpanCtx = trace.setSpanContext(ROOT_CONTEXT, {
      traceId: '11111111111111111111111111111111',
      spanId: '2222222222222222',
      traceFlags: 1,
    });
    withContext(activeSpanCtx, () => {
      const err = assertThrows(() => captureCleanAsyncRootOrThrow(), AsyncContextRootCaptureError);
      assertEquals(err.code, 'ASYNC_CONTEXT_ROOT_CAPTURE_FAILED');
      assert(err.activeSources.includes('@opentelemetry/api.activeSpan'));
    });

    // 5. ServiceBuilder.start() rejects inside an active ALS scope.
    await localAls.run('tenant-in-start', async () => {
      const builder = createService({}, { name: 'poisoned-start' }).withRPC();
      await assertRejects(() => builder.start(), AsyncContextRootCaptureError);
    });
  } finally {
    otelContext.disable();
    otelManager.disable();
    registry.delete(probe);
  }
});

Deno.test('Stage 1b: ServiceBuilder.start() runs startup hooks, drains in-flight calls/streams, runs reverse onShutdown, and disconnects DBs', async () => {
  const events: string[] = [];
  const gate = Promise.withResolvers<void>();
  const entered = Promise.withResolvers<void>();

  const contract = {
    slow: baseContract
      .route({ method: 'POST', path: '/slow' })
      .meta({ access: { authentication: 'none' } })
      .output(z.object({ done: z.boolean() })),
  };
  const impl = implement(contract);
  const router = impl.router({
    slow: impl.slow.handler(async () => {
      entered.resolve();
      await gate.promise;
      events.push('handler-finished');
      return { done: true };
    }),
  });

  let dbDisconnects = 0;
  const fakeDb = {
    $queryRaw: () => Promise.resolve(1),
    $disconnect: async () => {
      await Promise.resolve();
      dbDisconnects += 1;
      events.push('db-disconnected');
    },
  };

  const builder = createService(router, { name: 'lifecycle-service' })
    .withDatabase(fakeDb)
    .onStartup(async () => {
      await Promise.resolve();
      events.push('startup-1');
    })
    .onStartup(async () => {
      await Promise.resolve();
      events.push('startup-2');
    })
    .onShutdown(() => {
      events.push('shutdown-1');
    })
    .onShutdown(() => {
      events.push('shutdown-2');
    })
    .withRPC();

  const started = await builder.start({ drainTimeoutMs: 5_000 });
  assertEquals(started.name, 'lifecycle-service');
  assertEquals(events, ['startup-1', 'startup-2']);

  // Calling start() a second time rejects cleanly.
  await assertRejects(() => builder.start(), Error, 'already called');

  // Start an in-flight call.
  const inFlightResponsePromise = started.app.request('/api/rpc/slow', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ json: {} }),
  });
  await entered.promise;

  // Begin graceful stop: immediately refuses new calls with 503 while waiting for in-flight work.
  const stopPromise1 = started.stop();
  const stopPromise2 = started.stop();

  const rejectedDuringStop = await started.app.request('/api/rpc/slow', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ json: {} }),
  });
  assertEquals(rejectedDuringStop.status, 503);

  // Release the in-flight call and confirm drain -> reverse onShutdown -> DB disconnect.
  gate.resolve();
  const inFlightRes = await inFlightResponsePromise;
  assertEquals(inFlightRes.status, 200);

  await Promise.all([stopPromise1, stopPromise2]);
  assertEquals(dbDisconnects, 1);
  assertEquals(events, [
    'startup-1',
    'startup-2',
    'handler-finished',
    'shutdown-2',
    'shutdown-1',
    'db-disconnected',
  ]);

  // Calling start() after build() is also rejected.
  const builtFirst = createService({}, { name: 'built-first' }).withRPC();
  builtFirst.build();
  await assertRejects(() => builtFirst.start(), Error, 'must be called before build()');
});

Deno.test('Stage 1b: ProcedureAuthorizerPort achieves HTTP & procedure-pipeline parity and rejects dual fallbacks', async () => {
  // 1. Reject dual fallback implementing BOTH authorizeMatch and authorizeProcedure.
  const dualFallback: MatchAwareAuthorizerPort & ProcedureAuthorizerPort = {
    authorize: () => ({ allow: true }),
    authorizeMatch: () => ({ matched: true, decision: { allow: true } }),
    authorizeProcedure: () => ({ matched: true, decision: { allow: true } }),
  };
  assertThrows(
    () => createContractAuthorizer(OrdersStage1bContract, { fallback: dualFallback }),
    TypeError,
    'cannot implement both authorizeMatch and authorizeProcedure',
  );

  // 2. ProcedureAuthorizerPort works identically on HTTP (RPC + OpenAPI) and direct wrapped router.
  const seenPaths: string[] = [];
  const procedureFallback: ProcedureAuthorizerPort = {
    authorizeProcedure({ principal, procedurePath }) {
      const joined = procedurePath.join('.');
      seenPaths.push(joined);
      if (joined === 'unmarkedOp') {
        return {
          matched: true,
          decision: principal.scopes.includes('orders:read')
            ? { allow: true }
            : { allow: false, reason: 'authz.missing-scope:orders:read' },
        };
      }
      return { matched: false };
    },
  };

  const { authenticator } = createTestAuthenticator();
  const impl = implement(OrdersStage1bContract).$context<{ principal?: Principal }>();
  const rawRouter = impl.router({
    health: impl.health.handler(() => ({ ok: true })),
    unmarkedOp: impl.unmarkedOp.handler(({ input, context }) => ({
      echoed: input.value,
      subject: context.principal?.subject ?? 'anon',
    })),
    getOrder: impl.getOrder.handler(({ input, context }) => ({
      orderId: input.orderId,
      subject: context.principal?.subject ?? 'anon',
    })),
    internalReindex: impl.internalReindex.handler(({ context }) => ({
      accepted: true,
      subject: context.principal?.subject ?? 'anon',
    })),
    streamEvents: impl.streamEvents.handler(async function* () {
      yield { seq: 1, als: null };
    }),
  });

  const started = await createService(rawRouter, { name: 'proc-fallback-parity' })
    .withAuthn({ authenticator })
    .withAuthz({
      authorizer: createContractAuthorizer(OrdersStage1bContract, { fallback: procedureFallback }),
    })
    .withRPC()
    .start();

  try {
    // HTTP RPC allowed for Alice, denied 403 for Bob.
    const rpcAlice = await started.app.request('/api/rpc/unmarkedOp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer alice-token' },
      body: JSON.stringify({ json: { value: 'hello' } }),
    });
    assertEquals(rpcAlice.status, 200);
    assertEquals((await rpcAlice.json()).json, { echoed: 'hello', subject: 'user:alice' });

    const rpcBob = await started.app.request('/api/rpc/unmarkedOp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer bob-noscope' },
      body: JSON.stringify({ json: { value: 'hello' } }),
    });
    assertEquals(rpcBob.status, 403);
    assertEquals((await rpcBob.json()).message, 'authz.missing-scope:orders:read');

    // HTTP OpenAPI allowed for Alice, denied 403 for Bob.
    const restAlice = await started.app.request('/api/orders/unmarked', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer alice-token' },
      body: JSON.stringify({ value: 'rest-hello' }),
    });
    assertEquals(restAlice.status, 200);

    // Direct wrapped router call matches HTTP identically!
    const internals = getStartedServiceInternals(started);
    assertExists(internals);
    const wrapped = internals.wrappedRouter as typeof rawRouter;

    const directAlice = await call(wrapped.unmarkedOp, { value: 'direct' }, {
      context: { headers: { authorization: 'Bearer alice-token' } } as Record<string, unknown>,
    });
    assertEquals(directAlice, { echoed: 'direct', subject: 'user:alice' });

    const directBob = await safe(
      call(wrapped.unmarkedOp, { value: 'direct' }, {
        context: { headers: { authorization: 'Bearer bob-noscope' } } as Record<string, unknown>,
      }),
    );
    assertEquals(directBob.isSuccess, false);
    assert(isDefinedError(directBob.error));
    assertEquals(directBob.error.code, 'FORBIDDEN');
    assertEquals(directBob.error.message, 'authz.missing-scope:orders:read');
    assert(seenPaths.every((p) => p === 'unmarkedOp'));
  } finally {
    await started.stop();
  }
});

Deno.test('Stage 1b: hardened VerifiedPrincipalRecord defeats replay, NaN exp, internal-audience tampering, and preserves HTTP single-authn', async () => {
  const secret = await createInstallationSecret(new Uint8Array(32).fill(9));
  const ordersInternalAuth = createInternalCredentialAuthenticator({
    secret,
    service: 'orders',
    scopes: ['orders:read'],
    roles: ['service'],
  });
  const billingInternalAuth = createInternalCredentialAuthenticator({
    secret,
    service: 'billing',
    scopes: ['billing:write'],
    roles: ['service'],
  });
  const ordersInternalToken = await deriveInternalCredential(secret, 'orders');

  // 1. Static and internal authenticators clone and deep-freeze claims/scopes/roles per call.
  const staticAuth = createStaticCredentialAuthenticator({
    scheme: 'bearer',
    credentials: {
      'tok-1': {
        subject: 'user:1',
        scopes: ['orders:read'],
        roles: ['member'],
        claims: { tenantId: 't1', nested: { flag: true } },
      },
    },
  });
  const makeReq = (token: string): AuthnRequest => ({
    method: 'IN_PROCESS',
    path: 'orpc://orders/getOrder',
    header: (name) => name.toLowerCase() === 'authorization' ? `Bearer ${token}` : undefined,
    headers: () => new Headers({ authorization: `Bearer ${token}` }),
    cookie: () => undefined,
  });
  const res1 = await staticAuth.authenticate(makeReq('tok-1'));
  const res2 = await staticAuth.authenticate(makeReq('tok-1'));
  assert(res1.ok && res2.ok);
  assert(res1.principal !== res2.principal, 'static auth must return a fresh Principal per call');
  assert(res1.principal.claims !== res2.principal.claims, 'claims must be cloned per call');
  assert(Object.isFrozen(res1.principal.claims));
  assert(Object.isFrozen(res1.principal.claims.nested));
  assertThrows(() => {
    (res1.principal.claims as Record<string, unknown>).audience = 'billing';
  }, TypeError);

  const intRes = await ordersInternalAuth.authenticate(makeReq(ordersInternalToken));
  assert(intRes.ok);
  assert(isInternalServicePrincipal(intRes.principal));
  assert(Object.isFrozen(intRes.principal.claims));
  assertThrows(() => {
    (intRes.principal.claims as Record<string, unknown>).audience = 'billing';
  }, TypeError);

  // 2. Overlapping live brands on same Principal reference are rejected, and end() deletes WeakMap entry.
  const serviceA = Symbol('orders');
  const serviceB = Symbol('billing');
  const scope1 = createRequestPrincipalScope();
  brandVerifiedPrincipal(res1.principal, {
    serviceId: serviceA,
    serviceName: 'orders',
    authenticator: staticAuth,
    verifiedAtMs: 1_000,
    maxTrustTtlMs: 60_000,
    requestScope: scope1,
  });
  assertEquals(hasVerifiedPrincipalBrand(res1.principal), true);

  const scope2 = createRequestPrincipalScope();
  assertThrows(
    () =>
      brandVerifiedPrincipal(res1.principal, {
        serviceId: serviceA,
        serviceName: 'orders',
        authenticator: staticAuth,
        verifiedAtMs: 1_500,
        requestScope: scope2,
      }),
    Error,
    'Overlapping live verified principal brand',
  );
  scope2.end();

  // 3. Cross-service trust requires explicit opt-in and is NEVER honored for audience: 'internal'.
  assertEquals(
    isVerifiedPrincipalTrusted(res1.principal, {
      serviceId: serviceB,
      serviceName: 'billing',
      nowMs: 2_000,
      requireInternalAudience: false,
      usesDefaultInternalPredicate: true,
    }).trusted,
    false,
  );
  assertEquals(
    isVerifiedPrincipalTrusted(res1.principal, {
      serviceId: serviceB,
      serviceName: 'billing',
      nowMs: 2_000,
      requireInternalAudience: false,
      usesDefaultInternalPredicate: true,
      trustSharedPrincipal: true,
      trustedVerifiers: new Set([staticAuth]),
    }).trusted,
    true,
  );
  scope1.end();
  assertEquals(
    hasVerifiedPrincipalBrand(res1.principal),
    false,
    'ending requestScope must delete WeakMap entry immediately',
  );

  // 4. Internal principal for orders cannot be admitted on billing even with trustSharedPrincipal.
  const intScope = createRequestPrincipalScope();
  brandVerifiedPrincipal(intRes.principal, {
    serviceId: serviceA,
    serviceName: 'orders',
    authenticator: ordersInternalAuth,
    verifiedAtMs: 1_000,
    requestScope: intScope,
  });
  assertEquals(
    isVerifiedPrincipalTrusted(intRes.principal, {
      serviceId: serviceA,
      serviceName: 'orders',
      nowMs: 2_000,
      requireInternalAudience: true,
      usesDefaultInternalPredicate: true,
    }).trusted,
    true,
  );
  assertEquals(
    isVerifiedPrincipalTrusted(intRes.principal, {
      serviceId: serviceB,
      serviceName: 'billing',
      nowMs: 2_000,
      requireInternalAudience: true,
      usesDefaultInternalPredicate: true,
      trustSharedPrincipal: true,
      trustedVerifiers: new Set([ordersInternalAuth, billingInternalAuth]),
    }).trusted,
    false,
  );
  intScope.end();

  // 5. NaN / non-finite / expired claims.exp ALWAYS fail closed.
  for (const badExp of [Number.NaN, Number.POSITIVE_INFINITY, 'not-a-number', 1]) {
    const badPrincipal: Principal = {
      subject: 'user:bad-exp',
      scopes: ['orders:read'],
      roles: ['member'],
      scheme: 'bearer',
      claims: { exp: badExp },
    };
    const badScope = createRequestPrincipalScope();
    brandVerifiedPrincipal(badPrincipal, {
      serviceId: serviceA,
      serviceName: 'orders',
      authenticator: staticAuth,
      verifiedAtMs: 10_000,
      requestScope: badScope,
    });
    assertEquals(
      isVerifiedPrincipalTrusted(badPrincipal, {
        serviceId: serviceA,
        serviceName: 'orders',
        nowMs: 10_000,
        requireInternalAudience: false,
        usesDefaultInternalPredicate: true,
      }).trusted,
      false,
      `exp=${String(badExp)} must fail closed`,
    );
    badScope.end();
  }

  // 6. Revocation hook invalidates immediately.
  let revoked = false;
  const revScope = createRequestPrincipalScope();
  brandVerifiedPrincipal(res2.principal, {
    serviceId: serviceA,
    serviceName: 'orders',
    authenticator: staticAuth,
    verifiedAtMs: 1_000,
    requestScope: revScope,
    isRevoked: () => revoked,
  });
  assertEquals(
    isVerifiedPrincipalTrusted(res2.principal, {
      serviceId: serviceA,
      serviceName: 'orders',
      nowMs: 2_000,
      requireInternalAudience: false,
      usesDefaultInternalPredicate: true,
    }).trusted,
    true,
  );
  revoked = true;
  assertEquals(
    isVerifiedPrincipalTrusted(res2.principal, {
      serviceId: serviceA,
      serviceName: 'orders',
      nowMs: 2_000,
      requireInternalAudience: false,
      usesDefaultInternalPredicate: true,
    }).trusted,
    false,
  );
  revScope.end();

  // 7. Single-authn on HTTP (`AuthenticatorPort` invoked ONCE) & post-request principal replay blocked!
  const { authenticator, calls } = createTestAuthenticator({
    extraAuthenticators: [ordersInternalAuth],
  });
  let capturedPrincipal: Principal | undefined;
  const impl = implement(OrdersStage1bContract).$context<{ principal?: Principal }>();
  const rawRouter = impl.router({
    health: impl.health.handler(() => ({ ok: true })),
    unmarkedOp: impl.unmarkedOp.handler(({ input, context }) => ({
      echoed: input.value,
      subject: context.principal?.subject ?? 'anon',
    })),
    getOrder: impl.getOrder.handler(({ input, context }) => {
      capturedPrincipal = context.principal;
      return { orderId: input.orderId, subject: context.principal?.subject ?? 'anon' };
    }),
    internalReindex: impl.internalReindex.handler(({ context }) => ({
      accepted: true,
      subject: context.principal?.subject ?? 'anon',
    })),
    streamEvents: impl.streamEvents.handler(async function* () {
      yield { seq: 1, als: null };
    }),
  });

  const started = await createService(rawRouter, { name: 'orders' })
    .withAuthn({ authenticator })
    .withAuthz({ authorizer: createContractAuthorizer(OrdersStage1bContract) })
    .withRPC()
    .start();

  try {
    const httpRes = await started.app.request('/api/rpc/getOrder', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer alice-token' },
      body: JSON.stringify({ json: { orderId: 'ord-1' } }),
    });
    assertEquals(httpRes.status, 200);
    assertEquals(calls.count, 1, 'HTTP edge + procedure pipeline must authenticate strictly once');
    assertExists(capturedPrincipal);
    assertEquals(
      hasVerifiedPrincipalBrand(capturedPrincipal),
      false,
      'HTTP finally must clear brand after request finishes',
    );

    // Replaying capturedPrincipal after the HTTP request ended must fail closed with 401!
    const internals = getStartedServiceInternals(started);
    assertExists(internals);
    const wrapped = internals.wrappedRouter as typeof rawRouter;
    const replay = await safe(
      call(wrapped.getOrder, { orderId: 'ord-2' }, {
        context: { principal: capturedPrincipal } as Record<string, unknown>,
      }),
    );
    assertEquals(replay.isSuccess, false);
    assert(isDefinedError(replay.error));
    assertEquals(replay.error.code, 'UNAUTHORIZED');
  } finally {
    await started.stop();
  }
});

Deno.test('Stage 1b: procedure pipeline enforces auth-before-validation/quota, pre-authenticate cookie sinks, non-HTTP audit logs, and streaming ALS/EventMeta isolation', async () => {
  const records: LogRecord[] = [];
  await configure({
    reset: true,
    sinks: { memory: (record: LogRecord) => records.push(record) },
    loggers: [
      { category: ['netscript'], sinks: ['memory'], lowestLevel: 'debug' },
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'warning' },
    ],
  });

  const consumerAls = new AsyncLocalStorage<string>();
  const streamEventsLog: string[] = [];

  try {
    let refreshTokenBurned = 0;
    const cookieRotatingAuth: AuthenticatorPort = {
      mayEmitSetCookies: true,
      authenticate(request: AuthnRequest): AuthnResult {
        if (!request.cookie('sid')) {
          return { ok: false, reason: 'missing-credential' };
        }
        refreshTokenBurned += 1;
        return {
          ok: true,
          principal: Object.freeze({
            subject: 'user:cookie-session',
            scopes: ['orders:read'],
            roles: ['member'],
            scheme: 'custom',
            claims: Object.freeze({ tenantId: 'tenant-c' }),
          }),
          setCookies: ['sid=rotated-token; HttpOnly; Path=/'],
          responseHeaders: { 'x-auth-rotated': '1' },
        };
      },
    };

    const { authenticator, calls } = createTestAuthenticator({
      extraAuthenticators: [cookieRotatingAuth],
    });
    let quotaConsumes = 0;
    const backingStore = createMemoryRateLimitStore();
    const countingStore: RateLimitStore = {
      consume: (req) => {
        quotaConsumes += 1;
        return backingStore.consume(req);
      },
    };

    const impl = implement(OrdersStage1bContract).$context<{ principal?: Principal }>();
    const rawRouter = {
      ...impl.router({
        health: impl.health.handler(() => ({ ok: true })),
        unmarkedOp: impl.unmarkedOp.handler(({ input, context }) => ({
          echoed: input.value,
          subject: context.principal?.subject ?? 'anon',
        })),
        getOrder: impl.getOrder.handler(({ input, context }) => ({
          orderId: input.orderId,
          subject: context.principal?.subject ?? 'anon',
        })),
        internalReindex: impl.internalReindex.handler(({ context }) => ({
          accepted: true,
          subject: context.principal?.subject ?? 'anon',
        })),
        streamEvents: impl.streamEvents.handler(async function* () {
          try {
            for (let seq = 1; seq <= 3; seq += 1) {
              yield withEventMeta(
                { seq, als: consumerAls.getStore() ?? null },
                { id: `evt-${seq}`, retry: 2500 },
              );
            }
          } catch (err) {
            streamEventsLog.push(`throw:${consumerAls.getStore() ?? 'clean'}:${String(err)}`);
            throw err;
          } finally {
            streamEventsLog.push(`finally:${consumerAls.getStore() ?? 'clean'}`);
          }
        }),
      }),
      // Extra router leaf NOT present in OrdersStage1bContract claiming authentication: 'none'.
      undocumentedBypass: os
        .meta({ access: { authentication: 'none' } })
        .handler(() => ({ leaked: true })),
    };

    const started = await createService(rawRouter, { name: 'orders' })
      .withAuthn({ authenticator })
      .withAuthz({ authorizer: createContractAuthorizer(OrdersStage1bContract) })
      .withProcedureRateLimit({
        limit: 10,
        windowMs: 60_000,
        store: countingStore,
      })
      .withRPC()
      .start();

    try {
      const internals = getStartedServiceInternals(started);
      assertExists(internals);
      const wrapped = internals.wrappedRouter as typeof rawRouter;

      // 1. Pre-authenticate() cookie-sink check blocks BEFORE calling authenticate() -> refresh token NOT burned!
      const missingCookieSink = await safe(
        call(wrapped.getOrder, { orderId: 'ord-1' }, {
          context: { headers: { cookie: 'sid=single-use-1' } } as Record<string, unknown>,
        }),
      );
      assertEquals(missingCookieSink.isSuccess, false);
      assertEquals(missingCookieSink.error instanceof ORPCError, true);
      assertEquals(
        (missingCookieSink.error as ORPCError<string, unknown>).message,
        'authn.set-cookies-sink-required',
      );
      assertEquals(
        refreshTokenBurned,
        0,
        'single-use refresh token must NEVER be burned without sink',
      );
      assertEquals(
        calls.count,
        0,
        'authenticate() must not be invoked when required sink is absent',
      );

      // 2. Atomic post-authenticate() check: providing onSetCookies but missing onResponseHeaders invokes NEITHER!
      const receivedCookies: string[] = [];
      const partialSink = await safe(
        call(wrapped.getOrder, { orderId: 'ord-1' }, {
          context: {
            headers: { cookie: 'sid=single-use-2' },
            authnSideEffects: {
              onSetCookies: (cookies) => receivedCookies.push(...cookies),
            } satisfies AuthnSideEffects,
          } as Record<string, unknown>,
        }),
      );
      assertEquals(partialSink.isSuccess, false);
      assertEquals(
        (partialSink.error as ORPCError<string, unknown>).message,
        'authn.response-headers-sink-required',
      );
      assertEquals(
        receivedCookies,
        [],
        'atomic post-check must not invoke onSetCookies when onResponseHeaders is missing',
      );

      // 3. Providing both sinks succeeds and forwards both cookies and responseHeaders.
      const capturedHeaders: Array<Readonly<Record<string, string>>> = [];
      const fullSinkResult = await call(wrapped.getOrder, { orderId: 'ord-ok' }, {
        context: {
          headers: { cookie: 'sid=single-use-3' },
          authnSideEffects: {
            onSetCookies: (cookies) => receivedCookies.push(...cookies),
            onResponseHeaders: (headers) => capturedHeaders.push(headers),
          } satisfies AuthnSideEffects,
        } as Record<string, unknown>,
      });
      assertEquals(fullSinkResult, { orderId: 'ord-ok', subject: 'user:cookie-session' });
      assertEquals(receivedCookies, ['sid=rotated-token; HttpOnly; Path=/']);
      assertEquals(capturedHeaders, [{ 'x-auth-rotated': '1' }]);

      // 4. Auth runs BEFORE Zod input validation and BEFORE procedure rate limit (quotaConsumes unchanged!).
      const quotaBeforeDenied = quotaConsumes;
      const unauthInvalidInput = await safe(
        call(wrapped.getOrder, { orderId: '' }, {
          context: {
            headers: {},
            authnSideEffects: { onSetCookies: () => {} },
          } as Record<string, unknown>,
        }),
      );
      assertEquals(unauthInvalidInput.isSuccess, false);
      assert(isDefinedError(unauthInvalidInput.error));
      assertEquals(unauthInvalidInput.error.code, 'UNAUTHORIZED');
      assertEquals(quotaConsumes, quotaBeforeDenied);

      // 5. Unmarked contract procedure without fallback denies 403 authz.no-matching-rule,
      //    and undocumented router leaf NOT in contract also fails closed!
      const unmarkedDenied = await safe(
        call(wrapped.unmarkedOp, { value: 'nope' }, {
          context: {
            headers: { authorization: 'Bearer alice-token' },
            authnSideEffects: { onSetCookies: () => {} },
          } as Record<string, unknown>,
        }),
      );
      assertEquals(unmarkedDenied.isSuccess, false);
      assert(isDefinedError(unmarkedDenied.error));
      assertEquals(unmarkedDenied.error.code, 'FORBIDDEN');
      assertEquals(unmarkedDenied.error.message, 'authz.no-matching-rule');

      const undocumentedDenied = await safe(
        call(wrapped.undocumentedBypass, undefined, {
          context: {
            headers: { authorization: 'Bearer alice-token' },
            authnSideEffects: { onSetCookies: () => {} },
          } as Record<string, unknown>,
        }),
      );
      assertEquals(undocumentedDenied.isSuccess, false);
      assertEquals((undocumentedDenied.error as ORPCError<string, unknown>).code, 'FORBIDDEN');

      // 6. Non-HTTP AuthnRequest uses IN_PROCESS + orpc://<service>/<procedure> and logs structured audit fields.
      const lastReq = calls.requests.at(-1);
      assertExists(lastReq);
      assertEquals(lastReq.method, 'IN_PROCESS');
      assertEquals(lastReq.path, 'orpc://orders/undocumentedBypass');

      const inProcessAudit = records.find((r) =>
        r.properties.transport === 'in-process' &&
        r.properties.stage === 'authz' &&
        r.properties.procedure === 'unmarkedOp' &&
        r.properties.decision === 'deny'
      );
      assertExists(inProcessAudit);
      assertEquals(inProcessAudit.properties.method, 'IN_PROCESS');
      assertEquals(inProcessAudit.properties.path, 'orpc://orders/unmarkedOp');
      assert(typeof inProcessAudit.properties.requestId === 'string');
      assert(typeof inProcessAudit.properties.subjectHash === 'string');

      // 7. Streaming eventIterator isolates consumer ALS on next(), return(), throw(), and await using while preserving EventMeta!
      const client = createRouterClient(wrapped, {
        context: {
          headers: { authorization: 'Bearer alice-token' },
          authnSideEffects: { onSetCookies: () => {} },
        } as Record<string, unknown>,
      });

      const iter1 = await consumerAls.run('caller-open', () => client.streamEvents());
      assertEquals(internals.tracker.inFlightCount(), 1, 'live stream must hold in-flight slot');
      const pulled: Array<{ seq: number; als: string | null; metaId?: string; retry?: number }> =
        [];
      for (let i = 0; i < 3; i += 1) {
        const step = await consumerAls.run(`caller-pull-${i}`, () => iter1.next());
        if (step.done) {
          throw new Error(`Expected streaming item ${i + 1}, got done`);
        }
        const meta = getEventMeta(step.value);
        pulled.push({ ...step.value, metaId: meta?.id, retry: meta?.retry });
      }
      const endStep = await consumerAls.run('caller-end', () => iter1.next());
      assertEquals(endStep.done, true);
      assertEquals(
        internals.tracker.inFlightCount(),
        0,
        'completed stream must release in-flight slot',
      );
      assertEquals(pulled, [
        { seq: 1, als: null, metaId: 'evt-1', retry: 2500 },
        { seq: 2, als: null, metaId: 'evt-2', retry: 2500 },
        { seq: 3, als: null, metaId: 'evt-3', retry: 2500 },
      ]);

      // Test throw() detachment through oRPC eventIterator (for-await unwinds via return() -> finally:clean)
      streamEventsLog.length = 0;
      const iter2 = await client.streamEvents();
      await iter2.next();
      await assertRejects(
        () => consumerAls.run('caller-throw', () => iter2.throw!(new Error('abort-stream'))),
        Error,
        'abort-stream',
      );
      assertEquals(streamEventsLog, ['finally:clean']);
      assertEquals(internals.tracker.inFlightCount(), 0);

      // Test direct generator throw() forwarding inside wrapDetachedAsyncIterator (catch + finally both detached)
      const directLog: string[] = [];
      const directGen = (async function* () {
        try {
          yield { seq: 1 };
          yield { seq: 2 };
        } catch (err) {
          directLog.push(`throw:${consumerAls.getStore() ?? 'clean'}:${String(err)}`);
          throw err;
        } finally {
          directLog.push(`finally:${consumerAls.getStore() ?? 'clean'}`);
        }
      })();
      let directSettled = 0;
      const detachedDirect = wrapDetachedAsyncIterator(
        directGen,
        (fn) => internals.tracker.cleanAsyncRoot.runDetached(fn),
        () => {
          directSettled += 1;
        },
      );
      await consumerAls.run('caller-direct-next', () => detachedDirect.next());
      await assertRejects(
        () =>
          consumerAls.run('caller-direct-throw', () => detachedDirect.throw!(new Error('boom'))),
        Error,
        'boom',
      );
      assertEquals(directLog, ['throw:clean:Error: boom', 'finally:clean']);
      assertEquals(directSettled, 1);

      // Test await using ([Symbol.asyncDispose]) detachment
      streamEventsLog.length = 0;
      await consumerAls.run('caller-dispose', async () => {
        await using iter3 = await client.streamEvents() as
          & AsyncIterableIterator<unknown>
          & AsyncDisposable;
        await iter3.next();
      });
      assertEquals(streamEventsLog, ['finally:clean']);
      assertEquals(internals.tracker.inFlightCount(), 0);

      // 8. Public service (neither withAuthn nor withAuthz) leaves unmarked procedures 200.
      const publicStarted = await createService(rawRouter, { name: 'public-svc' })
        .withRPC()
        .start();
      try {
        const pubInternals = getStartedServiceInternals(publicStarted);
        assertExists(pubInternals);
        const pubWrapped = pubInternals.wrappedRouter as typeof rawRouter;
        const pubRes = await call(pubWrapped.unmarkedOp, { value: 'public-ok' }, { context: {} });
        assertEquals(pubRes, { echoed: 'public-ok', subject: 'anon' });
      } finally {
        await publicStarted.stop();
      }
    } finally {
      await started.stop();
    }
  } finally {
    await resetLogging();
  }
});

Deno.test('Stage 1b: custom isInternalCaller predicate is forwarded identically on HTTP and procedure pipeline', async () => {
  const { authenticator } = createTestAuthenticator();
  const impl = implement(OrdersStage1bContract).$context<{ principal?: Principal }>();
  const rawRouter = impl.router({
    health: impl.health.handler(() => ({ ok: true })),
    unmarkedOp: impl.unmarkedOp.handler(({ input }) => ({ echoed: input.value, subject: 'ok' })),
    getOrder: impl.getOrder.handler(({ input }) => ({ orderId: input.orderId, subject: 'ok' })),
    internalReindex: impl.internalReindex.handler(({ context }) => ({
      accepted: true,
      subject: context.principal?.subject ?? 'anon',
    })),
    streamEvents: impl.streamEvents.handler(async function* () {
      yield { seq: 1, als: null };
    }),
  });

  const started = await createService(rawRouter, { name: 'orders' })
    .withAuthn({ authenticator })
    .withAuthz({
      authorizer: createContractAuthorizer(OrdersStage1bContract, {
        isInternalCaller: (p) => p.subject === 'user:alice',
      }),
    })
    .withRPC()
    .start();

  try {
    const httpAlice = await started.app.request('/api/rpc/internalReindex', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer alice-token' },
      body: JSON.stringify({ json: { batchId: 'b-1' } }),
    });
    assertEquals(httpAlice.status, 200);

    const httpBob = await started.app.request('/api/rpc/internalReindex', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer bob-noscope' },
      body: JSON.stringify({ json: { batchId: 'b-1' } }),
    });
    assertEquals(httpBob.status, 403);

    const internals = getStartedServiceInternals(started);
    assertExists(internals);
    const wrapped = internals.wrappedRouter as typeof rawRouter;

    const directAlice = await call(wrapped.internalReindex, { batchId: 'b-2' }, {
      context: { headers: { authorization: 'Bearer alice-token' } } as Record<string, unknown>,
    });
    assertEquals(directAlice, { accepted: true, subject: 'user:alice' });

    const directBob = await safe(
      call(wrapped.internalReindex, { batchId: 'b-2' }, {
        context: { headers: { authorization: 'Bearer bob-noscope' } } as Record<string, unknown>,
      }),
    );
    assertEquals(directBob.isSuccess, false);
    assert(isDefinedError(directBob.error));
    assertEquals(directBob.error.code, 'FORBIDDEN');
    assertEquals(directBob.error.message, 'authz.internal-audience');
  } finally {
    await started.stop();
  }
});

Deno.test('Stage 1b: admitted HTTP requests drain through async authn on stop(), undocumented leaves never reach ProcedureAuthorizerPort, and composite auth propagates sink flags', async () => {
  // 1. createCompositeAuthenticator propagates mayEmitSetCookies / mayEmitResponseHeaders.
  const cookieAuth: AuthenticatorPort = {
    mayEmitSetCookies: true,
    mayEmitResponseHeaders: true,
    authenticate: () => ({ ok: false, reason: 'missing-credential' }),
  };
  const { authenticator: baseAuth } = createTestAuthenticator();
  const composite = createCompositeAuthenticator([cookieAuth, baseAuth]);
  assertEquals(composite.mayEmitSetCookies, true);
  assertEquals(composite.mayEmitResponseHeaders, true);

  // 2. HTTP request already admitted before stop() completes even if stop() triggers while authn awaits.
  const authEntered = Promise.withResolvers<void>();
  const authRelease = Promise.withResolvers<void>();
  const slowAuth: AuthenticatorPort = {
    async authenticate(request) {
      authEntered.resolve();
      await authRelease.promise;
      return await baseAuth.authenticate(request);
    },
  };
  const wildcardProcedureFallback: ProcedureAuthorizerPort = {
    authorizeProcedure: () => ({ matched: true, decision: { allow: true } }),
  };

  const impl = implement(OrdersStage1bContract).$context<{ principal?: Principal }>();
  const rawRouter = {
    ...impl.router({
      health: impl.health.handler(() => ({ ok: true })),
      unmarkedOp: impl.unmarkedOp.handler(({ input, context }) => ({
        echoed: input.value,
        subject: context.principal?.subject ?? 'anon',
      })),
      getOrder: impl.getOrder.handler(({ input, context }) => ({
        orderId: input.orderId,
        subject: context.principal?.subject ?? 'anon',
      })),
      internalReindex: impl.internalReindex.handler(({ context }) => ({
        accepted: true,
        subject: context.principal?.subject ?? 'anon',
      })),
      streamEvents: impl.streamEvents.handler(async function* () {
        yield { seq: 1, als: null };
      }),
    }),
    undocumentedLeaf: os.handler(() => ({ secret: true })),
  };

  const started = await createService(rawRouter, { name: 'drain-and-fallback' })
    .withAuthn({ authenticator: slowAuth })
    .withAuthz({
      authorizer: createContractAuthorizer(OrdersStage1bContract, {
        fallback: wildcardProcedureFallback,
      }),
    })
    .withRPC()
    .start({ drainTimeoutMs: 5_000 });

  // Undocumented leaf NOT in OrdersStage1bContract must fail closed even with wildcard ProcedureAuthorizerPort!
  const internals = getStartedServiceInternals(started);
  assertExists(internals);
  const wrapped = internals.wrappedRouter as typeof rawRouter;
  const authReleaseImmediate = authRelease;
  const inFlightHttp = started.app.request('/api/rpc/getOrder', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer alice-token' },
    body: JSON.stringify({ json: { orderId: 'ord-drain' } }),
  });
  await authEntered.promise;

  // Trigger stop() while HTTP request is still in async authenticate(), BEFORE procedure-pipeline runs.
  const stopping = started.stop();
  const rejectedNew = await started.app.request('/api/rpc/getOrder', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer alice-token' },
    body: JSON.stringify({ json: { orderId: 'ord-new' } }),
  });
  assertEquals(rejectedNew.status, 503);

  authReleaseImmediate.resolve();
  const drainedRes = await inFlightHttp;
  assertEquals(
    drainedRes.status,
    200,
    'already-admitted HTTP request must drain cleanly instead of returning 503 mid-flight',
  );
  assertEquals((await drainedRes.json()).json, { orderId: 'ord-drain', subject: 'user:alice' });
  await stopping;

  // Also test undocumentedLeaf fails closed on a live service with wildcard ProcedureAuthorizerPort.
  const started2 = await createService(rawRouter, { name: 'undoc-check' })
    .withAuthn({ authenticator: baseAuth })
    .withAuthz({
      authorizer: createContractAuthorizer(OrdersStage1bContract, {
        fallback: wildcardProcedureFallback,
      }),
    })
    .withRPC()
    .start();
  try {
    const internals2 = getStartedServiceInternals(started2);
    assertExists(internals2);
    const wrapped2 = internals2.wrappedRouter as typeof rawRouter;
    const undoc = await safe(
      call(wrapped2.undocumentedLeaf, undefined, {
        context: { headers: { authorization: 'Bearer alice-token' } } as Record<string, unknown>,
      }),
    );
    assertEquals(undoc.isSuccess, false);
    assertEquals((undoc.error as ORPCError<string, unknown>).code, 'FORBIDDEN');
    assertEquals((undoc.error as ORPCError<string, unknown>).message, 'authz.no-matching-rule');
  } finally {
    await started2.stop();
  }
  void wrapped;
});
