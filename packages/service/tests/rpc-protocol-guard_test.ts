import { assert, assertEquals, assertFalse, assertNotEquals } from '@std/assert';
import { os } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { createOpenAPIHandler, createRPCHandler, createService } from '../mod.ts';
import {
  ProtocolGuardPluginV1,
  RPC_PROTOCOL_HEADER,
  RPC_PROTOCOL_V1,
} from '../src/primitives/rpc-protocol-guard.ts';

function test(name: string, fn: Deno.TestDefinition['fn']): void {
  Deno.test({ name, fn, sanitizeOps: true, sanitizeResources: true, sanitizeExit: true });
}

const allowedOrigin = 'https://app.example';
const hostileOrigin = 'https://hostile.example';

const router = os.router({
  ping: os.handler(() => ({ ok: true })),
  status: os.route({ method: 'GET', path: '/status' }).handler(() => ({ ok: true })),
});

function varyTokens(response: Response): string[] {
  return (response.headers.get('vary') ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .sort();
}

test('ProtocolGuardPluginV1 metadata and standalone createRPCHandler 200/426/OPTIONS behavior', async () => {
  const plugin = new ProtocolGuardPluginV1();
  assertEquals(plugin.name, 'netscript-rpc-protocol-guard-v1');
  assertEquals(plugin.order, 0);
  const manualOptions = {};
  assertEquals(plugin.init(manualOptions), manualOptions);

  const handler = createRPCHandler(router);

  // 1. OPTIONS preflight is never rejected and echoes requested protocol header under v1 CORSPlugin.
  const preflight = await handler.handle(
    new Request('http://localhost/api/rpc/ping', {
      method: 'OPTIONS',
      headers: {
        origin: allowedOrigin,
        'access-control-request-method': 'POST',
        'access-control-request-headers': `${RPC_PROTOCOL_HEADER}, Content-Type`,
      },
    }),
    { prefix: '/api/rpc' },
  );
  assert(preflight.matched && preflight.response);
  assertEquals(preflight.response.status, 204);
  assertEquals(preflight.response.headers.get('access-control-allow-origin'), allowedOrigin);
  assert(
    preflight.response.headers
      .get('access-control-allow-headers')
      ?.toLowerCase()
      .includes(RPC_PROTOCOL_HEADER.toLowerCase()),
  );
  await preflight.response.arrayBuffer();

  // 2. Headerless and explicit orpc-v1 requests succeed with Vary: X-NetScript-RPC-Protocol + Origin.
  for (const protocolHeader of [undefined, RPC_PROTOCOL_V1]) {
    const headers = new Headers({
      origin: allowedOrigin,
      'content-type': 'application/json',
    });
    if (protocolHeader !== undefined) {
      headers.set(RPC_PROTOCOL_HEADER, protocolHeader);
    }
    const ok = await handler.handle(
      new Request('http://localhost/api/rpc/ping', {
        method: 'POST',
        headers,
        body: '{}',
      }),
      { prefix: '/api/rpc' },
    );
    assert(ok.matched && ok.response);
    assertEquals(ok.response.status, 200);
    assertEquals(ok.response.headers.get('access-control-allow-origin'), allowedOrigin);
    assertEquals(varyTokens(ok.response), ['origin', 'x-netscript-rpc-protocol']);
    assertEquals(await ok.response.json(), { json: { ok: true } });
  }

  // 3. Mismatched protocol headers (orpc-v2, orpc-v3, blank) fail closed with CORS-wrapped 426
  //    and a v2-compatible ORPCError JSON envelope omitting "status".
  for (const receivedProtocol of ['orpc-v2', 'orpc-v3', '']) {
    const rejected = await handler.handle(
      new Request('http://localhost/api/rpc/ping', {
        method: 'POST',
        headers: {
          origin: allowedOrigin,
          'content-type': 'application/json',
          [RPC_PROTOCOL_HEADER]: receivedProtocol,
        },
        body: '{}',
      }),
      { prefix: '/api/rpc' },
    );
    assert(rejected.matched && rejected.response);
    assertEquals(rejected.response.status, 426);
    assertEquals(rejected.response.headers.get('access-control-allow-origin'), allowedOrigin);
    assertEquals(varyTokens(rejected.response), ['origin', 'x-netscript-rpc-protocol']);
    assert(rejected.response.headers.get('content-type')?.includes('application/json'));

    const payload = await rejected.response.json() as {
      json: Record<string, unknown>;
    };
    assertEquals(payload.json.defined, false);
    assertEquals(payload.json.code, 'CLIENT_PROTOCOL_UNSUPPORTED');
    assertFalse('status' in payload.json, 'v2 ORPCError wire envelope must omit status');
    assertEquals(payload.json.data, {
      expectedProtocol: RPC_PROTOCOL_V1,
      receivedProtocol,
    });
  }
});

test('ProtocolGuardPluginV1 exempts OPTIONS as defense-in-depth even without CORSPlugin', async () => {
  const bareHandler = new RPCHandler(router, {
    plugins: [new ProtocolGuardPluginV1()],
  });
  const optionsResult = await bareHandler.handle(
    new Request('http://localhost/api/rpc/ping', {
      method: 'OPTIONS',
      headers: {
        [RPC_PROTOCOL_HEADER]: 'orpc-v2',
      },
    }),
    { prefix: '/api/rpc' },
  );
  // Without CORSPlugin, OPTIONS bypasses the protocol guard rather than returning 426.
  assertNotEquals(optionsResult.response?.status, 426);
  await optionsResult.response?.arrayBuffer();

  // Same bare handler still rejects POST with mismatched protocol header as 426.
  const postResult = await bareHandler.handle(
    new Request('http://localhost/api/rpc/ping', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [RPC_PROTOCOL_HEADER]: 'orpc-v2',
      },
      body: '{}',
    }),
    { prefix: '/api/rpc' },
  );
  assert(postResult.matched && postResult.response);
  assertEquals(postResult.response.status, 426);
  await postResult.response.arrayBuffer();
});

test('createOpenAPIHandler does not mount ProtocolGuardPluginV1', async () => {
  const openApi = createOpenAPIHandler(router);
  const result = await openApi.handle(
    new Request('http://localhost/api/status', {
      headers: {
        origin: allowedOrigin,
        [RPC_PROTOCOL_HEADER]: 'orpc-v2',
      },
    }),
    { prefix: '/api' },
  );
  assert(result.matched && result.response);
  assertEquals(result.response.status, 200);
  assertEquals(varyTokens(result.response), ['origin']);
  assertEquals(await result.response.json(), { ok: true });
});

test('withCors scopes X-NetScript-RPC-Protocol preflight allowHeaders strictly to mounted RPC paths and wraps 426 authoritatively', async () => {
  const app = createService(router, { name: 'protocol-cors-scoped' })
    .withCors({
      origin: [allowedOrigin],
      credentials: true,
      exposeHeaders: ['X-Trace'],
      allowMethods: ['GET', 'POST'],
      allowHeaders: ['Authorization', 'Content-Type'],
    })
    .withHealth()
    .withRPC({
      rpcPath: '/custom/rpc',
      rpcAliases: ['/legacy/rpc'],
    })
    .route('get', '/raw', (c) => c.text('raw'))
    .route('get', '/custom/rpc-other/ping', (c) => c.text('sibling'))
    .build();

  // Mounted rpcPath & rpcAliases preflights append X-NetScript-RPC-Protocol.
  for (const rpcPreflightPath of ['/custom/rpc/ping', '/legacy/rpc/ping']) {
    const res = await app.request(rpcPreflightPath, {
      method: 'OPTIONS',
      headers: {
        origin: allowedOrigin,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'x-netscript-rpc-protocol, content-type',
      },
    });
    assertEquals(res.status, 204);
    assertEquals(res.headers.get('access-control-allow-origin'), allowedOrigin);
    assertEquals(
      res.headers.get('access-control-allow-headers'),
      'Authorization,Content-Type,X-NetScript-RPC-Protocol',
    );
    await res.arrayBuffer();
  }

  // Non-RPC routes (including prefix sibling /custom/rpc-other/ping and unmounted /api/rpc/ping)
  // keep explicit allowHeaders completely untouched.
  for (
    const nonRpcPath of [
      '/custom/rpc-other/ping',
      '/api/rpc/ping',
      '/api/status',
      '/raw',
      '/health',
    ]
  ) {
    const res = await app.request(nonRpcPath, {
      method: 'OPTIONS',
      headers: {
        origin: allowedOrigin,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'x-netscript-rpc-protocol, content-type',
      },
    });
    assertEquals(res.status, 204);
    assertEquals(res.headers.get('access-control-allow-headers'), 'Authorization,Content-Type');
    await res.arrayBuffer();
  }

  // Allowed origin hitting RPC with orpc-v2 receives authoritative CORS headers + merged Vary + 426 JSON.
  const allowed426 = await app.request('/custom/rpc/ping', {
    method: 'POST',
    headers: {
      origin: allowedOrigin,
      'content-type': 'application/json',
      [RPC_PROTOCOL_HEADER]: 'orpc-v2',
    },
    body: '{}',
  });
  assertEquals(allowed426.status, 426);
  assertEquals(allowed426.headers.get('access-control-allow-origin'), allowedOrigin);
  assertEquals(allowed426.headers.get('access-control-allow-credentials'), 'true');
  assertEquals(allowed426.headers.get('access-control-expose-headers'), 'X-Trace');
  assertEquals(varyTokens(allowed426), ['origin', 'x-netscript-rpc-protocol']);
  const body = await allowed426.json() as { json: Record<string, unknown> };
  assertEquals(body.json.code, 'CLIENT_PROTOCOL_UNSUPPORTED');
  assertFalse('status' in body.json);

  // Disallowed origin hitting RPC with orpc-v2 gets no ACAO (native withCors strips oRPC reflection).
  const hostile426 = await app.request('/legacy/rpc/ping', {
    method: 'POST',
    headers: {
      origin: hostileOrigin,
      'content-type': 'application/json',
      [RPC_PROTOCOL_HEADER]: 'orpc-v2',
    },
    body: '{}',
  });
  assertEquals(hostile426.status, 426);
  assertEquals(hostile426.headers.get('access-control-allow-origin'), null);
  assertEquals(varyTokens(hostile426), ['origin', 'x-netscript-rpc-protocol']);
  await hostile426.arrayBuffer();

  // OpenAPI route under same service is untouched by ProtocolGuardPluginV1.
  const openApiRes = await app.request('/api/status', {
    headers: {
      origin: allowedOrigin,
      [RPC_PROTOCOL_HEADER]: 'orpc-v2',
    },
  });
  assertEquals(openApiRes.status, 200);
  assertEquals(varyTokens(openApiRes), ['origin']);
  assertEquals(await openApiRes.json(), { ok: true });
});

test('withCors deduplicates X-NetScript-RPC-Protocol case-insensitively and leaves non-RPC services untouched', async () => {
  const dedupeApp = createService(router, { name: 'protocol-cors-dedupe' })
    .withCors({
      origin: [allowedOrigin],
      allowHeaders: ['Authorization', 'x-netscript-rpc-protocol'],
    })
    .withRPC()
    .build();

  const deduped = await dedupeApp.request('/api/rpc/ping', {
    method: 'OPTIONS',
    headers: { origin: allowedOrigin, 'access-control-request-method': 'POST' },
  });
  assertEquals(deduped.status, 204);
  assertEquals(
    deduped.headers.get('access-control-allow-headers'),
    'Authorization,x-netscript-rpc-protocol',
  );
  await deduped.arrayBuffer();

  // Service without .withRPC() never mutates explicit allowHeaders even for /api/rpc/* paths.
  const nonRpcService = createService(router, { name: 'non-rpc-cors' })
    .withCors({
      origin: [allowedOrigin],
      allowHeaders: ['Authorization', 'Content-Type'],
    })
    .withHealth()
    .build();

  const nonRpcPreflight = await nonRpcService.request('/api/rpc/ping', {
    method: 'OPTIONS',
    headers: { origin: allowedOrigin, 'access-control-request-method': 'POST' },
  });
  assertEquals(nonRpcPreflight.status, 204);
  assertEquals(
    nonRpcPreflight.headers.get('access-control-allow-headers'),
    'Authorization,Content-Type',
  );
  await nonRpcPreflight.arrayBuffer();
});

test('overlapping OpenAPI and raw routes under the RPC prefix preserve fallthrough and untouched preflight allowHeaders', async () => {
  const overlappingRouter = os.router({
    ping: os.handler(() => ({ ok: true })),
    restUnderRpcPrefix: os
      .route({ method: 'GET', path: '/rpc/rest-only' })
      .handler(() => ({ source: 'openapi' })),
  });

  const app = createService(overlappingRouter, { name: 'rpc-prefix-overlap' })
    .withCors({
      origin: [allowedOrigin],
      allowHeaders: ['Authorization'],
    })
    .withRPC()
    .route('get', '/api/rpc/raw-only', (c) => c.json({ source: 'raw' }))
    .build();

  // Overlapping OpenAPI and raw routes under /api/rpc/* keep 200 fallthrough even with orpc-v2
  // and never gain X-NetScript-RPC-Protocol on preflight allowHeaders or Vary.
  for (
    const [path, expectedSource] of [
      ['/api/rpc/rest-only', 'openapi'],
      ['/api/rpc/raw-only', 'raw'],
    ] as const
  ) {
    const preflight = await app.request(path, {
      method: 'OPTIONS',
      headers: {
        origin: allowedOrigin,
        'access-control-request-method': 'GET',
      },
    });
    assertEquals(preflight.status, 204);
    assertEquals(preflight.headers.get('access-control-allow-headers'), 'Authorization');
    await preflight.arrayBuffer();

    const response = await app.request(path, {
      method: 'GET',
      headers: {
        origin: allowedOrigin,
        [RPC_PROTOCOL_HEADER]: 'orpc-v2',
      },
    });
    assertEquals(response.status, 200);
    assertEquals(varyTokens(response), ['origin']);
    assertEquals(await response.json(), { source: expectedSource });
  }

  // Real RPC procedure under the same prefix still enforces 426 and RPC preflight allowHeaders.
  const rpcPreflight = await app.request('/api/rpc/ping', {
    method: 'OPTIONS',
    headers: { origin: allowedOrigin, 'access-control-request-method': 'POST' },
  });
  assertEquals(rpcPreflight.status, 204);
  assertEquals(
    rpcPreflight.headers.get('access-control-allow-headers'),
    'Authorization,X-NetScript-RPC-Protocol',
  );
  await rpcPreflight.arrayBuffer();

  const rpcRejected = await app.request('/api/rpc/ping', {
    method: 'POST',
    headers: {
      origin: allowedOrigin,
      'content-type': 'application/json',
      [RPC_PROTOCOL_HEADER]: 'orpc-v2',
    },
    body: '{}',
  });
  assertEquals(rpcRejected.status, 426);
  assertEquals(varyTokens(rpcRejected), ['origin', 'x-netscript-rpc-protocol']);
  await rpcRejected.arrayBuffer();
});

test('mutating caller rpcAliases after withRPC/build does not move preflight allowance', async () => {
  const callerAliases = ['/legacy/rpc'];
  const app = createService(router, { name: 'alias-snapshot' })
    .withCors({
      origin: [allowedOrigin],
      allowHeaders: ['Authorization'],
    })
    .withRPC({ rpcAliases: callerAliases })
    .build();

  // Mutate the caller-owned array after build().
  callerAliases[0] = '/new/rpc';

  const mountedPreflight = await app.request('/legacy/rpc/ping', {
    method: 'OPTIONS',
    headers: { origin: allowedOrigin, 'access-control-request-method': 'POST' },
  });
  assertEquals(mountedPreflight.status, 204);
  assertEquals(
    mountedPreflight.headers.get('access-control-allow-headers'),
    'Authorization,X-NetScript-RPC-Protocol',
  );
  await mountedPreflight.arrayBuffer();

  const unmountedPreflight = await app.request('/new/rpc/ping', {
    method: 'OPTIONS',
    headers: { origin: allowedOrigin, 'access-control-request-method': 'POST' },
  });
  assertEquals(unmountedPreflight.status, 204);
  assertEquals(unmountedPreflight.headers.get('access-control-allow-headers'), 'Authorization');
  await unmountedPreflight.arrayBuffer();

  const mountedPost = await app.request('/legacy/rpc/ping', {
    method: 'POST',
    headers: { origin: allowedOrigin, 'content-type': 'application/json' },
    body: '{}',
  });
  assertEquals(mountedPost.status, 200);
  await mountedPost.arrayBuffer();

  const unmountedPost = await app.request('/new/rpc/ping', {
    method: 'POST',
    headers: { origin: allowedOrigin, 'content-type': 'application/json' },
    body: '{}',
  });
  assertEquals(unmountedPost.status, 404);
  await unmountedPost.arrayBuffer();
});

test('ProtocolGuardPluginV1 rejects Unicode whitespace around protocol tokens and preserves exact rejected value', async () => {
  const handler = createRPCHandler(router);

  // Standard ASCII HTTP OWS (SP/HTAB) around orpc-v1 is normalized by Fetch/HTTP and accepted.
  const asciiOws = await handler.handle(
    new Request('http://localhost/api/rpc/ping', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [RPC_PROTOCOL_HEADER]: ' \torpc-v1\t ',
      },
      body: '{}',
    }),
    { prefix: '/api/rpc' },
  );
  assert(asciiOws.matched && asciiOws.response);
  assertEquals(asciiOws.response.status, 200);
  await asciiOws.response.arrayBuffer();

  // Non-breaking space (U+00A0) is NOT HTTP OWS: must reject with 426 and preserve exact value.
  for (const invalidToken of ['\u00a0orpc-v1\u00a0', '\u00a0orpc-v2\u00a0']) {
    const rejected = await handler.handle(
      new Request('http://localhost/api/rpc/ping', {
        method: 'POST',
        headers: {
          origin: allowedOrigin,
          'content-type': 'application/json',
          [RPC_PROTOCOL_HEADER]: invalidToken,
        },
        body: '{}',
      }),
      { prefix: '/api/rpc' },
    );
    assert(rejected.matched && rejected.response);
    assertEquals(rejected.response.status, 426);
    const payload = await rejected.response.json() as {
      json: { code: string; data: { expectedProtocol: string; receivedProtocol: string } };
    };
    assertEquals(payload.json.code, 'CLIENT_PROTOCOL_UNSUPPORTED');
    assertEquals(payload.json.data.expectedProtocol, RPC_PROTOCOL_V1);
    assertEquals(payload.json.data.receivedProtocol, invalidToken);
  }
});
