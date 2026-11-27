/**
 * RFC B Empirical Behavior Probes (Round-3 Revision) — Verifying oRPC v2 (`2.0.0-beta.53`) vs v1 (`1.16.6`)
 * behaviors on Deno 2.9.8 for Round-1 blockers (B1, B2, B4, B6, B7), Round-2 blockers (N1–N4),
 * and Round-3 Sol 6.2 findings (CORS-wrapped 426 + real v1.16.6/v2 beta.53 links + blue-green preflight,
 * complete upstream `COMMON_ERROR_STATUS_MAP` preserving 413/429, and v1.16.6 `.route()` vs `.meta(routeMeta)`).
 *
 * Runs standalone (`--no-lock --no-config`) so workspace `deno.json` and `deno.lock` are untouched.
 *
 * Usage:
 *   mise exec -- deno test --no-lock --no-config -A .llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/probes/v2-behavior-probes.ts
 */

import { assert, assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@1';
import { z } from 'npm:zod@4.6.5';

// oRPC v1 (current origin/main 00325a531 baseline: 1.16.6)
import {
  createORPCClient as createORPCClientV1,
  ORPCError as ORPCErrorV1,
} from 'npm:@orpc/client@1.16.6';
import { RPCLink as RPCLinkV1 } from 'npm:@orpc/client@1.16.6/fetch';
import {
  inferRPCMethodFromContractRouter,
  oc as ocV1,
} from 'npm:@orpc/contract@1.16.6';
import { os as osV1 } from 'npm:@orpc/server@1.16.6';
import { RPCHandler as RPCHandlerV1 } from 'npm:@orpc/server@1.16.6/fetch';
import { CORSPlugin as CORSPluginV1 } from 'npm:@orpc/server@1.16.6/plugins';
import { OpenAPILink as OpenAPILinkV1 } from 'npm:@orpc/openapi-client@1.16.6/fetch';

// oRPC v2 (2.0.0-beta.53)
import {
  createORPCClient as createORPCClientV2,
  MalformedResponseError,
  ORPCError as ORPCErrorV2,
  ResponseError,
} from 'npm:@orpc/client@2.0.0-beta.53';
import { RPCLink as RPCLinkV2 } from 'npm:@orpc/client@2.0.0-beta.53/fetch';
import { defineMeta, oc as ocV2, reconcileORPCError } from 'npm:@orpc/contract@2.0.0-beta.53';
import {
  call as callV2,
  COMMON_ERROR_STATUS_MAP,
  implement as implementV2,
  os as osV2,
} from 'npm:@orpc/server@2.0.0-beta.53';
import { RPCHandler as RPCHandlerV2 } from 'npm:@orpc/server@2.0.0-beta.53/fetch';
import {
  CORSHandlerPlugin,
  GetMethodCsrfProtectionHandlerPlugin,
} from 'npm:@orpc/server@2.0.0-beta.53/plugins';
import { getOpenAPIMeta, openapi, OpenAPIGenerator } from 'npm:@orpc/openapi@2.0.0-beta.53';
import { OpenAPIHandler as OpenAPIHandlerV2 } from 'npm:@orpc/openapi@2.0.0-beta.53/fetch';

const PROTOCOL_HEADER = 'x-netscript-rpc-protocol';
const CLIENT_ORIGIN = 'https://app.example.com';

function flattenHeader(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === 'string' || value === undefined ? value : value.join(', ');
}

function appendVaryToken(
  existing: string | readonly string[] | undefined,
  token: string,
): string {
  const flat = flattenHeader(existing);
  if (!flat) return token;
  const tokens = flat.split(',').map((t) => t.trim().toLowerCase());
  return tokens.includes(token.toLowerCase()) ? flat : `${flat}, ${token}`;
}

function hasVaryToken(headerValue: string | null, token: string): boolean {
  if (!headerValue) return false;
  return headerValue.split(',').some((t) => t.trim().toLowerCase() === token.toLowerCase());
}

function withProtocolHeaderAllowed(allowHeaders: readonly string[]): string[] {
  const hasHeader = allowHeaders.some((h) => h.toLowerCase() === PROTOCOL_HEADER);
  return hasHeader ? [...allowHeaders] : [...allowHeaders, 'X-NetScript-RPC-Protocol'];
}

function getErrorHttpStatus(error: unknown): number | undefined {
  if (error instanceof ORPCErrorV1 && typeof error.status === 'number') {
    return error.status;
  }
  if (error instanceof MalformedResponseError) {
    return error.response.status;
  }
  if (error instanceof ORPCErrorV2 && error.cause instanceof ResponseError) {
    return error.cause.response.status;
  }
  return undefined;
}

/**
 * v2 Protocol Guard plugin registered with `before: ['~cors']` so `CORSHandlerPlugin`
 * runs OUTSIDE it (answering `OPTIONS` 204 and emitting `Access-Control-Allow-Origin` +
 * merged `Vary` on BOTH `200` AND `426` rejections). Inside `createService`, Hono's
 * outer `withCors()` middleware preserves the same outer-CORS / inner-guard ordering.
 */
function createV2ProtocolGuardPlugin() {
  return {
    name: 'netscript-rpc-protocol-guard',
    before: ['~cors'],
    init(options: Record<string, unknown>) {
      const existing = (options.routingInterceptors as unknown[] | undefined) ?? [];
      return {
        ...options,
        routingInterceptors: [
          async (io: {
            request: { method: string; headers: Record<string, string | readonly string[] | undefined> };
            next: () => Promise<{
              matched: boolean;
              response?: { status: number; headers: Record<string, string | readonly string[] | undefined>; body: unknown };
            }>;
          }) => {
            // Defense-in-depth OPTIONS exemption (handles deployments without CORSHandlerPlugin)
            if (io.request.method === 'OPTIONS') return io.next();

            const proto = flattenHeader(io.request.headers[PROTOCOL_HEADER]);
            if (proto !== 'orpc-v2') {
              const isV1Caller = proto === undefined || proto === 'orpc-v1';
              // Emit wire-compatible ORPCError JSON for the rejected caller's protocol generation:
              // - Stale v1/headerless callers require `status: 426` (`@orpc/client@1.x` `isORPCErrorJson`)
              // - Non-v1 callers (e.g. unexpected future protocol) require omitting `status` (`@orpc/client@2.x`)
              const errorJson = isV1Caller
                ? {
                  defined: false,
                  code: 'CLIENT_UPGRADE_REQUIRED',
                  status: 426,
                  message: 'Client RPC protocol is outdated; reload or upgrade.',
                  data: { expectedProtocol: 'orpc-v2', receivedProtocol: proto ?? 'missing' },
                }
                : {
                  defined: false,
                  code: 'CLIENT_UPGRADE_REQUIRED',
                  message: 'Client RPC protocol is outdated; reload or upgrade.',
                  data: { expectedProtocol: 'orpc-v2', receivedProtocol: proto },
                };
              return {
                matched: true,
                response: {
                  status: 426,
                  headers: { vary: 'X-NetScript-RPC-Protocol' },
                  body: { json: errorJson },
                },
              };
            }

            const result = await io.next();
            if (!result.matched || !result.response) return result;
            return {
              ...result,
              response: {
                ...result.response,
                headers: {
                  ...result.response.headers,
                  vary: appendVaryToken(result.response.headers.vary, 'X-NetScript-RPC-Protocol'),
                },
              },
            };
          },
          ...existing,
        ],
      };
    },
  };
}

/**
 * Phase 0a (`0.0.10`) v1 reverse Protocol Guard plugin (`order: 0 < CORSPlugin.order = 9e6`)
 * so v1 `CORSPlugin` (or outer Hono `withCors()`) handles `OPTIONS` 204 and attaches CORS
 * headers to BOTH `200` responses AND `426` rejections of `orpc-v2` clients.
 */
function createV1ReverseProtocolGuardPlugin() {
  return {
    name: 'netscript-rpc-protocol-guard-v1',
    order: 0,
    init(options: {
      rootInterceptors?: Array<(io: {
        request: { method: string; headers: Record<string, string | readonly string[] | undefined> };
        next: () => Promise<{
          matched: boolean;
          response?: { status: number; headers: Record<string, string | readonly string[] | undefined>; body: unknown };
        }>;
      }) => Promise<unknown>>;
    }) {
      options.rootInterceptors ??= [];
      options.rootInterceptors.unshift(async (io) => {
        if (io.request.method === 'OPTIONS') return io.next();
        const proto = flattenHeader(io.request.headers[PROTOCOL_HEADER]);
        if (proto !== undefined && proto !== 'orpc-v1') {
          // Caller announced v2 (or another non-v1 protocol): emit v2 ORPCError JSON (omitting `status`)
          return {
            matched: true,
            response: {
              status: 426,
              headers: { vary: 'X-NetScript-RPC-Protocol' },
              body: {
                json: {
                  defined: false,
                  code: 'CLIENT_PROTOCOL_UNSUPPORTED',
                  message: 'Server is running oRPC v1; upgrade server or wait for rollout.',
                  data: { expectedProtocol: 'orpc-v1', receivedProtocol: proto },
                },
              },
            },
          };
        }
        const result = await io.next();
        if (!result.matched || !result.response) return result;
        result.response.headers.vary = appendVaryToken(
          result.response.headers.vary,
          'X-NetScript-RPC-Protocol',
        );
        return result;
      });
      return options;
    },
  };
}

// ===========================================================================
// PROBE B1 + N1: Mixed v1.16.6/v2 corruption, CORS-wrapped 426 rejections decoded
//                cleanly by BOTH real @orpc/client@1.16.6 and v2 beta.53 links,
//                blue-green OPTIONS preflight path, Vary on 200 & 426, and OpenAPI bridge
// ===========================================================================
Deno.test('B1 + N1: mixed v1.16.6/v2 corruption, CORS-wrapped 426 decoded by real v1/v2 links, blue-green preflight, Vary on 200 & 426, and OpenAPILink bridge', async () => {
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

  // Unguarded v2 handler (for silent-corruption baseline and naive-guard negative controls)
  const unguardedV2Handler = new RPCHandlerV2(v2Router, {
    allowMethods: (method, proc) =>
      method === 'POST' || (method === 'GET' && getOpenAPIMeta(proc)?.method === 'GET'),
    plugins: [
      new CORSHandlerPlugin({
        origin: CLIENT_ORIGIN,
        allowHeaders: withProtocolHeaderAllowed(['Authorization', 'Content-Type']),
      }),
    ],
  });
  const v2OpenApiHandler = new OpenAPIHandlerV2(v2Router);

  // 1. Reproduce silent corruption: v1.16.6 RPCLink calling unguarded v2 RPCHandler
  const unguardedV1Client = createORPCClientV1(
    new RPCLinkV1({
      url: 'http://rpc.local/api/rpc',
      fetch: async (req, init) => {
        const { response } = await unguardedV2Handler.handle(new Request(req, init), { prefix: '/api/rpc' });
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

  // 2. N1 FAILING CONTROLS (reproducing Round-2 & Round-3 review findings):
  //    2a. External bare-JSON 426 guard before standalone CORS drops ACAO on 426 AND breaks preflight!
  //    2b. Real @orpc/client@1.16.6 decodes bare JSON 426 as MALFORMED_ORPC_ERROR_RESPONSE.
  //    2c. Real @orpc/client@2.0.0-beta.53 throws MalformedResponseError on bare JSON 426.
  async function naiveBareJsonGuardBeforeCors(req: Request): Promise<Response> {
    if (req.headers.get(PROTOCOL_HEADER) !== 'orpc-v2') {
      return Response.json({ code: 'CLIENT_UPGRADE_REQUIRED' }, { status: 426 });
    }
    const { response } = await unguardedV2Handler.handle(req, { prefix: '/api/rpc' });
    return response ?? new Response('Not Found', { status: 404 });
  }
  const preflightReq = () =>
    new Request('http://rpc.local/api/rpc/getRead', {
      method: 'OPTIONS',
      headers: {
        origin: CLIENT_ORIGIN,
        'access-control-request-method': 'GET',
        'access-control-request-headers': PROTOCOL_HEADER,
      },
    });
  assertEquals((await naiveBareJsonGuardBeforeCors(preflightReq())).status, 426);

  let naiveRaw426Res: Response | undefined;
  const naiveV1Client = createORPCClientV1(
    new RPCLinkV1({
      url: 'http://rpc.local/api/rpc',
      headers: () => ({ origin: CLIENT_ORIGIN }),
      fetch: async (req, init) => {
        const res = await naiveBareJsonGuardBeforeCors(new Request(req, init));
        naiveRaw426Res = res.clone();
        return res;
      },
    }),
  ) as { getBig: () => Promise<unknown> };
  const naiveV1Err = await assertRejects(() => naiveV1Client.getBig(), ORPCErrorV1);
  assertEquals(naiveV1Err.code, 'MALFORMED_ORPC_ERROR_RESPONSE');
  assertEquals(naiveRaw426Res?.headers.get('access-control-allow-origin'), null); // Cross-origin browser blocked!

  const naiveV2Client = createORPCClientV2(
    new RPCLinkV2({
      origin: 'http://rpc.local',
      url: '/api/rpc',
      headers: () => ({ origin: CLIENT_ORIGIN, [PROTOCOL_HEADER]: 'orpc-v1' }),
      fetch: (url, init) => naiveBareJsonGuardBeforeCors(new Request(url, init)),
    }),
  ) as { getBig: () => Promise<unknown> };
  await assertRejects(() => naiveV2Client.getBig(), MalformedResponseError);

  // 3. N1 PASSING PROOF: Guard runs INSIDE CORS (`before: ['~cors']` on v2; `order: 0 < 9e6` on v1)
  //    and emits wire-compatible ORPCError JSON envelopes.
  const guardedV2Handler = new RPCHandlerV2(v2Router, {
    allowMethods: (method, proc) =>
      method === 'POST' || (method === 'GET' && getOpenAPIMeta(proc)?.method === 'GET'),
    plugins: [
      createV2ProtocolGuardPlugin() as never,
      new CORSHandlerPlugin({
        origin: CLIENT_ORIGIN,
        credentials: true,
        allowHeaders: withProtocolHeaderAllowed(['Authorization', 'Content-Type']),
      }),
    ],
  });

  const guardedV1Handler = new RPCHandlerV1(
    {
      ping: osV1.handler(() => ({ ok: true })),
      getRead: osV1.route({ method: 'GET', path: '/items/read' }).handler(() => ({ ok: true })),
    },
    {
      plugins: [
        createV1ReverseProtocolGuardPlugin() as never,
        new CORSPluginV1({
          origin: [CLIENT_ORIGIN],
          credentials: true,
          allowHeaders: withProtocolHeaderAllowed(['Authorization', 'Content-Type']),
        }),
      ],
    },
  );

  // 3a. Standalone v2 OPTIONS preflight -> 204 with ACAO + ACAH including X-NetScript-RPC-Protocol
  const v2Preflight = await guardedV2Handler.handle(preflightReq(), { prefix: '/api/rpc' });
  assertEquals(v2Preflight.matched, true);
  assertEquals(v2Preflight.response?.status, 204);
  assertEquals(v2Preflight.response?.headers.get('access-control-allow-origin'), CLIENT_ORIGIN);
  assert(
    (v2Preflight.response?.headers.get('access-control-allow-headers') ?? '')
      .toLowerCase()
      .includes(PROTOCOL_HEADER),
  );

  // 3b. Cross-origin stale v1.16.6 RPCLink (both headerless 0.0.10 default AND explicit `orpc-v1`) -> v2 handler:
  //     426 carries ACAO + ACAC + Vary(X-NetScript-RPC-Protocol, Origin), decoded cleanly as ORPCError('CLIENT_UPGRADE_REQUIRED')!
  for (const sentProto of [undefined, 'orpc-v1'] as const) {
    let captured426: Response | undefined;
    const staleV1Client = createORPCClientV1(
      new RPCLinkV1({
        url: 'http://rpc.local/api/rpc',
        headers: () => ({
          origin: CLIENT_ORIGIN,
          ...(sentProto ? { [PROTOCOL_HEADER]: sentProto } : {}),
        }),
        fetch: async (req, init) => {
          const { response } = await guardedV2Handler.handle(new Request(req, init), { prefix: '/api/rpc' });
          captured426 = response?.clone();
          return response ?? new Response('Not Found', { status: 404 });
        },
      }),
    ) as { getBig: () => Promise<unknown> };

    const err = await assertRejects(() => staleV1Client.getBig(), ORPCErrorV1);
    assertEquals(err.code, 'CLIENT_UPGRADE_REQUIRED');
    assertEquals(err.status, 426);
    assertEquals(err.defined, false);
    assertEquals(getErrorHttpStatus(err), 426);
    assertEquals(err.data, {
      expectedProtocol: 'orpc-v2',
      receivedProtocol: sentProto ?? 'missing',
    });
    assertEquals(captured426?.status, 426);
    assertEquals(captured426?.headers.get('access-control-allow-origin'), CLIENT_ORIGIN);
    assertEquals(captured426?.headers.get('access-control-allow-credentials'), 'true');
    assert(hasVaryToken(captured426?.headers.get('vary') ?? null, PROTOCOL_HEADER));
    assert(hasVaryToken(captured426?.headers.get('vary') ?? null, 'origin'));
  }

  // 3c. Cross-origin v2 beta.53 RPCLink sending unexpected protocol (`orpc-v3`) -> v2 handler:
  //     426 carries CORS headers + decoded cleanly as v2 ORPCError('CLIENT_UPGRADE_REQUIRED') with ResponseError(426)!
  {
    let captured426: Response | undefined;
    const futureV2Client = createORPCClientV2(
      new RPCLinkV2({
        origin: 'http://rpc.local',
        url: '/api/rpc',
        headers: () => ({ origin: CLIENT_ORIGIN, [PROTOCOL_HEADER]: 'orpc-v3' }),
        fetch: async (url, init) => {
          const { response } = await guardedV2Handler.handle(new Request(url, init), { prefix: '/api/rpc' });
          captured426 = response?.clone();
          return response ?? new Response('Not Found', { status: 404 });
        },
      }),
    ) as { getBig: () => Promise<unknown> };

    const err = await assertRejects(() => futureV2Client.getBig(), ORPCErrorV2);
    assertEquals(err.code, 'CLIENT_UPGRADE_REQUIRED');
    assertEquals(err.defined, false);
    assert(err.cause instanceof ResponseError);
    assertEquals(getErrorHttpStatus(err), 426);
    assertEquals(err.data, { expectedProtocol: 'orpc-v2', receivedProtocol: 'orpc-v3' });
    assertEquals(captured426?.headers.get('access-control-allow-origin'), CLIENT_ORIGIN);
    assert(hasVaryToken(captured426?.headers.get('vary') ?? null, PROTOCOL_HEADER));
    assert(hasVaryToken(captured426?.headers.get('vary') ?? null, 'origin'));
  }

  // 3d. Cross-origin v2 beta.53 RPCLink (`orpc-v2`) -> Phase 0a v1.16.6 handler (reverse guard):
  //     426 carries CORS headers + decoded cleanly as v2 ORPCError('CLIENT_PROTOCOL_UNSUPPORTED') with ResponseError(426)!
  {
    let captured426: Response | undefined;
    const v2ToV1Client = createORPCClientV2(
      new RPCLinkV2({
        origin: 'http://rpc.local',
        url: '/api/rpc',
        headers: () => ({ origin: CLIENT_ORIGIN, [PROTOCOL_HEADER]: 'orpc-v2' }),
        fetch: async (url, init) => {
          const { response } = await guardedV1Handler.handle(new Request(url, init), { prefix: '/api/rpc' });
          captured426 = response?.clone();
          return response ?? new Response('Not Found', { status: 404 });
        },
      }),
    ) as { ping: () => Promise<unknown> };

    const err = await assertRejects(() => v2ToV1Client.ping(), ORPCErrorV2);
    assertEquals(err.code, 'CLIENT_PROTOCOL_UNSUPPORTED');
    assertEquals(err.defined, false);
    assert(err.cause instanceof ResponseError);
    assertEquals(getErrorHttpStatus(err), 426);
    assertEquals(err.data, { expectedProtocol: 'orpc-v1', receivedProtocol: 'orpc-v2' });
    assertEquals(captured426?.status, 426);
    assertEquals(captured426?.headers.get('access-control-allow-origin'), CLIENT_ORIGIN);
    assertEquals(captured426?.headers.get('access-control-allow-credentials'), 'true');
    assert(hasVaryToken(captured426?.headers.get('vary') ?? null, PROTOCOL_HEADER));
    assert(hasVaryToken(captured426?.headers.get('vary') ?? null, 'origin'));
  }

  // 4. Blue-green gateway header-routing path (including cross-origin OPTIONS preflight!):
  //    Gateway routes `X-NetScript-RPC-Protocol === 'orpc-v2'` -> v2 green pool;
  //    absent (including browser OPTIONS preflights, which NEVER carry custom headers!) -> Phase 0a v1 blue pool.
  const routedPools: Array<'v1-blue' | 'v2-green'> = [];
  async function blueGreenGateway(req: Request): Promise<Response> {
    if (req.headers.get(PROTOCOL_HEADER) === 'orpc-v2') {
      routedPools.push('v2-green');
      const { response } = await guardedV2Handler.handle(req, { prefix: '/api/rpc' });
      return response ?? new Response('Not Found', { status: 404 });
    }
    routedPools.push('v1-blue');
    const { response } = await guardedV1Handler.handle(req, { prefix: '/api/rpc' });
    return response ?? new Response('Not Found', { status: 404 });
  }

  // 4a. Browser OPTIONS preflight for v2 GET carries `Access-Control-Request-Headers: x-netscript-rpc-protocol`
  //     and NO `X-NetScript-RPC-Protocol` header -> routed to Phase 0a v1 blue pool -> 204 allowing protocol header!
  const bgPreflightRes = await blueGreenGateway(preflightReq());
  assertEquals(routedPools.at(-1), 'v1-blue');
  assertEquals(bgPreflightRes.status, 204);
  assertEquals(bgPreflightRes.headers.get('access-control-allow-origin'), CLIENT_ORIGIN);
  assert(
    (bgPreflightRes.headers.get('access-control-allow-headers') ?? '')
      .toLowerCase()
      .includes(PROTOCOL_HEADER),
  );

  // 4b. Subsequent actual cross-origin v2 GET carrying `X-NetScript-RPC-Protocol: orpc-v2` -> v2 green pool -> 200!
  let capturedBg200: Response | undefined;
  const bgV2Client = createORPCClientV2(
    new RPCLinkV2({
      origin: 'http://rpc.local',
      url: '/api/rpc',
      method: () => 'GET',
      headers: () => ({ origin: CLIENT_ORIGIN, [PROTOCOL_HEADER]: 'orpc-v2' }),
      fetch: async (url, init) => {
        const res = await blueGreenGateway(new Request(url, init));
        capturedBg200 = res.clone();
        return res;
      },
    }),
  ) as { getRead: () => Promise<{ ok: boolean }> };
  assertEquals(await bgV2Client.getRead(), { ok: true });
  assertEquals(routedPools.at(-1), 'v2-green');
  assertEquals(capturedBg200?.status, 200);
  assertEquals(capturedBg200?.headers.get('access-control-allow-origin'), CLIENT_ORIGIN);
  assert(hasVaryToken(capturedBg200?.headers.get('vary') ?? null, PROTOCOL_HEADER));
  assert(hasVaryToken(capturedBg200?.headers.get('vary') ?? null, 'origin'));

  // 4c. Matched v2 client calling getBig via blue-green gateway preserves genuine BigInt 10n!
  const bgV2PostClient = createORPCClientV2(
    new RPCLinkV2({
      origin: 'http://rpc.local',
      url: '/api/rpc',
      headers: () => ({ origin: CLIENT_ORIGIN, [PROTOCOL_HEADER]: 'orpc-v2' }),
      fetch: (url, init) => blueGreenGateway(new Request(url, init)),
    }),
  ) as { getBig: () => Promise<bigint> };
  const intactBigInt = await bgV2PostClient.getBig();
  assertEquals(typeof intactBigInt, 'bigint');
  assertEquals(intactBigInt, 10n);

  // 4d. Headerless v1.16.6 client hitting blue-green gateway routes to Phase 0a v1 blue pool -> 200 + CORS + Vary!
  let capturedV1Ok: Response | undefined;
  const bgV1Client = createORPCClientV1(
    new RPCLinkV1({
      url: 'http://rpc.local/api/rpc',
      headers: () => ({ origin: CLIENT_ORIGIN }),
      fetch: async (req, init) => {
        const res = await blueGreenGateway(new Request(req, init));
        capturedV1Ok = res.clone();
        return res;
      },
    }),
  ) as { ping: () => Promise<{ ok: boolean }> };
  assertEquals(await bgV1Client.ping(), { ok: true });
  assertEquals(routedPools.at(-1), 'v1-blue');
  assertEquals(capturedV1Ok?.headers.get('access-control-allow-origin'), CLIENT_ORIGIN);
  assert(hasVaryToken(capturedV1Ok?.headers.get('vary') ?? null, PROTOCOL_HEADER));
  assert(hasVaryToken(capturedV1Ok?.headers.get('vary') ?? null, 'origin'));

  // 5. OpenAPILink v1.16.6 -> OpenAPIHandler v2 interoperability (JSON-safe payload)
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
  assertEquals(inferRpcMethodFromProcedure(router.headItems), 'GET');
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

  // 3. N3 Paired `allowGetRpc: false` server + SDK `transportPolicy: { method: () => 'POST' }`
  const postOnlyHandler = new RPCHandlerV2(router, {
    allowMethods: (method) => DEFAULT_WRITE_METHODS.has(method),
  });
  const unpairedGet = await postOnlyHandler.handle(
    new Request('http://rpc.local/api/rpc/listItems', { method: 'GET' }),
    { prefix: '/api/rpc' },
  );
  assertEquals(unpairedGet.matched, false);

  const pairedPostClient = createORPCClientV2(
    new RPCLinkV2({
      origin: 'http://rpc.local',
      url: '/api/rpc',
      method: () => 'POST',
      fetch: async (url, init) => {
        const { response } = await postOnlyHandler.handle(new Request(url, init), { prefix: '/api/rpc' });
        return response ?? new Response('Not Found', { status: 404 });
      },
    }),
  ) as { listItems: () => Promise<{ items: string[] }> };
  assertEquals(await pairedPostClient.listItems(), { items: ['a', 'b'] });
});

// ===========================================================================
// PROBE B4 + N2: All silent v2 runtime changes + v1.16.6 vs v2 interceptor proof +
//                complete upstream COMMON_ERROR_STATUS_MAP preserving 413/429 in
//                standalone handlers AND plugin resolver + unknown-code 500 fallback
// ===========================================================================
Deno.test('B4 + N2: v1.16.6 rootInterceptors vs v2 routingInterceptors, complete COMMON_ERROR_STATUS_MAP preserving 413/429 alongside 500 unknown-code fallback in handlers & plugin resolver, conflict merge, defined, middleware dedup', async () => {
  // 1. N2 v1.16.6 vs v2 interceptor execution proof (in REAL RPCHandlers, never plain `{}`!)
  let v1RootRuns = 0;
  let v1RoutingRan = false;
  const v1Handler = new RPCHandlerV1(
    { ok: osV1.handler(() => ({ ok: true })) },
    {
      plugins: [
        {
          init(options: {
            rootInterceptors?: Array<(o: { next: () => Promise<unknown> }) => Promise<unknown>>;
          }) {
            options.rootInterceptors ??= [];
            options.rootInterceptors.push((o) => {
              v1RootRuns += 1;
              return o.next();
            });
            // Pushing `routingInterceptors` on v1 is silently ignored!
            const v2Field = options as unknown as {
              routingInterceptors?: Array<(o: { next: () => Promise<unknown> }) => Promise<unknown>>;
            };
            v2Field.routingInterceptors ??= [];
            v2Field.routingInterceptors.push((o) => {
              v1RoutingRan = true;
              return o.next();
            });
            return options; // Phase 0a return-based init also verified running once on v1.16.6!
          },
        } as never,
      ],
    },
  );
  const v1Ok = await v1Handler.handle(
    new Request('http://rpc.local/api/rpc/ok', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: {} }),
    }),
    { prefix: '/api/rpc' },
  );
  assertEquals(v1Ok.response?.status, 200);
  assertEquals(v1RootRuns, 1);
  assertEquals(v1RoutingRan, false);

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
            const legacy = options as unknown as {
              rootInterceptors?: Array<(o: { next: () => Promise<unknown> }) => Promise<unknown>>;
            };
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
    new Request('http://rpc.local/api/rpc/ok', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }),
    { prefix: '/api/rpc' },
  );
  assertEquals(v2Ok.response?.status, 200);
  assertEquals(v2RootRan, false);
  assertEquals(v2RoutingRan, true);

  // 2. N2 Failing control: raw v2 RPCHandler returns HTTP 400 for unmapped code!
  const rawUnmappedRes = await v2RawHandler.handle(
    new Request('http://rpc.local/api/rpc/unmappedErr', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }),
    { prefix: '/api/rpc' },
  );
  assertEquals(rawUnmappedRes.response?.status, 400);

  // 3. N2 Passing proof: seed from COMPLETE upstream `COMMON_ERROR_STATUS_MAP` (23 built-in codes,
  //    including PAYLOAD_TOO_LARGE: 413 and TOO_MANY_REQUESTS: 429) + NetScript common codes + contract
  //    codes BEFORE wrapping in `createDefault500ErrorStatusMap` Proxy!
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
    // Always preserve every built-in upstream oRPC error status before falling back to 500 for unknown codes,
    // and never intercept `Object.prototype` properties (`toString`, `valueOf`, `constructor`).
    const seeded: Record<string, number> = { ...COMMON_ERROR_STATUS_MAP, ...base };
    return new Proxy(seeded, {
      get(target, prop, receiver) {
        if (typeof prop === 'string' && !Object.hasOwn(target, prop) && !(prop in Object.prototype)) {
          return 500;
        }
        return Reflect.get(target, prop, receiver);
      },
      getOwnPropertyDescriptor(target, prop) {
        if (typeof prop === 'string' && !Object.hasOwn(target, prop) && !(prop in Object.prototype)) {
          return { configurable: true, enumerable: true, value: 500, writable: false };
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });
  }

  const mergedStatuses = mergeErrorStatusMaps(
    COMMON_ERROR_STATUS_MAP,
    { VALIDATION_ERROR: 422, RATE_LIMITED: 429 },
    { ORDER_LOCKED: 409 },
  );
  const standaloneStatusMap = createDefault500ErrorStatusMap(mergedStatuses);

  // Guard `Object.prototype` properties so `toString` / `valueOf` / `constructor` & `String(proxy)` work cleanly!
  assertEquals(typeof standaloneStatusMap.toString, 'function');
  assertEquals(typeof standaloneStatusMap.valueOf, 'function');
  assertEquals(standaloneStatusMap.constructor, Object);
  assertEquals(String(standaloneStatusMap), '[object Object]');

  const standaloneRouter = {
    unmappedErr: osV2.handler(() => {
      throw new ORPCErrorV2('CUSTOM_INFRA_FAILURE', { message: 'db down' });
    }),
    orderLocked: osV2.handler(() => {
      throw new ORPCErrorV2('ORDER_LOCKED', { message: 'locked' });
    }),
    payloadTooLarge: osV2.handler(() => {
      throw new ORPCErrorV2('PAYLOAD_TOO_LARGE', { message: 'body exceeds limit' });
    }),
    tooManyRequests: osV2.handler(() => {
      throw new ORPCErrorV2('TOO_MANY_REQUESTS', { message: 'slow down' });
    }),
  };

  // ZERO ErrorHandlingPlugin installed — works for standalone createRPCHandler & createOpenAPIHandler!
  const standaloneRpc = new RPCHandlerV2(standaloneRouter, { errorStatusMap: standaloneStatusMap });
  const standaloneOa = new OpenAPIHandlerV2(standaloneRouter, { errorStatusMap: standaloneStatusMap });

  // Built-in PAYLOAD_TOO_LARGE (413) & TOO_MANY_REQUESTS (429) survive unchanged in BOTH handlers!
  for (const [proc, expectedStatus, expectedCode] of [
    ['payloadTooLarge', 413, 'PAYLOAD_TOO_LARGE'],
    ['tooManyRequests', 429, 'TOO_MANY_REQUESTS'],
    ['orderLocked', 409, 'ORDER_LOCKED'],
    ['unmappedErr', 500, 'CUSTOM_INFRA_FAILURE'],
  ] as const) {
    const rpcRes = await standaloneRpc.handle(
      new Request(`http://rpc.local/api/rpc/${proc}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
      { prefix: '/api/rpc' },
    );
    assertEquals(rpcRes.response?.status, expectedStatus);
    const rpcBody = await rpcRes.response?.json();
    assertEquals(rpcBody.json.code, expectedCode);

    const oaRes = await standaloneOa.handle(
      new Request(`http://rpc.local/api/${proc}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
      { prefix: '/api' },
    );
    assertEquals(oaRes.response?.status, expectedStatus);
    const oaBody = await oaRes.response?.json();
    assertEquals(oaBody.code, expectedCode);
  }

  // 4. N2 `error.status` absence + `resolveErrorHttpStatus` for TracingPlugin / LoggingPlugin / ErrorHandlingPlugin:
  //    Checks explicit `errorStatusMap`, then upstream `COMMON_ERROR_STATUS_MAP`, before defaulting to 500!
  function resolveErrorHttpStatus(
    error: unknown,
    errorStatusMap: Readonly<Record<string, number>> = COMMON_ERROR_STATUS_MAP,
  ): number {
    if (error && typeof error === 'object') {
      const e = error as { readonly code?: unknown; readonly status?: unknown };
      if (typeof e.status === 'number') return e.status;
      if (typeof e.code === 'string') {
        if (Object.hasOwn(errorStatusMap, e.code)) return errorStatusMap[e.code];
        if (Object.hasOwn(COMMON_ERROR_STATUS_MAP, e.code)) {
          return COMMON_ERROR_STATUS_MAP[e.code as keyof typeof COMMON_ERROR_STATUS_MAP];
        }
      }
    }
    return 500;
  }

  const lockedErrV2 = new ORPCErrorV2('ORDER_LOCKED', { message: 'locked' });
  const unmappedErrV2 = new ORPCErrorV2('CUSTOM_INFRA_FAILURE', { message: 'db down' });
  const tooLargeErrV2 = new ORPCErrorV2('PAYLOAD_TOO_LARGE', { message: 'too large' });
  const tooManyErrV2 = new ORPCErrorV2('TOO_MANY_REQUESTS', { message: 'rate limited' });

  assertEquals('status' in lockedErrV2, false);
  assertEquals(resolveErrorHttpStatus(lockedErrV2, mergedStatuses), 409);
  assertEquals(resolveErrorHttpStatus(unmappedErrV2, mergedStatuses), 500);
  // Both built-in codes survive unchanged in plugin resolver with mergedStatuses AND even an empty custom map!
  assertEquals(resolveErrorHttpStatus(tooLargeErrV2, mergedStatuses), 413);
  assertEquals(resolveErrorHttpStatus(tooManyErrV2, mergedStatuses), 429);
  assertEquals(resolveErrorHttpStatus(tooLargeErrV2, {}), 413);
  assertEquals(resolveErrorHttpStatus(tooManyErrV2, {}), 429);

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
// PROBE B6 + N4: v1.16.6 `.route()` retention proof (vs `.meta(routeMeta)` failing
//                to populate native route & inferring POST!) + v1.16.6 Phase 0b
//                `accessMeta`/`policyMeta`/`defineContractErrors` + v2 server-free
//                `routeMeta`/`accessMeta`/`policyMeta` via `@orpc/contract` `defineMeta`
// ===========================================================================
Deno.test('B6 + N4: v1.16.6 retains .route() until 0.1.0 (since .meta(routeMeta) infers POST on 1.16.6); v2 server-free routeMeta/accessMeta/policyMeta preserve .meta keys & OpenAPIGenerator', async () => {
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

  // 1. N4 v1.16.6 FAILING CONTROL (reproducing Sol 6.2 Round-3 finding):
  //    On `@orpc/contract@1.16.6`, `.meta({ '~openapi': { method: 'GET', path: '/orders/{id}' } })`
  //    leaves native `~orpc.route` empty and causes SDK inference to send POST instead of GET!
  const v1BrokenRouteMetaContract = {
    getOrder: ocV1
      .meta({ '~openapi': { method: 'GET', path: '/orders/{id}' } } as Record<string, unknown>)
      .input(z.object({ id: z.string() }))
      .output(z.object({ id: z.string() })),
  };
  assertEquals(v1BrokenRouteMetaContract.getOrder['~orpc'].route.method, undefined);
  assertEquals(inferRPCMethodFromContractRouter(v1BrokenRouteMetaContract)({}, ['getOrder']), 'POST');

  // 2. N4 Phase 0b (`0.0.11`) v1.16.6 PASSING PROOF:
  //    v1 callers retain `.route(...)` until `0.1.0` cut-over while safely adopting additive
  //    `accessMeta`, `policyMeta`, and `defineContractErrors` shims on `1.16.6`!
  const accessMetaV1 = (access: AccessPolicy) => ({ access });
  const policyMetaV1 = (policy: CachePolicy) => ({ policy });
  const defineContractErrorsV1 = <
    T extends Record<string, { readonly status: number; readonly message?: string; readonly data?: unknown }>,
  >(defs: T) => ({
    definitions: defs,
    statusMap: Object.fromEntries(Object.entries(defs).map(([k, v]) => [k, v.status])) as Record<keyof T, number>,
  });

  const orderErrorsV1 = defineContractErrorsV1({
    ORDER_LOCKED: { status: 409, message: 'Order is locked', data: z.object({ orderId: z.string() }) },
  });
  const v1BaseContract = ocV1.$meta<{ access?: AccessPolicy; policy?: CachePolicy }>({});
  const v1Phase0bContract = {
    getOrder: v1BaseContract
      .route({ method: 'GET', path: '/orders/{id}', summary: 'Fetch one order' })
      .meta(accessMetaV1({ authentication: 'required', authorization: { scopes: ['orders:read'] } }))
      .meta(policyMetaV1({ cache: 'force-cache' }))
      .errors(orderErrorsV1.definitions)
      .input(z.object({ id: z.string() }))
      .output(z.object({ id: z.string() })),
  };
  assertEquals(v1Phase0bContract.getOrder['~orpc'].route.method, 'GET');
  assertEquals(inferRPCMethodFromContractRouter(v1Phase0bContract)({}, ['getOrder']), 'GET');
  assertEquals(v1Phase0bContract.getOrder['~orpc'].meta.access, {
    authentication: 'required',
    authorization: { scopes: ['orders:read'] },
  });
  assertEquals(v1Phase0bContract.getOrder['~orpc'].meta.policy, { cache: 'force-cache' });
  assertEquals(orderErrorsV1.statusMap.ORDER_LOCKED, 409);

  // 3. N4 Phase 2 (`0.1.0`) v2 PASSING PROOF:
  //    Server-free `routeMeta` + `accessMeta` + `policyMeta` via `@orpc/contract` `defineMeta`
  //    (zero `@orpc/server` or `@orpc/openapi/extensions/route` import needed in `@netscript/contracts`!).
  const [routeMeta, getRouteMeta] = defineMeta<'~openapi', NetScriptRouteMeta>(
    '~openapi',
    (incoming, current) => ({
      ...current,
      ...incoming,
      ...(current?.tags && incoming.tags ? { tags: [...current.tags, ...incoming.tags] } : {}),
    }),
  );
  const [accessMeta, getAccessMeta] = defineMeta<'access', AccessPolicy>('access', (incoming) => incoming);
  const [policyMeta, getPolicyMeta] = defineMeta<'policy', CachePolicy>('policy', (incoming) => incoming);

  const contractV2 = {
    getOrder: ocV2
      .meta(routeMeta({ method: 'GET', path: '/orders/{id}', summary: 'Fetch one order' }))
      .meta(accessMeta({ authentication: 'required', authorization: { scopes: ['orders:read'] } }))
      .meta(policyMeta({ cache: 'force-cache' }))
      .input(z.object({ id: z.string() }))
      .output(z.object({ id: z.string() })),
  };

  assertEquals(contractV2.getOrder['~orpc'].meta.access, {
    authentication: 'required',
    authorization: { scopes: ['orders:read'] },
  });
  assertEquals(getAccessMeta(contractV2.getOrder), contractV2.getOrder['~orpc'].meta.access);
  assertEquals(contractV2.getOrder['~orpc'].meta.policy, { cache: 'force-cache' });
  assertEquals(getPolicyMeta(contractV2.getOrder), contractV2.getOrder['~orpc'].meta.policy);

  const oaMeta = getOpenAPIMeta(contractV2.getOrder);
  assertEquals(oaMeta?.method, 'GET');
  assertEquals(oaMeta?.path, '/orders/{id}');
  assertEquals(getRouteMeta(contractV2.getOrder)?.summary, 'Fetch one order');

  const spec = await new OpenAPIGenerator().generate(contractV2, {
    base: { info: { title: 'Orders', version: '1.0.0' } },
  });
  assertEquals(
    (spec.paths?.['/orders/{id}'] as { get?: { summary?: string } } | undefined)?.get?.summary,
    'Fetch one order',
  );

  const impl = implementV2(contractV2);
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
