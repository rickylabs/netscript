/**
 * RFC B Empirical Behavior Probes (Round-2 Revision) — Verifying oRPC v2 (`2.0.0-beta.53`) vs v1 (`1.15.5`)
 * behaviors for Round-1 blockers (B1, B2, B4, B6, B7) and Round-2 blockers (N1–N4).
 *
 * Runs standalone (`--no-lock --no-config`) so workspace `deno.json` and `deno.lock` are untouched.
 *
 * Usage:
 *   mise exec -- deno test --no-lock --no-config -A .llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/probes/v2-behavior-probes.ts
 */

import { assert, assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@1';
import { z } from 'npm:zod@4.6.5';

// oRPC v1 (locked 1.15.5)
import { createORPCClient as createORPCClientV1 } from 'npm:@orpc/client@1.15.5';
import { RPCLink as RPCLinkV1 } from 'npm:@orpc/client@1.15.5/fetch';
import { os as osV1 } from 'npm:@orpc/server@1.15.5';
import { RPCHandler as RPCHandlerV1 } from 'npm:@orpc/server@1.15.5/fetch';
import { OpenAPILink as OpenAPILinkV1 } from 'npm:@orpc/openapi-client@1.15.5/fetch';

// oRPC v2 (2.0.0-beta.53)
import { createORPCClient as createORPCClientV2, ORPCError as ORPCErrorV2 } from 'npm:@orpc/client@2.0.0-beta.53';
import { RPCLink as RPCLinkV2 } from 'npm:@orpc/client@2.0.0-beta.53/fetch';
import { defineMeta, oc as ocV2, reconcileORPCError } from 'npm:@orpc/contract@2.0.0-beta.53';
import { call as callV2, implement as implementV2, os as osV2 } from 'npm:@orpc/server@2.0.0-beta.53';
import { RPCHandler as RPCHandlerV2 } from 'npm:@orpc/server@2.0.0-beta.53/fetch';
import {
  CORSHandlerPlugin,
  GetMethodCsrfProtectionHandlerPlugin,
} from 'npm:@orpc/server@2.0.0-beta.53/plugins';
import { getOpenAPIMeta, openapi, OpenAPIGenerator } from 'npm:@orpc/openapi@2.0.0-beta.53';
import { OpenAPIHandler as OpenAPIHandlerV2 } from 'npm:@orpc/openapi@2.0.0-beta.53/fetch';

const PROTOCOL_HEADER = 'x-netscript-rpc-protocol';

function appendVary(headers: Headers, token: string): void {
  const existing = headers.get('vary');
  if (!existing) {
    headers.set('vary', token);
    return;
  }
  const tokens = existing.split(',').map((t) => t.trim().toLowerCase());
  if (!tokens.includes(token.toLowerCase())) {
    headers.set('vary', `${existing}, ${token}`);
  }
}

function withProtocolHeaderAllowed(allowHeaders: readonly string[]): string[] {
  const hasHeader = allowHeaders.some((h) => h.toLowerCase() === PROTOCOL_HEADER);
  return hasHeader ? [...allowHeaders] : [...allowHeaders, 'X-NetScript-RPC-Protocol'];
}

// ===========================================================================
// PROBE B1 + N1: Mixed v1/v2 silent corruption, fail-closed 426 guard with
//                OPTIONS preflight exemption, CORS allowHeaders injection,
//                Vary on 200 GET + 426, and OpenAPILink JSON bridge
// ===========================================================================
Deno.test('B1 + N1: mixed v1/v2 corruption, 426 guard exempts OPTIONS preflight & emits Vary on 200 GET, CORS allowHeaders includes protocol header, OpenAPILink bridge', async () => {
  const v2Router = {
    getBig: osV2.handler(() => 10n),
    getRead: osV2
      .meta(openapi({ method: 'GET', path: '/items/read' }))
      .handler(() => ({ ok: true })),
    failNotFound: osV2.handler(() => {
      throw new ORPCErrorV2('NOT_FOUND', { message: 'nope' });
    }),
    getOpenApiItem: osV2
      .meta(openapi({ method: 'GET', path: '/items/{id}' }))
      .input(z.object({ id: z.string() }))
      .output(z.object({ id: z.string(), count: z.number().int() }))
      .handler(({ input }) => ({ id: input.id, count: 42 })),
  };

  const v2RpcHandler = new RPCHandlerV2(v2Router, {
    allowMethods: (method, proc) =>
      method === 'POST' || (method === 'GET' && getOpenAPIMeta(proc)?.method === 'GET'),
    plugins: [
      new CORSHandlerPlugin({
        origin: 'https://app.example.com',
        allowHeaders: withProtocolHeaderAllowed(['Authorization', 'Content-Type']),
      }),
    ],
  });
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
  assertEquals(typeof corruptedBigInt, 'string');
  assertEquals(corruptedBigInt, '10');

  let degradedErrorMsg = '';
  try {
    await unguardedV1Client.failNotFound();
  } catch (err) {
    degradedErrorMsg = (err as Error).message;
  }
  assertEquals(degradedErrorMsg, 'Not Found');

  // 2. N1 FAILING CONTROL: Naive Round-1 guard without OPTIONS exemption returns 426 on browser CORS preflight!
  async function naiveGuardWithoutOptionsExemption(req: Request): Promise<Response> {
    if (req.headers.get(PROTOCOL_HEADER) !== 'orpc-v2') {
      return Response.json({ code: 'CLIENT_UPGRADE_REQUIRED' }, { status: 426 });
    }
    const { response } = await v2RpcHandler.handle(req, { prefix: '/api/rpc' });
    return response ?? new Response('Not Found', { status: 404 });
  }
  const preflightReq = () =>
    new Request('http://rpc.local/api/rpc/getRead', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://app.example.com',
        'access-control-request-method': 'GET',
        'access-control-request-headers': PROTOCOL_HEADER,
      },
    });
  assertEquals((await naiveGuardWithoutOptionsExemption(preflightReq())).status, 426); // Reproduces N1 preflight breakage!

  // 3. N1 PASSING PROOF: Hardened v2 protocol guard exempts OPTIONS AND adds Vary on 200 GET AND 426!
  async function handleV2WithProtocolGuard(req: Request): Promise<Response> {
    // Exempt CORS preflight OPTIONS so withCors() / CORSHandlerPlugin answers 204!
    if (req.method === 'OPTIONS') {
      const { response } = await v2RpcHandler.handle(req, { prefix: '/api/rpc' });
      return response ?? new Response(null, { status: 204 });
    }
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
    if (!response) return new Response('Not Found', { status: 404 });
    const headers = new Headers(response.headers);
    appendVary(headers, 'X-NetScript-RPC-Protocol');
    return new Response(response.body, { status: response.status, headers });
  }

  // N1: Browser OPTIONS preflight succeeds 204 and allows X-NetScript-RPC-Protocol!
  const preflightRes = await handleV2WithProtocolGuard(preflightReq());
  assertEquals(preflightRes.status, 204);
  const allowedHeaders = preflightRes.headers.get('access-control-allow-headers') ?? '';
  assert(allowedHeaders.toLowerCase().includes(PROTOCOL_HEADER));

  // N1: 200 GET response carries `Vary: ..., X-NetScript-RPC-Protocol` (for CDN/proxy/blue-green cache correctness!)
  const get200Res = await handleV2WithProtocolGuard(
    new Request('http://rpc.local/api/rpc/getRead', {
      method: 'GET',
      headers: {
        origin: 'https://app.example.com',
        [PROTOCOL_HEADER]: 'orpc-v2',
      },
    }),
  );
  assertEquals(get200Res.status, 200);
  const varyOn200 = get200Res.headers.get('vary') ?? '';
  assert(varyOn200.toLowerCase().includes(PROTOCOL_HEADER));
  await get200Res.body?.cancel();

  // Case 3a: v1 client sending `orpc-v1` -> rejected 426
  const v1MarkedRes = await handleV2WithProtocolGuard(
    new Request('http://rpc.local/api/rpc/getBig', {
      method: 'POST',
      headers: { [PROTOCOL_HEADER]: 'orpc-v1', 'content-type': 'application/json' },
      body: '{}',
    }),
  );
  assertEquals(v1MarkedRes.status, 426);
  assertEquals((await v1MarkedRes.json()).code, 'CLIENT_UPGRADE_REQUIRED');

  // Case 3b: v1 client sending NO header (default 0.0.10 behavior!) -> STILL rejected 426!
  const legacyNoHeaderRes = await handleV2WithProtocolGuard(
    new Request('http://rpc.local/api/rpc/getBig', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }),
  );
  assertEquals(legacyNoHeaderRes.status, 426);
  assertEquals((await legacyNoHeaderRes.json()).receivedProtocol, 'missing');

  // Case 3c: v2 client sending `orpc-v2` -> succeeds with genuine BigInt 10n!
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

  // 4. Reverse direction guard on Phase 0a v1 handler: exempts OPTIONS, rejects `orpc-v2` with 426, adds Vary on 200!
  const v1Handler = new RPCHandlerV1({ ping: osV1.handler(() => ({ ok: true })) });
  async function handleV1WithProtocolGuard(req: Request): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }
    const proto = req.headers.get(PROTOCOL_HEADER);
    if (proto !== null && proto !== 'orpc-v1') {
      return Response.json(
        { code: 'CLIENT_PROTOCOL_UNSUPPORTED', expectedProtocol: 'orpc-v1', receivedProtocol: proto },
        { status: 426, headers: { vary: 'X-NetScript-RPC-Protocol' } },
      );
    }
    const { response } = await v1Handler.handle(req, { prefix: '/api/rpc' });
    if (!response) return new Response('Not Found', { status: 404 });
    const headers = new Headers(response.headers);
    appendVary(headers, 'X-NetScript-RPC-Protocol');
    return new Response(response.body, { status: response.status, headers });
  }
  assertEquals(
    (await handleV1WithProtocolGuard(
      new Request('http://rpc.local/api/rpc/ping', {
        method: 'POST',
        headers: { [PROTOCOL_HEADER]: 'orpc-v2', 'content-type': 'application/json' },
        body: '{}',
      }),
    )).status,
    426,
  );
  const v1OkRes = await handleV1WithProtocolGuard(
    new Request('http://rpc.local/api/rpc/ping', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    }),
  );
  assertEquals(v1OkRes.status, 200);
  assert((v1OkRes.headers.get('vary') ?? '').toLowerCase().includes(PROTOCOL_HEADER));
  await v1OkRes.body?.cancel();

  // 5. OpenAPILink v1 -> OpenAPIHandler v2 interoperability (JSON-safe payload)
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
// PROBE B2 + N3: GET allow-list + CSRF matrix + PUT/PATCH/DELETE/HEAD->GET parity
//                + paired `allowGetRpc: false` with SDK `transportPolicy: { method: () => 'POST' }`
// ===========================================================================
Deno.test('B2 + N3: contract GET allow-list + CSRF matrix, PUT/PATCH/DELETE/HEAD->GET parity, and paired allowGetRpc:false + POST transportPolicy', async () => {
  const router = {
    listItems: osV2.meta(openapi({ method: 'GET', path: '/items' })).handler(() => ({ items: ['a', 'b'] })),
    headItems: osV2.meta(openapi({ method: 'HEAD', path: '/items' })).handler(() => ({ alive: true })),
    createItem: osV2.meta(openapi({ method: 'POST', path: '/items' })).handler(() => ({ created: true })),
    putItem: osV2.meta(openapi({ method: 'PUT', path: '/items/{id}' })).handler(() => ({ put: true })),
    patchItem: osV2.meta(openapi({ method: 'PATCH', path: '/items/{id}' })).handler(() => ({ patched: true })),
    deleteItem: osV2.meta(openapi({ method: 'DELETE', path: '/items/{id}' })).handler(() => ({ deleted: true })),
  };

  // N3 SDK replacement for removed `inferRPCMethodFromContractRouter`:
  // preserves GET, HEAD->GET, POST, PUT, PATCH, DELETE (100% parity with v1 & transport-policy_test.ts:35!)
  function inferRpcMethodFromProcedure(procedureNode: unknown): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' {
    const declared = getOpenAPIMeta(procedureNode as Parameters<typeof getOpenAPIMeta>[0])?.method;
    if (declared === 'HEAD') return 'GET';
    if (
      declared === 'GET' || declared === 'POST' || declared === 'PUT' ||
      declared === 'PATCH' || declared === 'DELETE'
    ) {
      return declared;
    }
    return 'POST';
  }
  assertEquals(inferRpcMethodFromProcedure(router.listItems), 'GET');
  assertEquals(inferRpcMethodFromProcedure(router.headItems), 'GET'); // HEAD -> GET parity!
  assertEquals(inferRpcMethodFromProcedure(router.createItem), 'POST');
  assertEquals(inferRpcMethodFromProcedure(router.putItem), 'PUT');
  assertEquals(inferRpcMethodFromProcedure(router.patchItem), 'PATCH');
  assertEquals(inferRpcMethodFromProcedure(router.deleteItem), 'DELETE');

  // 1. Default v2 RPCHandler rejects GET -> matched: false (404)
  const defaultHandler = new RPCHandlerV2(router);
  assertEquals(
    (await defaultHandler.handle(new Request('http://rpc.local/api/rpc/listItems', { method: 'GET' }), { prefix: '/api/rpc' })).matched,
    false,
  );

  // 2. N3 Updated allowMethods: preserves RPC_DEFAULT_ALLOW_METHODS (POST/PUT/PATCH/DELETE) + contract GET/HEAD!
  const DEFAULT_WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  const getEnabledHandler = new RPCHandlerV2(router, {
    allowMethods: (method, procedure) => {
      if (DEFAULT_WRITE_METHODS.has(method)) return true;
      if (method === 'GET') {
        const declared = getOpenAPIMeta(procedure)?.method;
        return declared === 'GET' || declared === 'HEAD';
      }
      return false;
    },
    plugins: [new GetMethodCsrfProtectionHandlerPlugin()],
  });

  // 2a. PUT, PATCH, DELETE, and HEAD->GET all match & return 200!
  for (const [proc, method] of [
    ['putItem', 'PUT'],
    ['patchItem', 'PATCH'],
    ['deleteItem', 'DELETE'],
  ] as const) {
    const res = await getEnabledHandler.handle(
      new Request(`http://rpc.local/api/rpc/${proc}`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
      { prefix: '/api/rpc' },
    );
    assertEquals(res.matched, true);
    assertEquals(res.response?.status, 200);
  }
  const headViaGet = await getEnabledHandler.handle(
    new Request('http://rpc.local/api/rpc/headItems', { method: 'GET' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(headViaGet.matched, true);
  assertEquals(headViaGet.response?.status, 200);

  // 2b. GET on mutation (`POST`) -> STILL unmatched (404)!
  assertEquals(
    (await getEnabledHandler.handle(new Request('http://rpc.local/api/rpc/createItem', { method: 'GET' }), { prefix: '/api/rpc' })).matched,
    false,
  );

  // 2c. CSRF matrix on GET
  assertEquals(
    (await getEnabledHandler.handle(new Request('http://rpc.local/api/rpc/listItems', { method: 'GET' }), { prefix: '/api/rpc' })).response?.status,
    200,
  );
  for (const site of ['same-origin', 'same-site', 'cross-site']) {
    const res = await getEnabledHandler.handle(
      new Request('http://rpc.local/api/rpc/listItems', {
        method: 'GET',
        headers: { 'sec-fetch-site': site, 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty' },
      }),
      { prefix: '/api/rpc' },
    );
    assertEquals(res.response?.status, 200);
  }
  assertEquals(
    (await getEnabledHandler.handle(
      new Request('http://rpc.local/api/rpc/listItems', {
        method: 'GET',
        headers: { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'cors' },
      }),
      { prefix: '/api/rpc' },
    )).response?.status,
    403,
  );
  assertEquals(
    (await getEnabledHandler.handle(
      new Request('http://rpc.local/api/rpc/listItems', {
        method: 'GET',
        headers: { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' },
      }),
      { prefix: '/api/rpc' },
    )).response?.status,
    403,
  );

  // 3. N3 Paired `allowGetRpc: false` server + SDK `transportPolicy: { method: () => 'POST' }`:
  //    Server with `allowGetRpc: false` rejects GET (404) when client sends GET, succeeds 200 when client pairs POST!
  const postOnlyHandler = new RPCHandlerV2(router, {
    allowMethods: (method) => DEFAULT_WRITE_METHODS.has(method),
  });
  const unpairedGet = await postOnlyHandler.handle(
    new Request('http://rpc.local/api/rpc/listItems', { method: 'GET' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(unpairedGet.matched, false); // Fails 404 without client transportPolicy pairing!

  const pairedPostClient = createORPCClientV2(
    new RPCLinkV2({
      origin: 'http://rpc.local',
      url: '/api/rpc',
      method: () => 'POST', // Mirrors SDK `transportPolicy: { method: () => 'POST' }`
      fetch: async (url, init) => {
        const { response } = await postOnlyHandler.handle(new Request(url, init), { prefix: '/api/rpc' });
        return response ?? new Response('Not Found', { status: 404 });
      },
    }),
  ) as { listItems: () => Promise<{ items: string[] }> };
  assertEquals(await pairedPostClient.listItems(), { items: ['a', 'b'] });
});

// ===========================================================================
// PROBE B4 + N2: All silent v2 runtime changes + v1 vs v2 interceptor proof +
//                error.status / resolveErrorHttpStatus / errorStatusMap conflict merge +
//                standalone handler 500 normalization preserving custom err.code
// ===========================================================================
Deno.test('B4 + N2: v1 rootInterceptors vs v2 routingInterceptors, standalone 500 unmapped-code status preserving code, resolveErrorHttpStatus/TracingPlugin, conflict merge, defined, middleware dedup', async () => {
  // 1. N2 v1 vs v2 interceptor execution proof (in REAL RPCHandlers, never plain `{}`!)
  let v1RootRan = false;
  let v1RoutingRan = false;
  const v1Handler = new RPCHandlerV1(
    { ok: osV1.handler(() => ({ ok: true })) },
    {
      plugins: [
        {
          init(options) {
            options.rootInterceptors ??= [];
            options.rootInterceptors.push((o) => {
              v1RootRan = true;
              return o.next();
            });
            // Pushing `routingInterceptors` on v1 is silently ignored!
            const v2Field = options as unknown as { routingInterceptors?: Array<(o: { next: () => Promise<unknown> }) => Promise<unknown>> };
            v2Field.routingInterceptors ??= [];
            v2Field.routingInterceptors.push((o) => {
              v1RoutingRan = true;
              return o.next();
            });
          },
        },
      ],
    },
  );
  const v1Ok = await v1Handler.handle(
    new Request('http://rpc.local/api/rpc/ok', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ json: {} }) }),
    { prefix: '/api/rpc' },
  );
  assertEquals(v1Ok.response?.status, 200);
  assertEquals(v1RootRan, true);
  assertEquals(v1RoutingRan, false); // Proves switching to `routingInterceptors` in 0.0.10 would break v1!

  // On v2: `rootInterceptors` is silently ignored; `routingInterceptors` runs!
  let v2RootRan = false;
  let v2RoutingRan = false;
  const v2RawHandler = new RPCHandlerV2(
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
            const legacy = options as unknown as { rootInterceptors?: Array<(o: { next: () => Promise<unknown> }) => Promise<unknown>> };
            legacy.rootInterceptors ??= [];
            legacy.rootInterceptors.push((o) => {
              v2RootRan = true;
              return o.next();
            });
            return {
              ...options,
              routingInterceptors: [
                ...(options.routingInterceptors ?? []),
                (o) => {
                  v2RoutingRan = true;
                  return o.next();
                },
              ],
            };
          },
        },
      ],
    },
  );
  const v2Ok = await v2RawHandler.handle(
    new Request('http://rpc.local/api/rpc/ok', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(v2Ok.response?.status, 200);
  assertEquals(v2RootRan, false);
  assertEquals(v2RoutingRan, true);

  // 2. N2 Failing control: raw v2 RPCHandler returns HTTP 400 for unmapped code!
  const rawUnmappedRes = await v2RawHandler.handle(
    new Request('http://rpc.local/api/rpc/unmappedErr', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(rawUnmappedRes.response?.status, 400);

  // 3. N2 Passing proof: `mergeErrorStatusMaps` (fail-fast on conflict) + `createDefault500ErrorStatusMap`
  //    gives HTTP 500 AND preserves custom `code: 'CUSTOM_INFRA_FAILURE'` on BOTH standalone RPCHandler
  //    AND standalone OpenAPIHandler even with NO ErrorHandlingPlugin installed!
  function mergeErrorStatusMaps(
    ...maps: readonly Readonly<Record<string, number>>[]
  ): Record<string, number> {
    const merged: Record<string, number> = {};
    for (const map of maps) {
      for (const [code, status] of Object.entries(map)) {
        if (Object.hasOwn(merged, code) && merged[code] !== status) {
          throw new Error(`Conflicting HTTP status for error code "${code}": ${merged[code]} vs ${status}`);
        }
        merged[code] = status;
      }
    }
    return merged;
  }
  assertThrows(
    () => mergeErrorStatusMaps({ ORDER_LOCKED: 409 }, { ORDER_LOCKED: 423 }),
    Error,
    'Conflicting HTTP status for error code "ORDER_LOCKED"',
  );

  function createDefault500ErrorStatusMap(base: Readonly<Record<string, number>>): Record<string, number> {
    return new Proxy({ ...base }, {
      get(target, prop, receiver) {
        if (typeof prop === 'string' && !Object.hasOwn(target, prop)) return 500;
        return Reflect.get(target, prop, receiver);
      },
      getOwnPropertyDescriptor(target, prop) {
        if (typeof prop === 'string' && !Object.hasOwn(target, prop)) {
          return { configurable: true, enumerable: true, value: 500, writable: false };
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });
  }

  const mergedStatuses = mergeErrorStatusMaps(
    {
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      VALIDATION_ERROR: 422,
      RATE_LIMITED: 429,
      INTERNAL_SERVER_ERROR: 500,
      SERVICE_UNAVAILABLE: 503,
    },
    { ORDER_LOCKED: 409 },
  );
  const standaloneStatusMap = createDefault500ErrorStatusMap(mergedStatuses);

  const standaloneRouter = {
    unmappedErr: osV2.handler(() => {
      throw new ORPCErrorV2('CUSTOM_INFRA_FAILURE', { message: 'db down' });
    }),
    orderLocked: osV2.handler(() => {
      throw new ORPCErrorV2('ORDER_LOCKED', { message: 'locked' });
    }),
  };

  // ZERO ErrorHandlingPlugin installed — works for standalone createRPCHandler(router) & createOpenAPIHandler(router)!
  const standaloneRpc = new RPCHandlerV2(standaloneRouter, { errorStatusMap: standaloneStatusMap });
  const standaloneOa = new OpenAPIHandlerV2(standaloneRouter, { errorStatusMap: standaloneStatusMap });

  const rpcUnmapped = await standaloneRpc.handle(
    new Request('http://rpc.local/api/rpc/unmappedErr', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(rpcUnmapped.response?.status, 500);
  const rpcUnmappedBody = await rpcUnmapped.response?.json();
  assertEquals(rpcUnmappedBody.json.code, 'CUSTOM_INFRA_FAILURE'); // Custom code preserved!

  const oaUnmapped = await standaloneOa.handle(
    new Request('http://rpc.local/api/unmappedErr', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    { prefix: '/api' },
  );
  assertEquals(oaUnmapped.response?.status, 500);
  const oaUnmappedBody = await oaUnmapped.response?.json();
  assertEquals(oaUnmappedBody.code, 'CUSTOM_INFRA_FAILURE');

  const rpcLocked = await standaloneRpc.handle(
    new Request('http://rpc.local/api/rpc/orderLocked', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(rpcLocked.response?.status, 409);

  // 4. N2 `error.status` absence + `resolveErrorHttpStatus` for TracingPlugin / LoggingPlugin / ErrorHandlingPlugin
  function resolveErrorHttpStatus(error: unknown, errorStatusMap: Readonly<Record<string, number>>): number {
    if (error && typeof error === 'object') {
      const e = error as { readonly code?: unknown; readonly status?: unknown };
      if (typeof e.status === 'number') return e.status;
      if (typeof e.code === 'string' && Object.hasOwn(errorStatusMap, e.code)) {
        return errorStatusMap[e.code];
      }
    }
    return 500;
  }
  const lockedErrV2 = new ORPCErrorV2('ORDER_LOCKED', { message: 'locked' });
  const unmappedErrV2 = new ORPCErrorV2('CUSTOM_INFRA_FAILURE', { message: 'db down' });
  assertEquals('status' in lockedErrV2, false); // Verified absent in v2!
  assertEquals(resolveErrorHttpStatus(lockedErrV2, mergedStatuses), 409); // TracingPlugin `rpc.error.status` & classifier -> 409 (client)
  assertEquals(resolveErrorHttpStatus(unmappedErrV2, mergedStatuses), 500); // Unmapped -> 500 (server)

  // 5. `defined` constructor option ignored in v2; only contract errors / reconcileORPCError set `defined: true`
  const manualErr = new ORPCErrorV2('CUSTOM_CODE', {
    message: 'remedy',
    ...({ defined: true } as Record<string, unknown>),
  });
  assertEquals(manualErr.defined, false);
  const reconciled = await reconcileORPCError({ CUSTOM_CODE: { message: 'default' } }, manualErr);
  assertEquals(reconciled.defined, true);

  // 6. Middleware deduplication removed: same middleware at router + procedure runs TWICE on v2 vs ONCE with context guard
  let rawRuns = 0;
  const dupMw = osV2.middleware(({ next }) => {
    rawRuns += 1;
    return next();
  });
  const dupRouter = osV2.use(dupMw).router({ ping: osV2.use(dupMw).handler(() => 'pong') });
  await callV2(dupRouter.ping, undefined);
  assertEquals(rawRuns, 2);

  const GUARD = Symbol('netscript.pipeline.executed');
  let guardedRuns = 0;
  const guardedMw = osV2.middleware(({ context, next }) => {
    const bag = context as Record<symbol, boolean>;
    if (bag[GUARD]) return next();
    guardedRuns += 1;
    return next({ context: { [GUARD]: true } as never });
  });
  const guardedRouter = osV2.use(guardedMw).router({ ping: osV2.use(guardedMw).handler(() => 'pong') });
  await callV2(guardedRouter.ping, undefined);
  assertEquals(guardedRuns, 1);
});

// ===========================================================================
// PROBE B6 + N4: Server-free `routeMeta` + `accessMeta` + `policyMeta` via
//                `@orpc/contract` `defineMeta` (ZERO `@orpc/server` in `@netscript/contracts`!),
//                exact `.meta.access` / `.meta.policy` keys, & OpenAPIGenerator compatibility
// ===========================================================================
Deno.test('B6 + N4: server-free routeMeta/accessMeta/policyMeta via @orpc/contract defineMeta preserve exact .meta.access/.meta.policy keys and OpenAPIGenerator compatibility', async () => {
  interface NetScriptRouteMeta {
    readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
    readonly path?: string;
    readonly summary?: string;
    readonly tags?: readonly string[];
  }
  interface AccessPolicy {
    readonly authentication: 'none' | 'required';
    readonly authorization?: { readonly scopes?: readonly string[] };
  }
  interface CachePolicy {
    readonly cache?: 'no-store' | 'default' | 'force-cache';
  }

  // Zero `@orpc/server` or `@orpc/openapi/extensions/route` import needed in browser/universal `@netscript/contracts`!
  const [routeMeta, getRouteMeta] = defineMeta<'~openapi', NetScriptRouteMeta>(
    '~openapi',
    (incoming, current) => ({
      ...current,
      ...incoming,
      ...(current?.tags && incoming.tags ? { tags: [...current.tags, ...incoming.tags] } : {}),
    }),
  );
  // N4: Use exact `'access'` and `'policy'` keys so `proc['~orpc'].meta.access` & `.meta.policy` match existing readers!
  const [accessMeta, getAccessMeta] = defineMeta<'access', AccessPolicy>('access', (incoming) => incoming);
  const [policyMeta, getPolicyMeta] = defineMeta<'policy', CachePolicy>('policy', (incoming) => incoming);

  const contract = {
    getOrder: ocV2
      .meta(routeMeta({ method: 'GET', path: '/orders/{id}', summary: 'Fetch one order' }))
      .meta(accessMeta({ authentication: 'required', authorization: { scopes: ['orders:read'] } }))
      .meta(policyMeta({ cache: 'force-cache' }))
      .input(z.object({ id: z.string() }))
      .output(z.object({ id: z.string() })),
  };

  // Exact key alignment with existing readers (`contract-procedure-index.ts:210`, `stable-v1-adapter.ts:80,102`, `openapi.ts:105`)
  assertEquals(contract.getOrder['~orpc'].meta.access, {
    authentication: 'required',
    authorization: { scopes: ['orders:read'] },
  });
  assertEquals(getAccessMeta(contract.getOrder), contract.getOrder['~orpc'].meta.access);
  assertEquals(contract.getOrder['~orpc'].meta.policy, { cache: 'force-cache' });
  assertEquals(getPolicyMeta(contract.getOrder), contract.getOrder['~orpc'].meta.policy);

  // Full compatibility with `@orpc/openapi` `getOpenAPIMeta` AND `OpenAPIGenerator`!
  const oaMeta = getOpenAPIMeta(contract.getOrder);
  assertEquals(oaMeta?.method, 'GET');
  assertEquals(oaMeta?.path, '/orders/{id}');
  assertEquals(getRouteMeta(contract.getOrder)?.summary, 'Fetch one order');

  const spec = await new OpenAPIGenerator().generate(contract, {
    base: { info: { title: 'Orders', version: '1.0.0' } },
  });
  assertEquals(
    (spec.paths?.['/orders/{id}'] as { get?: { summary?: string } } | undefined)?.get?.summary,
    'Fetch one order',
  );

  // Verify implementing the contract works end-to-end
  const impl = implementV2(contract);
  const router = impl.router({ getOrder: impl.getOrder.handler(({ input }) => ({ id: input.id })) });
  assertEquals(await callV2(router.getOrder, { id: 'ord-9' }), { id: 'ord-9' });
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

    foreignHits.length = 0;
    const manualClient = createORPCClientV2(
      new RPCLinkV2({
        origin: `http://127.0.0.1:${originServer.addr.port}`,
        url: '/api/rpc',
        headers: () => ({ 'x-api-key': 'secret-api-key' }),
        fetch: (url, init) => globalThis.fetch(url, { ...init, redirect: 'manual' }),
      }),
    ) as { submit: (input: { payload: string }) => Promise<unknown> };
    assertEquals(await manualClient.submit({ payload: 'should-not-succeed' }), undefined);
    assertEquals(foreignHits.length, 0);

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
