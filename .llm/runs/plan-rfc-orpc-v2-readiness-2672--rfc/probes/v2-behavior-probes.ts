/**
 * RFC B Empirical Behavior Probes — Verifying oRPC v2 (`2.0.0-beta.53`) vs v1 (`1.15.5`) behaviors
 * for Round-1 blockers B1, B2, B4, B6, and B7.
 *
 * Runs standalone (`--no-lock --no-config`) so workspace `deno.json` and `deno.lock` are untouched.
 *
 * Usage:
 *   mise exec -- deno test --no-lock --no-config -A .llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/probes/v2-behavior-probes.ts
 */

import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { z } from 'npm:zod@4.6.5';

// oRPC v1 (locked 1.15.5)
import { createORPCClient as createORPCClientV1, ORPCError as ORPCErrorV1 } from 'npm:@orpc/client@1.15.5';
import { RPCLink as RPCLinkV1 } from 'npm:@orpc/client@1.15.5/fetch';
import { os as osV1 } from 'npm:@orpc/server@1.15.5';
import { RPCHandler as RPCHandlerV1 } from 'npm:@orpc/server@1.15.5/fetch';
import { OpenAPILink as OpenAPILinkV1 } from 'npm:@orpc/openapi-client@1.15.5/fetch';

// oRPC v2 (2.0.0-beta.53)
import { createORPCClient as createORPCClientV2, ORPCError as ORPCErrorV2 } from 'npm:@orpc/client@2.0.0-beta.53';
import { RPCLink as RPCLinkV2 } from 'npm:@orpc/client@2.0.0-beta.53/fetch';
import { defineMeta, oc as ocV2, reconcileORPCError } from 'npm:@orpc/contract@2.0.0-beta.53';
import { call as callV2, os as osV2 } from 'npm:@orpc/server@2.0.0-beta.53';
import { RPCHandler as RPCHandlerV2 } from 'npm:@orpc/server@2.0.0-beta.53/fetch';
import { GetMethodCsrfProtectionHandlerPlugin } from 'npm:@orpc/server@2.0.0-beta.53/plugins';
import { getOpenAPIMeta, openapi } from 'npm:@orpc/openapi@2.0.0-beta.53';
import { OpenAPIHandler as OpenAPIHandlerV2 } from 'npm:@orpc/openapi@2.0.0-beta.53/fetch';
import 'npm:@orpc/openapi@2.0.0-beta.53/extensions/route';

const PROTOCOL_HEADER = 'x-netscript-rpc-protocol';

// ===========================================================================
// PROBE B1: Mixed v1/v2 RPC silent corruption vs fail-closed 426 protocol guard
//           + OpenAPILink v1 -> OpenAPIHandler v2 bridge verification
// ===========================================================================
Deno.test('B1: mixed v1/v2 RPC silently corrupts bigint & degrades errors; X-NetScript-RPC-Protocol fails closed 426; OpenAPILink bridge check', async () => {
  const v2Router = {
    getBig: osV2.handler(() => 10n),
    failNotFound: osV2.handler(() => {
      throw new ORPCErrorV2('NOT_FOUND', { message: 'nope' });
    }),
    getOpenApiItem: osV2
      .meta(openapi({ method: 'GET', path: '/items/{id}' }))
      .input(z.object({ id: z.string() }))
      .output(z.object({ id: z.string(), count: z.number().int() }))
      .handler(({ input }) => ({ id: input.id, count: 42 })),
  };

  const v2RpcHandler = new RPCHandlerV2(v2Router);
  const v2OpenApiHandler = new OpenAPIHandlerV2(v2Router);

  // 1. Reproduce silent corruption: v1 RPCLink calling unguarded v2 RPCHandler
  const unguardedV1Client = createORPCClientV1(
    new RPCLinkV1({
      url: 'http://rpc.local/api/rpc',
      fetch: async (req, init) => {
        const { response } = await v2RpcHandler.handle(new Request(req, init), { prefix: '/api/rpc' });
        return response ?? new Response('Not Found', { status: 404 });
      },
    }),
  ) as { getBig: () => Promise<unknown>; failNotFound: () => Promise<unknown> };

  const corruptedBigInt = await unguardedV1Client.getBig();
  // Measured silent corruption: BigInt 10n arrives as plain string "10" with zero error!
  assertEquals(typeof corruptedBigInt, 'string');
  assertEquals(corruptedBigInt, '10');

  let degradedErrorMsg = '';
  try {
    await unguardedV1Client.failNotFound();
  } catch (err) {
    degradedErrorMsg = (err as Error).message;
  }
  // Measured error degradation: "nope" degrades to generic "Not Found"
  assertEquals(degradedErrorMsg, 'Not Found');

  // 2. Fail-closed protocol guard (`X-NetScript-RPC-Protocol: orpc-v2` required on v2 handler)
  async function handleV2WithProtocolGuard(req: Request): Promise<Response> {
    const proto = req.headers.get(PROTOCOL_HEADER);
    if (proto !== 'orpc-v2') {
      return Response.json(
        {
          code: 'CLIENT_UPGRADE_REQUIRED',
          expectedProtocol: 'orpc-v2',
          receivedProtocol: proto ?? 'missing',
          message: 'Client RPC protocol is outdated; reload or upgrade.',
        },
        { status: 426, headers: { vary: PROTOCOL_HEADER } },
      );
    }
    const { response } = await v2RpcHandler.handle(req, { prefix: '/api/rpc' });
    return response ?? new Response('Not Found', { status: 404 });
  }

  // Case 2a: v1 client sending `orpc-v1` -> rejected 426 (zero silent corruption!)
  const v1MarkedRes = await handleV2WithProtocolGuard(
    new Request('http://rpc.local/api/rpc/getBig', {
      method: 'POST',
      headers: { [PROTOCOL_HEADER]: 'orpc-v1', 'content-type': 'application/json' },
      body: '{}',
    }),
  );
  assertEquals(v1MarkedRes.status, 426);
  assertEquals((await v1MarkedRes.json()).code, 'CLIENT_UPGRADE_REQUIRED');

  // Case 2b: legacy pre-Phase-0 v1 client sending NO header -> ALSO rejected 426!
  const legacyNoHeaderRes = await handleV2WithProtocolGuard(
    new Request('http://rpc.local/api/rpc/getBig', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }),
  );
  assertEquals(legacyNoHeaderRes.status, 426);
  assertEquals((await legacyNoHeaderRes.json()).receivedProtocol, 'missing');

  // Case 2c: v2 client sending `orpc-v2` -> succeeds with genuine BigInt 10n!
  const v2Client = createORPCClientV2(
    new RPCLinkV2({
      origin: 'http://rpc.local',
      url: '/api/rpc',
      headers: () => ({ [PROTOCOL_HEADER]: 'orpc-v2' }),
      fetch: (url, init) => handleV2WithProtocolGuard(new Request(url, init)),
    }),
  ) as { getBig: () => Promise<bigint> };
  const intactBigInt = await v2Client.getBig();
  assertEquals(typeof intactBigInt, 'bigint');
  assertEquals(intactBigInt, 10n);

  // 3. Reverse direction guard: Phase-0 v1 handler rejects `orpc-v2` with 426!
  const v1Handler = new RPCHandlerV1({ ping: osV1.handler(() => ({ ok: true })) });
  async function handleV1WithProtocolGuard(req: Request): Promise<Response> {
    const proto = req.headers.get(PROTOCOL_HEADER);
    if (proto !== null && proto !== 'orpc-v1') {
      return Response.json(
        { code: 'CLIENT_PROTOCOL_UNSUPPORTED', expectedProtocol: 'orpc-v1', receivedProtocol: proto },
        { status: 426, headers: { vary: PROTOCOL_HEADER } },
      );
    }
    const { response } = await v1Handler.handle(req, { prefix: '/api/rpc' });
    return response ?? new Response('Not Found', { status: 404 });
  }
  const v2ToV1Res = await handleV1WithProtocolGuard(
    new Request('http://rpc.local/api/rpc/ping', {
      method: 'POST',
      headers: { [PROTOCOL_HEADER]: 'orpc-v2', 'content-type': 'application/json' },
      body: '{}',
    }),
  );
  assertEquals(v2ToV1Res.status, 426);

  // 4. Empirical check of OpenAPILink v1 -> OpenAPIHandler v2 interoperability (JSON-safe payload)
  const v1OpenApiContract = {
    getOpenApiItem: osV1
      .route({ method: 'GET', path: '/items/{id}' })
      .input(z.object({ id: z.string() }))
      .output(z.object({ id: z.string(), count: z.number().int() })),
  };
  const v1OpenApiClient = createORPCClientV1(
    new OpenAPILinkV1(v1OpenApiContract, {
      url: 'http://api.local/api',
      fetch: async (req, init) => {
        const { response } = await v2OpenApiHandler.handle(new Request(req, init), { prefix: '/api' });
        return response ?? new Response('Not Found', { status: 404 });
      },
    }),
  ) as { getOpenApiItem: (input: { id: string }) => Promise<{ id: string; count: number }> };
  assertEquals(await v1OpenApiClient.getOpenApiItem({ id: 'abc' }), { id: 'abc', count: 42 });
});

// ===========================================================================
// PROBE B2: GET-first queries on v2 — default GET rejection vs explicit contract
//           allowMethods + GetMethodCsrfProtectionHandlerPlugin matrix
// ===========================================================================
Deno.test('B2: default v2 RPCHandler rejects GET; explicit contract GET allow-list + CSRF plugin matrix verified', async () => {
  const router = {
    listItems: osV2
      .meta(openapi({ method: 'GET', path: '/items' }))
      .handler(() => ({ items: ['a', 'b'] })),
    createItem: osV2
      .meta(openapi({ method: 'POST', path: '/items' }))
      .handler(() => ({ created: true })),
  };

  // 1. Default v2 RPCHandler rejects GET -> matched: false (falls through to 404!)
  const defaultHandler = new RPCHandlerV2(router);
  const defaultGet = await defaultHandler.handle(
    new Request('http://rpc.local/api/rpc/listItems', { method: 'GET' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(defaultGet.matched, false);

  // 2. Contract-declared GET allow-list + GetMethodCsrfProtectionHandlerPlugin
  const getEnabledHandler = new RPCHandlerV2(router, {
    allowMethods: (method, procedure) => {
      if (method === 'POST') return true;
      if (method === 'GET') return getOpenAPIMeta(procedure)?.method === 'GET';
      return false;
    },
    plugins: [new GetMethodCsrfProtectionHandlerPlugin()],
  });

  // 2a. GET on mutation (`method: 'POST'`) -> STILL unmatched (404)!
  const getOnMutation = await getEnabledHandler.handle(
    new Request('http://rpc.local/api/rpc/createItem', { method: 'GET' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(getOnMutation.matched, false);

  // 2b. Non-browser / server-to-server GET (no Sec-Fetch-* headers) -> 200
  const s2s = await getEnabledHandler.handle(
    new Request('http://rpc.local/api/rpc/listItems', { method: 'GET' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(s2s.matched, true);
  assertEquals(s2s.response?.status, 200);

  // 2c. Same-origin & same-site browser GET -> 200
  for (const site of ['same-origin', 'same-site']) {
    const res = await getEnabledHandler.handle(
      new Request('http://rpc.local/api/rpc/listItems', {
        method: 'GET',
        headers: { 'sec-fetch-site': site, 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty' },
      }),
      { prefix: '/api/rpc' },
    );
    assertEquals(res.response?.status, 200);
  }

  // 2d. Cross-site browser fetch WITH full Fetch Metadata (`cors` + `empty`) -> 200 (governed by withCors allowlist)
  const crossSiteFetchFull = await getEnabledHandler.handle(
    new Request('http://rpc.local/api/rpc/listItems', {
      method: 'GET',
      headers: { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty' },
    }),
    { prefix: '/api/rpc' },
  );
  assertEquals(crossSiteFetchFull.response?.status, 200);

  // 2e. Cross-site with partial metadata (missing `sec-fetch-dest`) -> 403 FORBIDDEN!
  const crossSitePartial = await getEnabledHandler.handle(
    new Request('http://rpc.local/api/rpc/listItems', {
      method: 'GET',
      headers: { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'cors' },
    }),
    { prefix: '/api/rpc' },
  );
  assertEquals(crossSitePartial.response?.status, 403);

  // 2f. Cross-site top-level navigation (`navigate` + `document`) -> 403 FORBIDDEN!
  const crossSiteNav = await getEnabledHandler.handle(
    new Request('http://rpc.local/api/rpc/listItems', {
      method: 'GET',
      headers: { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' },
    }),
    { prefix: '/api/rpc' },
  );
  assertEquals(crossSiteNav.response?.status, 403);
});

// ===========================================================================
// PROBE B4: All 4 silent v2 runtime changes verified empirically
// ===========================================================================
Deno.test('B4: silent runtime changes (routingInterceptors rename, 400 fallback status, ignored defined option, middleware dedup removal)', async () => {
  // 1. Interceptor rename: `rootInterceptors` is silently ignored on v2; `routingInterceptors` runs!
  let legacyRootFired = false;
  let v2RoutingFired = false;
  const handler = new RPCHandlerV2(
    {
      ok: osV2.handler(() => ({ ok: true })),
      unmappedErr: osV2.handler(() => {
        throw new ORPCErrorV2('CUSTOM_INFRA_FAILURE', { message: 'boom' });
      }),
    },
    {
      plugins: [
        {
          name: 'probe-interceptors',
          init(options) {
            // Legacy property pushed on structural options -> silently ignored by v2 StandardHandler!
            const legacy = options as unknown as { rootInterceptors?: Array<(o: { next: () => Promise<unknown> }) => Promise<unknown>> };
            legacy.rootInterceptors ??= [];
            legacy.rootInterceptors.push((o) => {
              legacyRootFired = true;
              return o.next();
            });
            return {
              ...options,
              routingInterceptors: [
                ...(options.routingInterceptors ?? []),
                (o) => {
                  v2RoutingFired = true;
                  return o.next();
                },
              ],
            };
          },
        },
      ],
    },
  );
  const okRes = await handler.handle(
    new Request('http://rpc.local/api/rpc/ok', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(okRes.response?.status, 200);
  assertEquals(legacyRootFired, false); // Silent loss if only `name` + return options are done!
  assertEquals(v2RoutingFired, true);

  // 2. Unmapped error code defaults to HTTP 400 in v2 (was 500 in v1)!
  const unmappedRes = await handler.handle(
    new Request('http://rpc.local/api/rpc/unmappedErr', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(unmappedRes.response?.status, 400);

  // 3. `defined` constructor option is IGNORED in v2; only contract errors / reconcileORPCError set `defined: true`!
  const manualErr = new ORPCErrorV2('CUSTOM_CODE', {
    message: 'remedy',
    ...({ defined: true } as Record<string, unknown>),
  });
  assertEquals(manualErr.defined, false);
  const reconciled = await reconcileORPCError({
    CUSTOM_CODE: { message: 'default' },
  }, manualErr);
  assertEquals(reconciled.defined, true);

  // 4. Middleware deduplication removed: same middleware at router + procedure runs TWICE on v2!
  let rawRuns = 0;
  const dupMw = osV2.middleware(({ next }) => {
    rawRuns += 1;
    return next();
  });
  const dupRouter = osV2.use(dupMw).router({
    ping: osV2.use(dupMw).handler(() => 'pong'),
  });
  await callV2(dupRouter.ping, undefined);
  assertEquals(rawRuns, 2); // Runs TWICE on v2 (ran ONCE on v1)!

  // Idempotent context-symbol guard ensures once-only execution even if attached twice:
  const GUARD = Symbol('netscript.pipeline.executed');
  let guardedRuns = 0;
  const guardedMw = osV2.middleware(({ context, next }) => {
    const bag = context as Record<symbol, boolean>;
    if (bag[GUARD]) return next();
    guardedRuns += 1;
    return next({ context: { [GUARD]: true } as never });
  });
  const guardedRouter = osV2.use(guardedMw).router({
    ping: osV2.use(guardedMw).handler(() => 'pong'),
  });
  await callV2(guardedRouter.ping, undefined);
  assertEquals(guardedRuns, 1);
});

// ===========================================================================
// PROBE B6: `@orpc/openapi/extensions/route` + unified `.meta(accessMeta(...))`
// ===========================================================================
Deno.test('B6: @orpc/openapi/extensions/route restores .route() and defineMeta powers .meta(accessMeta(...)) on v2', () => {
  interface AccessPolicy {
    readonly authentication: 'none' | 'required';
    readonly scopes?: readonly string[];
  }
  const [accessMeta, getAccessMeta] = defineMeta<'netscript.access', AccessPolicy>(
    'netscript.access',
    (incoming) => incoming,
  );

  const proc = ocV2
    .route({ method: 'GET', path: '/orders/{id}' })
    .meta(accessMeta({ authentication: 'required', scopes: ['orders:read'] }))
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string() }));

  const oaMeta = getOpenAPIMeta(proc);
  assertEquals(oaMeta?.method, 'GET');
  assertEquals(oaMeta?.path, '/orders/{id}');
  assertEquals(getAccessMeta(proc), { authentication: 'required', scopes: ['orders:read'] });
});

// ===========================================================================
// PROBE B7: Cross-origin 307 redirect behavior on v2 — default leak vs
//           `redirect: 'manual'` (undefined!) vs `redirect: 'error'` (throws, 0 foreign hits)
// ===========================================================================
Deno.test('B7: v2 RPCLink follows cross-origin 307 by default; redirect: manual resolves undefined; redirect: error throws with 0 foreign hits', async () => {
  const foreignHits: Array<{ customHeader: string | null; traceparent: string | null; body: string }> = [];

  const foreignServer = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => {} }, async (req) => {
    foreignHits.push({
      customHeader: req.headers.get('x-api-key'),
      traceparent: req.headers.get('traceparent'),
      body: await req.text(),
    });
    return Response.json({ json: { stolen: true } });
  });

  const originServer = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => {} }, () => {
    return new Response(null, {
      status: 307,
      headers: { location: `http://127.0.0.1:${foreignServer.addr.port}/trap` },
    });
  });

  try {
    // 1. Default v2 RPCLink follows 307, leaks custom header + traceparent + body to foreign server!
    const defaultClient = createORPCClientV2(
      new RPCLinkV2({
        origin: `http://127.0.0.1:${originServer.addr.port}`,
        url: '/api/rpc',
        headers: () => ({
          'x-api-key': 'secret-api-key',
          traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        }),
      }),
    ) as { submit: (input: { payload: string }) => Promise<unknown> };

    const leakedResult = await defaultClient.submit({ payload: 'sensitive-body' });
    assertEquals(leakedResult, { stolen: true });
    assertEquals(foreignHits.length, 1);
    assertEquals(foreignHits[0].customHeader, 'secret-api-key');
    assertEquals(foreignHits[0].traceparent, '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01');
    assert(foreignHits[0].body.includes('sensitive-body'));

    // 2. `redirect: 'manual'` stops forwarding, BUT resolves successfully with `undefined`!
    foreignHits.length = 0;
    const manualClient = createORPCClientV2(
      new RPCLinkV2({
        origin: `http://127.0.0.1:${originServer.addr.port}`,
        url: '/api/rpc',
        headers: () => ({ 'x-api-key': 'secret-api-key' }),
        fetch: (url, init) => globalThis.fetch(url, { ...init, redirect: 'manual' }),
      }),
    ) as { submit: (input: { payload: string }) => Promise<unknown> };
    const manualResult = await manualClient.submit({ payload: 'should-not-succeed' });
    assertEquals(manualResult, undefined);
    assertEquals(foreignHits.length, 0);

    // 3. NetScript decided policy: `redirect: 'error'` enforced AFTER spread -> throws TypeError AND 0 foreign hits!
    foreignHits.length = 0;
    const errorClient = createORPCClientV2(
      new RPCLinkV2({
        origin: `http://127.0.0.1:${originServer.addr.port}`,
        url: '/api/rpc',
        headers: () => ({ 'x-api-key': 'secret-api-key' }),
        fetch: (url, init) => globalThis.fetch(url, { ...init, redirect: 'error' }),
      }),
    ) as { submit: (input: { payload: string }) => Promise<unknown> };
    await assertRejects(() => errorClient.submit({ payload: 'protected' }), TypeError);
    assertEquals(foreignHits.length, 0);
  } finally {
    await originServer.shutdown();
    await foreignServer.shutdown();
  }
});
