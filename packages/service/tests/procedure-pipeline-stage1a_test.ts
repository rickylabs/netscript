import {
  assert,
  assertEquals,
  assertExists,
  assertNotEquals,
  assertRejects,
  assertThrows,
} from '@std/assert';
import { configure, type LogRecord, resetLogging } from '@netscript/logger';
import { createORPCClient, isDefinedError, safe } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import {
  call,
  createRouterClient,
  getHiddenRouterContract,
  implement,
  lazy,
  os,
  type RouterClient,
} from '@orpc/server';
import { ResponseHeadersPlugin } from '@orpc/server/plugins';
import { z } from 'zod';
import { baseContract } from '@netscript/contracts';
import {
  createContractAuthorizer,
  createRPCHandler,
  createService,
  type Principal,
  SERVICE_PIPELINE_ERROR_CODES,
  ServicePipelineConfigError,
} from '../mod.ts';
import { createStaticCredentialAuthenticator } from '../src/auth/mod.ts';
import { createMemoryRateLimitStore, type RateLimitStore } from '../src/rate-limit/mod.ts';
import { prepareProcedureRateLimitStage } from '../src/rate-limit/middleware/procedure-rate-limit.ts';
import {
  getWrappedProcedureServiceId,
  PIPELINE_EXECUTED_SYMBOL,
  wrapRouterWithProcedurePipeline,
} from '../src/middleware/procedure-pipeline.ts';

const OrdersContract = {
  ping: baseContract
    .route({ method: 'GET', path: '/orders/ping' })
    .meta({ access: { authentication: 'none' } })
    .output(z.object({ ok: z.boolean(), requestId: z.string().nullable() })),
  getOrder: baseContract
    .route({ method: 'POST', path: '/orders/get' })
    .meta({
      access: {
        authentication: 'required',
        authorization: { scopes: ['orders:read'] },
      },
    })
    .input(z.object({ orderId: z.string().min(1) }))
    .output(
      z.object({
        orderId: z.string(),
        subject: z.string(),
        requestId: z.string().nullable(),
      }),
    ),
};

function test(name: string, fn: Deno.TestDefinition['fn']): void {
  Deno.test({ name, fn, sanitizeOps: true, sanitizeResources: true, sanitizeExit: true });
}

function createOrdersRouter(counters?: { getOrder?: number; ping?: number }) {
  const impl = implement(OrdersContract).$context<{
    principal?: Principal;
    requestId?: string;
  }>();
  return impl.router({
    ping: impl.ping.handler(({ context }) => {
      if (counters && counters.ping !== undefined) counters.ping += 1;
      return { ok: true, requestId: context.requestId ?? null };
    }),
    getOrder: impl.getOrder.handler(({ input, context }) => {
      if (counters && counters.getOrder !== undefined) counters.getOrder += 1;
      return {
        orderId: input.orderId,
        subject: context.principal?.subject ?? 'anonymous',
        requestId: context.requestId ?? null,
      };
    }),
  });
}

function createOrdersAuthenticator() {
  return createStaticCredentialAuthenticator({
    scheme: 'bearer',
    credentials: {
      'alice-token': {
        subject: 'user:alice',
        scopes: ['orders:read'],
        roles: ['member'],
        claims: { tenantId: 'tenant-a' },
      },
      'bob-token': {
        subject: 'user:bob',
        scopes: ['orders:read'],
        roles: ['member'],
        claims: { tenantId: 'tenant-b' },
      },
      'charlie-token': {
        subject: 'user:charlie',
        scopes: ['orders:read'],
        roles: ['member'],
        claims: {},
      },
    },
  });
}

test('Stage 1a: unified requestId correlates HTTP loggerMiddleware, LoggingPlugin, and handler context', async () => {
  const records: LogRecord[] = [];
  await configure({
    reset: true,
    sinks: { memory: (record: LogRecord) => records.push(record) },
    loggers: [
      { category: ['netscript'], sinks: ['memory'], lowestLevel: 'debug' },
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'warning' },
    ],
  });

  try {
    const router = createOrdersRouter();
    const app = createService(router, { name: 'orders-reqid' })
      .withLogger()
      .withRPC({ debug: true })
      .build();

    // 1. Explicit X-Request-ID header propagates end-to-end.
    const explicitRes = await app.request('/api/rpc/ping', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req-unified-42',
      },
      body: JSON.stringify({ json: {} }),
    });
    assertEquals(explicitRes.status, 200);
    const explicitBody = await explicitRes.json() as {
      json: { ok: boolean; requestId: string | null };
    };
    assertEquals(explicitBody.json.requestId, 'req-unified-42');

    const httpStarted = records.find((r) =>
      r.rawMessage === 'HTTP request started' && r.properties.requestId === 'req-unified-42'
    );
    const rpcStarted = records.find((r) =>
      r.rawMessage === 'RPC request started' && r.properties.requestId === 'req-unified-42'
    );
    const procStarted = records.find((r) =>
      r.rawMessage === 'RPC procedure started' && r.properties.requestId === 'req-unified-42'
    );
    assertExists(httpStarted, 'HTTP access log must carry X-Request-ID');
    assertExists(rpcStarted, 'LoggingPlugin root log must reuse HTTP requestId');
    assertExists(procStarted, 'LoggingPlugin procedure log must reuse HTTP requestId');

    // 2. Omitted X-Request-ID mints one ID shared across HTTP log, oRPC logs, and handler.
    const beforeMinted = records.length;
    const mintedRes = await app.request('/api/rpc/ping', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    });
    assertEquals(mintedRes.status, 200);
    const mintedBody = await mintedRes.json() as {
      json: { ok: boolean; requestId: string | null };
    };
    const mintedId = mintedBody.json.requestId;
    assert(typeof mintedId === 'string' && mintedId.length > 0);

    const mintedSlice = records.slice(beforeMinted);
    const mintedHttp = mintedSlice.find((r) => r.rawMessage === 'HTTP request started');
    const mintedRpc = mintedSlice.find((r) => r.rawMessage === 'RPC request started');
    const mintedProc = mintedSlice.find((r) => r.rawMessage === 'RPC procedure started');
    assertEquals(mintedHttp?.properties.requestId, mintedId);
    assertEquals(mintedRpc?.properties.requestId, mintedId);
    assertEquals(mintedProc?.properties.requestId, mintedId);

    // 3. Second request without header mints a distinct requestId.
    const secondRes = await app.request('/api/rpc/ping', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    });
    const secondBody = await secondRes.json() as {
      json: { ok: boolean; requestId: string | null };
    };
    assertNotEquals(secondBody.json.requestId, mintedId);

    // 4. Four concurrent overlapping requests (2 explicit, 1 blank, 1 absent) correlate cleanly.
    const concurrentContract = {
      echo: baseContract
        .route({ method: 'POST', path: '/concurrent/echo' })
        .meta({ access: { authentication: 'none' } })
        .input(z.object({ label: z.string() }))
        .output(z.object({ label: z.string(), requestId: z.string().nullable() })),
    };
    let inFlight = 0;
    let releaseAll: (() => void) | undefined;
    const allEntered = new Promise<void>((resolve) => {
      releaseAll = resolve;
    });
    const concurrentImpl = implement(concurrentContract).$context<{ requestId?: string }>();
    const concurrentRouter = concurrentImpl.router({
      echo: concurrentImpl.echo.handler(async ({ input, context }) => {
        inFlight += 1;
        if (inFlight === 4) releaseAll?.();
        await allEntered;
        return { label: input.label, requestId: context.requestId ?? null };
      }),
    });
    const concurrentApp = createService(concurrentRouter, { name: 'orders-concurrent-reqid' })
      .withLogger()
      .withRPC({ debug: true })
      .build();

    const beforeConcurrent = records.length;
    const postEcho = (label: string, headerValue?: string) =>
      concurrentApp.request('/api/rpc/echo', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(headerValue !== undefined ? { 'x-request-id': headerValue } : {}),
        },
        body: JSON.stringify({ json: { label } }),
      });

    const responses = await Promise.all([
      postEcho('exp-1', 'req-concurrent-1'),
      postEcho('exp-2', 'req-concurrent-2'),
      postEcho('blank', '   '),
      postEcho('absent'),
    ]);
    const bodies = await Promise.all(
      responses.map(async (res) => {
        assertEquals(res.status, 200);
        return await res.json() as { json: { label: string; requestId: string | null } };
      }),
    );
    const ids = bodies.map((b) => b.json.requestId);
    assertEquals(ids[0], 'req-concurrent-1');
    assertEquals(ids[1], 'req-concurrent-2');
    assert(typeof ids[2] === 'string' && ids[2].trim().length > 0);
    assert(typeof ids[3] === 'string' && ids[3].trim().length > 0);
    assertEquals(new Set(ids).size, 4, 'all 4 concurrent requests must receive distinct IDs');

    const concurrentLogs = records.slice(beforeConcurrent);
    for (const id of ids) {
      assertExists(
        concurrentLogs.find((r) =>
          r.rawMessage === 'HTTP request started' && r.properties.requestId === id
        ),
        `HTTP access log missing requestId ${id}`,
      );
      assertExists(
        concurrentLogs.find((r) =>
          r.rawMessage === 'RPC request started' && r.properties.requestId === id
        ),
        `RPC root log missing requestId ${id}`,
      );
      assertExists(
        concurrentLogs.find((r) =>
          r.rawMessage === 'RPC procedure started' && r.properties.requestId === id
        ),
        `RPC procedure log missing requestId ${id}`,
      );
    }
  } finally {
    await resetLogging();
  }
});

test('Stage 1a: per-leaf and per-invocation wrapping is idempotent across nested mounts, dual rpcRouter, lazy routers, and rejects cross-service remounts', async () => {
  const serviceA = Symbol('service:a');
  const serviceB = Symbol('service:b');
  let consumeCount = 0;
  const backing = createMemoryRateLimitStore();
  const countingStore: RateLimitStore = {
    validate: (cfg) => backing.validate?.(cfg),
    consume: (req) => {
      consumeCount += 1;
      return backing.consume(req);
    },
  };
  const stageA = prepareProcedureRateLimitStage({
    store: countingStore,
    limit: 100,
    windowMs: 60_000,
    key: () => 'shared-key',
  });

  const rawRouter = createOrdersRouter();
  assert(getHiddenRouterContract(rawRouter) !== undefined, 'fixture carries hidden contract');

  // 1. Wrapping once preserves hidden contract and does not mutate raw leaf ownership.
  const wrappedChild = wrapRouterWithProcedurePipeline(rawRouter, {
    serviceId: serviceA,
    serviceName: 'orders-a',
    rateLimitStages: [stageA],
  });
  assertEquals(getWrappedProcedureServiceId(rawRouter.ping), undefined);
  assertEquals(getWrappedProcedureServiceId(wrappedChild.ping), serviceA);
  assertEquals(
    getHiddenRouterContract(wrappedChild),
    getHiddenRouterContract(rawRouter),
    'hidden router contract must survive wrapping',
  );

  // 2. Re-wrapping nested `{ v1: { orders: wrappedChild } }` under the SAME serviceId executes 1x.
  const nestedWrapped = wrapRouterWithProcedurePipeline(
    { v1: { orders: wrappedChild } },
    {
      serviceId: serviceA,
      serviceName: 'orders-a',
      rateLimitStages: [stageA],
    },
  );
  const res1 = await call(nestedWrapped.v1.orders.ping, undefined, { context: {} });
  assertEquals(res1.ok, true);
  assertEquals(consumeCount, 1, 'nested re-wrap under same serviceId must run pipeline once');

  // 3. Per-invocation PIPELINE_EXECUTED_SYMBOL guard skips duplicate execution even if context already ran serviceA.
  const resPreExecuted = await call(nestedWrapped.v1.orders.ping, undefined, {
    context: {
      [PIPELINE_EXECUTED_SYMBOL]: new Set([serviceA]),
    } as Record<PropertyKey, unknown>,
  });
  assertEquals(resPreExecuted.ok, true);
  assertEquals(consumeCount, 1, 'PIPELINE_EXECUTED_SYMBOL must guard against re-entry');

  // 4. Cross-service remount of an already-wrapped leaf fails closed with ROUTER_CLIENT_CROSS_SERVICE_MOUNT.
  const crossErr = assertThrows(
    () =>
      wrapRouterWithProcedurePipeline(
        { v1: { orders: wrappedChild } },
        { serviceId: serviceB, serviceName: 'orders-b' },
      ),
    ServicePipelineConfigError,
  );
  assertEquals(crossErr.code, SERVICE_PIPELINE_ERROR_CODES.CROSS_SERVICE_MOUNT);

  // 5. Reusing the UNWRAPPED rawRouter on a second service succeeds cleanly (no mutation).
  const wrappedForB = wrapRouterWithProcedurePipeline(rawRouter, {
    serviceId: serviceB,
    serviceName: 'orders-b',
  });
  assertEquals(getWrappedProcedureServiceId(wrappedForB.ping), serviceB);

  // 6. Lazy sub-routers wrap leaves on resolution and reject cross-service remounts.
  const lazyRouter = {
    sub: lazy(() => Promise.resolve({ default: rawRouter })),
  };
  const wrappedLazy = wrapRouterWithProcedurePipeline(lazyRouter, {
    serviceId: serviceA,
    serviceName: 'orders-a',
    rateLimitStages: [stageA],
  });
  const beforeLazy = consumeCount;
  const lazyClient = createRouterClient(wrappedLazy, { context: {} });
  const lazyRes = await lazyClient.sub.ping();
  assertEquals(lazyRes.ok, true);
  assertEquals(consumeCount, beforeLazy + 1);

  // Re-wrapping an already-wrapped lazy branch under the same service returns it directly;
  // remounting it under a different service fails closed synchronously.
  const rewrappedSameLazy = wrapRouterWithProcedurePipeline(wrappedLazy, {
    serviceId: serviceA,
    serviceName: 'orders-a',
    rateLimitStages: [stageA],
  });
  assertEquals(rewrappedSameLazy.sub, wrappedLazy.sub);
  const syncCrossLazyErr = assertThrows(
    () =>
      wrapRouterWithProcedurePipeline(wrappedLazy, {
        serviceId: serviceB,
        serviceName: 'orders-b',
      }),
    ServicePipelineConfigError,
  );
  assertEquals(syncCrossLazyErr.code, SERVICE_PIPELINE_ERROR_CODES.CROSS_SERVICE_MOUNT);

  const crossLazyRouter = {
    sub: lazy(() => Promise.resolve({ default: wrappedChild })),
  };
  const wrappedCrossLazy = wrapRouterWithProcedurePipeline(crossLazyRouter, {
    serviceId: serviceB,
    serviceName: 'orders-b',
  });
  const crossLazyClient = createRouterClient(wrappedCrossLazy, { context: {} });
  const crossLazyErr = await assertRejects(
    () => crossLazyClient.sub.ping(),
    ServicePipelineConfigError,
  );
  assertEquals(crossLazyErr.code, SERVICE_PIPELINE_ERROR_CODES.CROSS_SERVICE_MOUNT);

  // 7. Dual `withRPC({ rpcRouter })` sharing leaves with canonical `router` runs pipeline 1x on both mounts,
  //    and repeated `build()` stays idempotent.
  let dualConsumes = 0;
  const dualBacking = createMemoryRateLimitStore();
  const dualStore: RateLimitStore = {
    consume: (req) => {
      dualConsumes += 1;
      return dualBacking.consume(req);
    },
  };
  const sharedLeafRouter = createOrdersRouter();
  const canonicalRouter = { v1: { orders: sharedLeafRouter } };
  const flatAliasRpcRouter = {
    v1: {
      orders: sharedLeafRouter,
      ping: sharedLeafRouter.ping,
    },
  };
  const builder = createService(canonicalRouter, { name: 'dual-rpc' })
    .withProcedureRateLimit({
      store: dualStore,
      limit: 10,
      windowMs: 60_000,
      key: () => 'dual',
    })
    .withRPC({ rpcRouter: flatAliasRpcRouter });
  builder.build();
  const dualApp = builder.build();

  assertEquals(
    (await dualApp.request('/api/rpc/v1/orders/ping', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    })).status,
    200,
  );
  assertEquals(
    (await dualApp.request('/api/rpc/v1/ping', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    })).status,
    200,
  );
  assertEquals(dualConsumes, 2, 'each request consumes exactly 1 quota unit across dual routers');
});

test('Stage 1a: withProcedureRateLimit validates bounds, ipv6Prefix, RFC 0008 GCRA retention, and disjoint store invariant synchronously', () => {
  const mem = createMemoryRateLimitStore();

  for (const bad of [0, -1, 0.5, NaN, Infinity]) {
    assertThrows(
      () =>
        createService({}, { name: 'bad-limit' }).withProcedureRateLimit({
          limit: bad,
          windowMs: 1_000,
          store: mem,
        }),
      RangeError,
    );
    assertThrows(
      () =>
        createService({}, { name: 'bad-window' }).withProcedureRateLimit({
          limit: 1,
          windowMs: bad,
          store: mem,
        }),
      RangeError,
    );
  }

  for (const badPrefix of [-1, 129, 64.5, NaN]) {
    assertThrows(
      () =>
        createService({}, { name: 'bad-prefix' }).withProcedureRateLimit({
          limit: 1,
          windowMs: 1_000,
          ipv6Prefix: badPrefix,
          store: mem,
        }),
      RangeError,
      'ipv6Prefix',
    );
  }

  // RFC 0008 GCRA retention ceiling (> 365 days) fails fast synchronously at registration.
  const gcraStore = createMemoryRateLimitStore({ policy: { kind: 'gcra' } });
  assertThrows(
    () =>
      createService({}, { name: 'gcra-overflow' }).withProcedureRateLimit({
        limit: 1,
        windowMs: 400 * 86_400_000,
        store: gcraStore,
      }),
    RangeError,
    'rateLimit retention exceeds maximum supported TTL',
  );

  // Sharing the exact same store instance between HTTP edge `withRateLimit()` and `withProcedureRateLimit()`
  // fails closed synchronously in BOTH call orders.
  const shared = createMemoryRateLimitStore();
  assertThrows(
    () =>
      createService({}, { name: 'shared-1' })
        .withRateLimit({ routes: ['/api/*'], limit: 10, windowMs: 60_000, store: shared })
        .withProcedureRateLimit({ limit: 5, windowMs: 60_000, store: shared }),
    Error,
    'disjoint RateLimitStore',
  );
  assertThrows(
    () =>
      createService({}, { name: 'shared-2' })
        .withProcedureRateLimit({ limit: 5, windowMs: 60_000, store: shared })
        .withRateLimit({ routes: ['/api/*'], limit: 10, windowMs: 60_000, store: shared }),
    Error,
    'disjoint RateLimitStore',
  );
});

test('Stage 1a: withProcedureRateLimit enforces post-auth tenant/subject quotas, GCRA retryAt Retry-After via ResponseHeadersPlugin, RPCLink isDefinedError, OpenAPI 429, and CORS preservation', async () => {
  let now = 59_850;
  const counters = { getOrder: 0, ping: 0 };
  const router = createOrdersRouter(counters);
  const authenticator = createOrdersAuthenticator();
  const authorizer = createContractAuthorizer(OrdersContract);
  const httpStore = createMemoryRateLimitStore();
  const procStore = createMemoryRateLimitStore({ policy: { kind: 'gcra' } });

  const app = createService(router, { name: 'orders-quota' })
    .withCors({ origin: ['https://app.example'] })
    .withRateLimit({
      routes: ['/api/*'],
      limit: 50,
      windowMs: 60_000,
      now: () => now,
      key: () => 'edge-bucket',
      store: httpStore,
    })
    .withAuthn({ authenticator })
    .withAuthz({ authorizer })
    .withProcedureRateLimit({
      limit: 2,
      windowMs: 60_000,
      now: () => now,
      store: procStore,
    })
    .withRPC()
    .build();

  // 1. Real RPCLink client observes HTTP 429 + Retry-After derived from GCRA retryAt (30s, NOT resetAt 60s)
  //    AND decodes typed `ORPCError('RATE_LIMITED', { data: { retryAfter: 30, limit: 2 } })` with `isDefinedError === true`!
  const observedStatuses: number[] = [];
  const observedRetryAfters: Array<string | null> = [];
  const observedAcao: Array<string | null> = [];
  const makeRpcClient = (token: string): RouterClient<typeof router> => {
    const link = new RPCLink({
      url: 'http://orders.test/api/rpc',
      headers: {
        authorization: `Bearer ${token}`,
        origin: 'https://app.example',
      },
      fetch: async (input, init) => {
        const req = input instanceof Request ? input : new Request(input, init);
        const res = await app.fetch(req);
        observedStatuses.push(res.status);
        observedRetryAfters.push(res.headers.get('retry-after'));
        observedAcao.push(res.headers.get('access-control-allow-origin'));
        return res;
      },
    });
    return createORPCClient(link);
  };

  const alice = makeRpcClient('alice-token');
  const bob = makeRpcClient('bob-token');
  const charlie = makeRpcClient('charlie-token');

  // Alice consumes 2 GCRA slots at 59_850 and 59_950; 3rd call at 60_050 is denied with retryAt = 89_850 (Retry-After: 30).
  const first = await alice.getOrder({ orderId: 'ord-1' });
  assertEquals(first.subject, 'user:alice');
  now = 59_950;
  const second = await alice.getOrder({ orderId: 'ord-2' });
  assertEquals(second.subject, 'user:alice');
  now = 60_050;
  const third = await safe(alice.getOrder({ orderId: 'ord-3' }));
  assertEquals(third.isSuccess, false);
  assert(isDefinedError(third.error), 'RPCLink must decode RATE_LIMITED as defined error');
  assertEquals(third.error.code, 'RATE_LIMITED');
  assertEquals(third.error.data, { retryAfter: 30, limit: 2 });
  assertEquals(observedStatuses.at(-1), 429);
  assertEquals(observedRetryAfters.at(-1), '30');
  assertEquals(observedAcao.at(-1), 'https://app.example');
  assertEquals(counters.getOrder, 2, 'denied procedure must not execute handler');

  // Over-quota runs BEFORE Zod input validation: invalid empty orderId still gets 429, not 400!
  const invalidWhenLimited = await app.request('/api/rpc/getOrder', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer alice-token',
      origin: 'https://app.example',
    },
    body: JSON.stringify({ json: { orderId: '' } }),
  });
  assertEquals(invalidWhenLimited.status, 429);
  assertEquals(invalidWhenLimited.headers.get('retry-after'), '30');
  assertEquals(
    invalidWhenLimited.headers.get('access-control-allow-origin'),
    'https://app.example',
  );

  // OpenAPI projection ALSO emits HTTP 429 + Retry-After + CORS header!
  const openApiDenied = await app.request('/api/orders/get', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer alice-token',
      origin: 'https://app.example',
    },
    body: JSON.stringify({ orderId: 'ord-4' }),
  });
  assertEquals(openApiDenied.status, 429);
  assertEquals(openApiDenied.headers.get('retry-after'), '30');
  assertEquals(openApiDenied.headers.get('access-control-allow-origin'), 'https://app.example');
  const openApiDeniedBody = await openApiDenied.json() as {
    code: string;
    data: { retryAfter: number; limit: number };
  };
  assertEquals(openApiDeniedBody.code, 'RATE_LIMITED');
  assertEquals(openApiDeniedBody.data, { retryAfter: 30, limit: 2 });

  // Bob (different tenant) and Charlie (no tenantId -> global) retain independent full quotas!
  assertEquals((await bob.getOrder({ orderId: 'ord-b1' })).subject, 'user:bob');
  assertEquals((await charlie.getOrder({ orderId: 'ord-c1' })).subject, 'user:charlie');

  // Unauthenticated request to protected procedure still returns HTTP 401 (before procedure quota).
  const unauthRes = await app.request('/api/rpc/getOrder', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ json: { orderId: 'ord-anon' } }),
  });
  assertEquals(unauthRes.status, 401);
  assertEquals((await unauthRes.json()).error, 'UNAUTHORIZED');
});

test('Stage 1a: withProcedureRateLimit applies IPv6 /64 bucketing, trustProxy, custom keys, and warns once on omitted clientAddress', async () => {
  const records: LogRecord[] = [];
  await configure({
    reset: true,
    sinks: { memory: (record: LogRecord) => records.push(record) },
    loggers: [
      { category: ['netscript'], sinks: ['memory'], lowestLevel: 'warning' },
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'warning' },
    ],
  });

  try {
    const router = createOrdersRouter();
    const app = createService(router, { name: 'public-ipv6-quota' })
      .withLogger()
      .withProcedureRateLimit({
        limit: 1,
        windowMs: 60_000,
        now: () => 1_000,
        trustProxy: (addr) => addr === '127.0.0.1',
        store: createMemoryRateLimitStore(),
      })
      .withRPC()
      .build();

    // Two interface IDs within the SAME IPv6 /64 share one bucket.
    const ipv6First = await app.request(
      '/api/rpc/ping',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      },
      { remoteAddr: { transport: 'tcp', hostname: '2001:db8:abcd:1::1', port: 4000 } },
    );
    assertEquals(ipv6First.status, 200);

    const ipv6SamePrefix = await app.request(
      '/api/rpc/ping',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      },
      { remoteAddr: { transport: 'tcp', hostname: '2001:db8:abcd:1::9999', port: 4001 } },
    );
    assertEquals(ipv6SamePrefix.status, 429);
    assertEquals(ipv6SamePrefix.headers.get('retry-after'), '59');

    // A different /64 network gets an independent bucket (also via trusted proxy XFF).
    const ipv6OtherPrefix = await app.request(
      '/api/rpc/ping',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '2001:db8:abcd:2::1',
        },
        body: JSON.stringify({ json: {} }),
      },
      { remoteAddr: { transport: 'tcp', hostname: '127.0.0.1', port: 4002 } },
    );
    assertEquals(ipv6OtherPrefix.status, 200);

    // Omitted remoteAddr collapses to `addr:unknown` and warns strictly ONCE.
    const unknown1 = await app.request('/api/rpc/ping', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    });
    assertEquals(unknown1.status, 200);
    const unknown2 = await app.request('/api/rpc/ping', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    });
    assertEquals(unknown2.status, 429);

    const warnings = records.filter((r) =>
      r.level === 'warning' && String(r.rawMessage).includes('addr:unknown')
    );
    assertEquals(warnings.length, 1, 'omitted clientAddress must emit a one-time warning');

    // Custom key receives procedurePath and works on async resolvers.
    const seenPaths: string[] = [];
    const customApp = createService(createOrdersRouter(), { name: 'custom-key-quota' })
      .withProcedureRateLimit({
        limit: 1,
        windowMs: 10_000,
        now: () => 2_000,
        store: createMemoryRateLimitStore(),
        key: async ({ procedurePath }) => {
          await Promise.resolve();
          const joined = procedurePath.join('.');
          seenPaths.push(joined);
          return `custom:${joined}`;
        },
      })
      .withRPC()
      .build();

    assertEquals(
      (await customApp.request('/api/rpc/ping', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      })).status,
      200,
    );
    const customDenied = await customApp.request('/api/rpc/ping', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    });
    assertEquals(customDenied.status, 429);
    assertEquals(customDenied.headers.get('retry-after'), '8');
    assertEquals(seenPaths, ['ping', 'ping']);

    // Caller-supplied ResponseHeadersPlugin in createRPCHandler({ plugins }) must not duplicate Retry-After.
    const callerStage = prepareProcedureRateLimitStage({
      limit: 1,
      windowMs: 10_000,
      now: () => 2_000,
      store: createMemoryRateLimitStore(),
      key: () => 'single-bucket',
    });
    const callerWrapped = wrapRouterWithProcedurePipeline(createOrdersRouter(), {
      serviceId: Symbol('caller-res-headers'),
      serviceName: 'caller-res-headers',
      rateLimitStages: [callerStage],
    });
    const callerHandler = createRPCHandler(callerWrapped, {
      serviceName: 'caller-res-headers',
      responseHeaders: true,
      plugins: [new ResponseHeadersPlugin()],
    });
    const firstCaller = await callerHandler.handle(
      new Request('http://localhost/api/rpc/ping', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      }),
      { prefix: '/api/rpc', context: {} },
    );
    assertEquals(firstCaller.matched, true);
    assertEquals(firstCaller.response?.status, 200);
    const secondCaller = await callerHandler.handle(
      new Request('http://localhost/api/rpc/ping', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      }),
      { prefix: '/api/rpc', context: {} },
    );
    assertEquals(secondCaller.matched, true);
    assertEquals(secondCaller.response?.status, 429);
    assertEquals(secondCaller.response?.headers.get('retry-after'), '8');
  } finally {
    await resetLogging();
  }
});

test('Stage 1a regressions: non-plain router branches enforce procedure quotas and cross-service ownership', async () => {
  class OrdersBranch {
    readonly ping = os.handler(() => ({ ok: true }));
  }
  const protoBranch = Object.create({
    inherited: os.handler(() => ({ from: 'proto' })),
  }) as Record<string, unknown>;
  const arrayLeaf = os.handler(() => ({ from: 'array' }));

  let storeCalls = 0;
  const backing = createMemoryRateLimitStore();
  const countingStore: RateLimitStore = {
    consume: (req) => {
      storeCalls += 1;
      return backing.consume(req);
    },
  };

  const router = {
    cls: new OrdersBranch(),
    proto: protoBranch,
    arr: [arrayLeaf],
  };

  const app = createService(router, { name: 'non-plain-branches' })
    .withProcedureRateLimit({
      limit: 1,
      windowMs: 60_000,
      now: () => 5_000,
      store: countingStore,
      key: ({ procedurePath }) => `path:${procedurePath.join('.')}`,
    })
    .withRPC()
    .build();

  for (const rpcUrl of ['/api/rpc/cls/ping', '/api/rpc/proto/inherited', '/api/rpc/arr/0']) {
    const first = await app.request(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    });
    assertEquals(first.status, 200, `first call to ${rpcUrl} must succeed`);

    const second = await app.request(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    });
    assertEquals(second.status, 429, `second call to ${rpcUrl} must be rate-limited`);
    assertEquals(second.headers.get('retry-after'), '55');
  }
  assertEquals(storeCalls, 6, 'all three non-plain router shapes must hit the quota store');

  // Cross-service remount of a wrapped class-instance branch must also fail closed.
  const serviceA = Symbol('service-a');
  const serviceB = Symbol('service-b');
  const wrappedForA = wrapRouterWithProcedurePipeline(
    { cls: new OrdersBranch() },
    { serviceId: serviceA, serviceName: 'a' },
  );
  const crossErr = assertThrows(
    () =>
      wrapRouterWithProcedurePipeline(wrappedForA, {
        serviceId: serviceB,
        serviceName: 'b',
      }),
    ServicePipelineConfigError,
  );
  assertEquals(crossErr.code, SERVICE_PIPELINE_ERROR_CODES.CROSS_SERVICE_MOUNT);
});

test('Stage 1a regressions: contract-first lazy wrapping preserves hidden contract for cold OpenAPI 404s', async () => {
  const lazyContract = {
    sub: {
      hello: baseContract
        .route({ method: 'GET', path: '/lazy/hello' })
        .meta({ access: { authentication: 'none' } })
        .output(z.object({ ok: z.boolean() })),
    },
  };

  let failLoaderCalls = 0;
  const impl = implement(lazyContract);
  const failingLazyRouter = {
    sub: impl.sub.lazy(async () => {
      failLoaderCalls += 1;
      await Promise.resolve();
      throw new Error('loader should not run for unrelated paths');
    }),
  };
  assert(
    getHiddenRouterContract(failingLazyRouter.sub) !== undefined,
    'contract-first lazy branch must carry hidden contract',
  );

  const appWithFailingLazy = createService(failingLazyRouter, { name: 'lazy-cold-404' })
    .withRPC()
    .build();

  // Unrelated OpenAPI path must return 404 without invoking the lazy loader.
  const unmatched = await appWithFailingLazy.request('/api/unrelated');
  assertEquals(unmatched.status, 404);
  assertEquals(failLoaderCalls, 0, 'unrelated OpenAPI path must not trigger lazy loader');

  // Matched OpenAPI path loads the branch and enforces procedure rate limits.
  let okLoaderCalls = 0;
  const okLazyRouter = {
    sub: impl.sub.lazy(async () => {
      okLoaderCalls += 1;
      await Promise.resolve();
      return {
        default: impl.sub.router({
          hello: impl.sub.hello.handler(() => ({ ok: true })),
        }),
      };
    }),
  };
  const limitedLazyApp = createService(okLazyRouter, { name: 'lazy-limited' })
    .withProcedureRateLimit({
      limit: 1,
      windowMs: 30_000,
      now: () => 1_000,
      store: createMemoryRateLimitStore(),
      key: () => 'lazy-bucket',
    })
    .withRPC()
    .build();

  assertEquals((await limitedLazyApp.request('/api/unrelated')).status, 404);
  assertEquals(okLoaderCalls, 0);

  const first = await limitedLazyApp.request('/api/lazy/hello');
  assertEquals(first.status, 200);
  assertEquals(okLoaderCalls, 1);

  const second = await limitedLazyApp.request('/api/lazy/hello');
  assertEquals(second.status, 429);
  assertEquals(second.headers.get('retry-after'), '29');
});

test('Stage 1a regressions: caller-owned non-string requestId and non-Headers resHeaders are preserved', async () => {
  const records: LogRecord[] = [];
  await configure({
    reset: true,
    sinks: { memory: (record: LogRecord) => records.push(record) },
    loggers: [
      { category: ['netscript'], sinks: ['memory'], lowestLevel: 'debug' },
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'warning' },
    ],
  });

  try {
    // 1. Numeric caller-owned requestId is preserved while HTTP + oRPC logs still correlate.
    const numericRouter = {
      inspect: os.$context<{ requestId: number; resHeaders?: { tag: string } }>().handler(
        ({ context }) => ({
          requestId: context.requestId,
          requestIdType: typeof context.requestId,
          resHeadersTag: context.resHeaders?.tag ?? null,
        }),
      ),
    };
    const numericApp = createService(numericRouter, { name: 'caller-owned-fields' })
      .withLogger()
      .withContext(() => ({ requestId: 42, resHeaders: { tag: 'app-owned' } }))
      .withRPC({ debug: true })
      .build();

    const res = await numericApp.request('/api/rpc/inspect', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'http-corr-42',
      },
      body: JSON.stringify({ json: {} }),
    });
    assertEquals(res.status, 200);
    const body = await res.json() as {
      json: { requestId: number; requestIdType: string; resHeadersTag: string | null };
    };
    assertEquals(body.json, {
      requestId: 42,
      requestIdType: 'number',
      resHeadersTag: 'app-owned',
    });
    assertExists(
      records.find((r) =>
        r.rawMessage === 'HTTP request started' && r.properties.requestId === 'http-corr-42'
      ),
    );
    assertExists(
      records.find((r) =>
        r.rawMessage === 'RPC request started' && r.properties.requestId === 'http-corr-42'
      ),
    );
    assertExists(
      records.find((r) =>
        r.rawMessage === 'RPC procedure started' && r.properties.requestId === 'http-corr-42'
      ),
    );

    // 2. Direct createRPCHandler() without procedure limiter preserves non-iterable resHeaders.
    const directHandler = createRPCHandler(numericRouter, { serviceName: 'direct-res-headers' });
    const directRes = await directHandler.handle(
      new Request('http://localhost/api/rpc/inspect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      }),
      { prefix: '/api/rpc', context: { requestId: 7, resHeaders: { tag: 'direct-app' } } },
    );
    assertEquals(directRes.matched, true);
    assertEquals(directRes.response?.status, 200);
    const directBody = await directRes.response?.json() as {
      json: { requestId: number; requestIdType: string; resHeadersTag: string | null };
    };
    assertEquals(directBody.json, {
      requestId: 7,
      requestIdType: 'number',
      resHeadersTag: 'direct-app',
    });

    // 3. ServiceBuilder with BOTH non-Headers resHeaders AND withProcedureRateLimit preserves
    //    caller resHeaders on 200 and still emits HTTP 429 + Retry-After on quota denial.
    const limitedApp = createService(numericRouter, { name: 'caller-res-headers-limited' })
      .withContext(() => ({ requestId: 99, resHeaders: { tag: 'kept-under-limit' } }))
      .withProcedureRateLimit({
        limit: 1,
        windowMs: 20_000,
        now: () => 4_000,
        store: createMemoryRateLimitStore(),
        key: () => 'custom-res-headers-bucket',
      })
      .withRPC()
      .build();

    const allowed = await limitedApp.request('/api/rpc/inspect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    });
    assertEquals(allowed.status, 200);
    const allowedBody = await allowed.json() as {
      json: { requestId: number; requestIdType: string; resHeadersTag: string | null };
    };
    assertEquals(allowedBody.json, {
      requestId: 99,
      requestIdType: 'number',
      resHeadersTag: 'kept-under-limit',
    });

    const limited = await limitedApp.request('/api/rpc/inspect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    });
    assertEquals(limited.status, 429);
    assertEquals(limited.headers.get('retry-after'), '16');
  } finally {
    await resetLogging();
  }
});
