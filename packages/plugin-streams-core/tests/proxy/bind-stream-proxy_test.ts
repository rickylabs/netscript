import { assert, assertEquals, assertFalse, assertStringIncludes, assertThrows } from '@std/assert';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { defineStreamEndpoint } from '@netscript/contracts/streams';
import {
  type AuthenticatorPort,
  createContractAuthorizer,
  createService,
  type StreamProxyMountContext,
} from '@netscript/service';
import { createCompositeAuthenticator } from '@netscript/service/auth';
import { DurableStreamTestServer } from 'npm:@durable-streams/server@0.3.9';
import { z } from 'zod';
import { bindStreamProxy } from '../../proxy.ts';
import {
  createControlledUpstream,
  flushMicrotasks,
  makeStateChange,
  readOneChunkText,
  sseControlBlock,
  sseDataBlock,
  stopDurableStreamTestServerCleanly,
} from './_test_helpers.ts';

const projectFeedEndpoint = defineStreamEndpoint({
  id: 'projects.feed',
  path: '/api/streams/projects/{projectId}',
  params: z.object({
    projectId: z.string().min(3).transform((v) => v.toUpperCase()),
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    tag: z.union([z.string(), z.array(z.string())]).optional(),
  }),
  clientAuth: 'bearer-or-cookie',
  access: {
    authentication: 'required',
    authorization: { scopes: ['projects:read'] },
  },
});

const bearerOnlyEndpoint = defineStreamEndpoint({
  id: 'projects.bearer_only',
  path: '/api/streams/bearer/{id}',
  params: z.object({ id: z.string().min(1) }),
  clientAuth: 'bearer',
  access: { authentication: 'required' },
});

const sampleApiContract = {
  healthCheck: baseContract
    .route({ method: 'GET', path: '/items' })
    .meta({ access: { authentication: 'required', authorization: { scopes: ['items:read'] } } })
    .output(SuccessSchema),
};

Deno.test('bindStreamProxy: validates params/query transforms, enforces endpoint.clientAuth, and fails fast on invalid inputs', async () => {
  const upstream = createControlledUpstream();
  let authorizeCalls = 0;
  let observedParams: { readonly projectId: string } | undefined;
  let observedQuery: { readonly limit?: number; readonly tag?: string | string[] } | undefined;
  let resolvedPath = '';

  const mount = bindStreamProxy(projectFeedEndpoint, {
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    recheckEveryMs: null,
    allowedOrigins: ['https://app.example.test'],
    upstreamAuth: () => ({ authorization: 'Bearer UPSTREAM_ONLY' }),
    authorize: ({ params, query }) => {
      authorizeCalls += 1;
      observedParams = params;
      observedQuery = query;
      return { allow: true, grant: { projectId: params.projectId } };
    },
    recheck: () => ({ allow: true }),
    resolvePath: ({ grant }) => {
      resolvedPath = `/projects/${grant.projectId}/events`;
      return resolvedPath;
    },
  });

  assertEquals(mount.endpoint, projectFeedEndpoint);
  assertEquals(mount.guardConfig?.allowedOrigins, ['https://app.example.test']);

  const makeCtx = (
    params: Readonly<Record<string, string>>,
    credentialMode: 'bearer' | 'cookie' = 'bearer',
  ): StreamProxyMountContext => ({
    params,
    credentialMode,
    shutdownSignal: new AbortController().signal,
  });

  // 1. Invalid params (< 3 chars) -> 400 before authorize
  const badParams = await mount.handle(
    new Request('https://api.example.test/api/streams/projects/ab?offset=-1', {
      headers: { authorization: 'Bearer tok' },
    }),
    makeCtx({ projectId: 'ab' }),
  );
  assertEquals(badParams.status, 400);
  assertEquals((await badParams.json()).reason, 'invalid_stream_params');
  assertEquals(authorizeCalls, 0);

  // 2. Invalid query (limit > 100) -> 400 before authorize
  const badQuery = await mount.handle(
    new Request('https://api.example.test/api/streams/projects/proj-1?limit=999&offset=-1', {
      headers: { authorization: 'Bearer tok' },
    }),
    makeCtx({ projectId: 'proj-1' }),
  );
  assertEquals(badQuery.status, 400);
  assertEquals((await badQuery.json()).reason, 'invalid_stream_query');
  assertEquals(authorizeCalls, 0);

  // 3. Valid params + coerced query + repeated query key + protocol ?offset=&live=sse stripped from app query
  const okRes = await mount.handle(
    new Request(
      'https://api.example.test/api/streams/projects/proj-1?limit=25&tag=a&tag=b&offset=-1&live=sse',
      { headers: { authorization: 'Bearer tok' } },
    ),
    makeCtx({ projectId: 'proj-1' }),
  );
  assertEquals(okRes.status, 200);
  assertEquals(observedParams, { projectId: 'PROJ-1' });
  assertEquals(observedQuery, { limit: 25, tag: ['a', 'b'] });
  assertEquals(resolvedPath, '/projects/PROJ-1/events');

  upstream.readers[0]!.push(
    sseDataBlock(makeStateChange('k1', { ok: true })) + sseControlBlock({ streamNextOffset: 'o1' }),
  );
  const reader = okRes.body!.getReader();
  const chunk = await readOneChunkText(reader);
  assertFalse(chunk.done);
  assertStringIncludes(chunk.text, 'o1');
  await reader.cancel('done');
  reader.releaseLock();
  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);

  // 4. endpoint.clientAuth: 'bearer' is enforced even when invoked standalone
  const bearerMount = bindStreamProxy(bearerOnlyEndpoint, {
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    upstreamAuth: () => ({}),
    authorize: () => ({ allow: true, grant: {} }),
    recheck: () => ({ allow: true }),
    resolvePath: () => '/projects/b/events',
  });
  const cookieRejected = await bearerMount.handle(
    new Request('https://api.example.test/api/streams/bearer/abc', {
      headers: { cookie: '__Host-s=1', 'sec-fetch-site': 'same-origin' },
    }),
    // Omit credentialMode via raw call to verify standalone enforcement too:
    {
      params: { id: 'abc' },
      shutdownSignal: new AbortController().signal,
    } as unknown as StreamProxyMountContext,
  );
  assertEquals(cookieRejected.status, 401);

  // 5. Construction rejects malformed endpoint
  assertThrows(
    () =>
      bindStreamProxy(
        { id: 'bad', path: '/x' } as never,
        {
          authorize: () => ({ allow: true, grant: {} }),
          recheck: () => ({ allow: true }),
          resolvePath: () => '/x',
        },
      ),
    TypeError,
  );
});

Deno.test('End-to-end mounted bindStreamProxy + ServiceBuilder + real DurableStreamTestServer + CORS/multi-cookie + pre-drain running.stop()', async () => {
  const server = new DurableStreamTestServer({ port: 0 });
  const streamsBaseUrl = await server.start();
  const streamPath = '/projects/PROJ-99/events';
  const fullUpstreamUrl = `${streamsBaseUrl}/v1/stream/netscript${streamPath}`;

  try {
    const putRes = await fetch(fullUpstreamUrl, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(makeStateChange('mounted-1', { v: 1 })),
    });
    assert(putRes.ok, `PUT seed failed: ${putRes.status}`);
    await putRes.body?.cancel();

    const bearerAuth: AuthenticatorPort = {
      authenticate(req) {
        const auth = req.header('authorization');
        if (!auth) return { ok: false, reason: 'missing-credential' };
        if (auth === 'Bearer valid-member') {
          return {
            ok: true,
            principal: {
              subject: 'user:member-1',
              scopes: ['projects:read'],
              roles: ['member'],
              scheme: 'bearer',
              claims: {},
            },
            responseHeaders: { 'x-authn-ok': 'true' },
            setCookies: ['authn=1; Path=/; HttpOnly'],
          };
        }
        if (auth === 'Bearer wrong-scope') {
          return {
            ok: true,
            principal: {
              subject: 'user:other',
              scopes: ['other:read'],
              roles: ['member'],
              scheme: 'bearer',
              claims: {},
            },
          };
        }
        return { ok: false, reason: 'invalid-bearer' };
      },
    };

    const cookieAuth: AuthenticatorPort = {
      authenticate(req) {
        if (req.cookie('__Host-s') === 'valid-cookie') {
          return {
            ok: true,
            principal: {
              subject: 'user:cookie-2',
              scopes: ['projects:read'],
              roles: ['member'],
              scheme: 'custom',
              claims: {},
            },
          };
        }
        return { ok: false, reason: 'missing-credential' };
      },
    };

    let closedReason: string | undefined;
    const mount = bindStreamProxy(projectFeedEndpoint, {
      baseUrl: streamsBaseUrl,
      recheckEveryMs: null,
      allowedOrigins: ['https://app.example.test'],
      upstreamAuth: () => ({}),
      authorize: ({ params, principal, credentialMode }) => ({
        allow: true,
        grant: { projectId: params.projectId, subject: principal?.subject, credentialMode },
        responseHeaders: { 'x-proxy-grant': `${principal?.subject ?? 'none'}:${credentialMode}` },
        setCookies: ['proxy=2; Path=/; HttpOnly'],
      }),
      recheck: () => ({ allow: true }),
      resolvePath: ({ grant }) => `/projects/${grant.projectId}/events`,
      onClose: (event) => {
        closedReason = event.reason;
      },
    });

    const running = await createService({}, { name: 'e2e-mounted-stream' })
      .withCors({ origin: ['https://app.example.test'], credentials: true })
      .withAuthn({ authenticator: createCompositeAuthenticator([bearerAuth, cookieAuth]) })
      .withAuthz({ authorizer: createContractAuthorizer(sampleApiContract) })
      .withRPC()
      .withStreamProxy(mount)
      .serve({ port: 0, hostname: '127.0.0.1', drainTimeoutMs: 10_000, handleSignals: false });

    const base = `http://${running.addr.hostname}:${running.addr.port}`;
    try {
      // 1. Invalid Bearer + valid Cookie -> 401 (no cookie fallback)
      const fallbackDenied = await fetch(`${base}/api/streams/projects/proj-99`, {
        headers: {
          authorization: 'Bearer revoked',
          cookie: '__Host-s=valid-cookie',
          'sec-fetch-site': 'same-origin',
        },
      });
      assertEquals(fallbackDenied.status, 401);
      await fallbackDenied.body?.cancel();

      // 2. Valid Bearer lacking projects:read -> 403
      const scopeDenied = await fetch(`${base}/api/streams/projects/proj-99`, {
        headers: { authorization: 'Bearer wrong-scope' },
      });
      assertEquals(scopeDenied.status, 403);
      await scopeDenied.body?.cancel();

      // 3. Valid Bearer + Origin -> 200 SSE from real DurableStreamTestServer + additive Set-Cookie + CORS
      const liveRes = await fetch(`${base}/api/streams/projects/proj-99?offset=-1&live=sse`, {
        headers: {
          authorization: 'Bearer valid-member',
          cookie: '__Host-s=valid-cookie',
          origin: 'https://app.example.test',
        },
      });
      assertEquals(liveRes.status, 200);
      assertEquals(liveRes.headers.get('cache-control'), 'no-store, no-cache, no-transform');
      assertEquals(liveRes.headers.get('x-authn-ok'), 'true');
      assertEquals(liveRes.headers.get('x-proxy-grant'), 'user:member-1:bearer');
      assertEquals(liveRes.headers.get('access-control-allow-origin'), 'https://app.example.test');
      assertEquals(liveRes.headers.get('access-control-allow-credentials'), 'true');
      assertEquals(liveRes.headers.getSetCookie(), [
        'authn=1; Path=/; HttpOnly',
        'proxy=2; Path=/; HttpOnly',
      ]);

      const reader = liveRes.body!.getReader();
      const first = await readOneChunkText(reader);
      assertFalse(first.done);
      assertStringIncludes(first.text, 'mounted-1');
      assertStringIncludes(first.text, 'event: control');

      // 4. While SSE reader is open & idle, call running.stop() -> pre-drain shutdownSignal closes promptly
      const t0 = performance.now();
      const stopPromise = running.stop();
      const eof = await readOneChunkText(reader);
      assertEquals(eof.done, true);
      assertEquals(eof.text, '');
      reader.releaseLock();
      await stopPromise;
      const elapsedMs = performance.now() - t0;

      assertEquals(closedReason, 'shutdown');
      assert(elapsedMs < 3_000, `running.stop() stalled for ${elapsedMs.toFixed(1)}ms`);
    } finally {
      await running.stop();
    }
  } finally {
    await stopDurableStreamTestServerCleanly(server);
  }
});

Deno.test('Regression item 5: bindStreamProxy rejects conflicting credentialMode, Promise/thenable parse(), and prototype-inherited params', async () => {
  const upstream = createControlledUpstream();
  let authorizeCalls = 0;

  // 1. Conflicting credentialMode handoff rejected BEFORE authorize (both bearer-only and cookie-only)
  const bearerMount = bindStreamProxy(bearerOnlyEndpoint, {
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    upstreamAuth: () => ({}),
    authorize: () => {
      authorizeCalls += 1;
      return { allow: true, grant: {} };
    },
    recheck: () => ({ allow: true }),
    resolvePath: () => '/projects/b/events',
  });
  const bearerWithCookieCtx = await bearerMount.handle(
    new Request('https://api.example.test/api/streams/bearer/abc'),
    {
      params: { id: 'abc' },
      credentialMode: 'cookie',
      shutdownSignal: new AbortController().signal,
    },
  );
  assertEquals(bearerWithCookieCtx.status, 401);
  assertEquals((await bearerWithCookieCtx.json()).reason, 'bearer_required');
  assertEquals(authorizeCalls, 0);

  const cookieOnlyEndpoint = defineStreamEndpoint({
    id: 'projects.cookie_only',
    path: '/api/streams/cookie/{id}',
    params: z.object({ id: z.string().min(1) }),
    clientAuth: 'cookie',
  });
  const cookieMount = bindStreamProxy(cookieOnlyEndpoint, {
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    upstreamAuth: () => ({}),
    authorize: () => {
      authorizeCalls += 1;
      return { allow: true, grant: {} };
    },
    recheck: () => ({ allow: true }),
    resolvePath: () => '/projects/c/events',
  });
  const cookieWithBearerCtx = await cookieMount.handle(
    new Request('https://api.example.test/api/streams/cookie/abc', {
      headers: { authorization: 'Bearer tok' },
    }),
    {
      params: { id: 'abc' },
      credentialMode: 'bearer',
      shutdownSignal: new AbortController().signal,
    },
  );
  assertEquals(cookieWithBearerCtx.status, 401);
  assertEquals((await cookieWithBearerCtx.json()).reason, 'bearer_not_allowed');
  assertEquals(authorizeCalls, 0);

  const invalidModeCtx = await cookieMount.handle(
    new Request('https://api.example.test/api/streams/cookie/abc'),
    {
      params: { id: 'abc' },
      credentialMode: 'api-key' as unknown as 'cookie',
      shutdownSignal: new AbortController().signal,
    },
  );
  assertEquals(invalidModeCtx.status, 401);
  assertEquals((await invalidModeCtx.json()).reason, 'invalid_credential_mode');
  assertEquals(authorizeCalls, 0);

  // 2. Promise-returning (resolving AND rejecting) and custom-thenable parse() MUST fail 400 before authorize
  const asyncResolvingParamsEndpoint = {
    ...bearerOnlyEndpoint,
    params: {
      parse: (value: unknown) => Promise.resolve(value),
    },
  };
  const asyncResolveMount = bindStreamProxy(asyncResolvingParamsEndpoint as never, {
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    upstreamAuth: () => ({}),
    authorize: () => {
      authorizeCalls += 1;
      return { allow: true, grant: {} };
    },
    recheck: () => ({ allow: true }),
    resolvePath: () => '/projects/a/events',
  });
  const asyncResolveRes = await asyncResolveMount.handle(
    new Request('https://api.example.test/api/streams/bearer/abc', {
      headers: { authorization: 'Bearer tok' },
    }),
    {
      params: { id: 'abc' },
      credentialMode: 'bearer',
      shutdownSignal: new AbortController().signal,
    },
  );
  assertEquals(asyncResolveRes.status, 400);
  assertEquals((await asyncResolveRes.json()).reason, 'invalid_stream_params');
  assertEquals(authorizeCalls, 0);

  // Rejecting Promise from parse() must be consumed (no unhandled rejection) and return 400
  const asyncRejectingParamsEndpoint = {
    ...bearerOnlyEndpoint,
    params: {
      parse: () => Promise.reject(new Error('async schema reject')),
    },
  };
  const asyncRejectMount = bindStreamProxy(asyncRejectingParamsEndpoint as never, {
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    upstreamAuth: () => ({}),
    authorize: () => {
      authorizeCalls += 1;
      return { allow: true, grant: {} };
    },
    recheck: () => ({ allow: true }),
    resolvePath: () => '/projects/a/events',
  });
  const asyncRejectRes = await asyncRejectMount.handle(
    new Request('https://api.example.test/api/streams/bearer/abc', {
      headers: { authorization: 'Bearer tok' },
    }),
    {
      params: { id: 'abc' },
      credentialMode: 'bearer',
      shutdownSignal: new AbortController().signal,
    },
  );
  assertEquals(asyncRejectRes.status, 400);
  assertEquals((await asyncRejectRes.json()).reason, 'invalid_stream_params');
  await flushMicrotasks();
  assertEquals(authorizeCalls, 0);

  // Custom thenable from query parse() returns 400 invalid_stream_query
  const thenableQueryEndpoint = {
    ...bearerOnlyEndpoint,
    query: {
      parse: () => ({
        then(onFulfilled: (v: unknown) => void) {
          onFulfilled({});
        },
      }),
    },
  };
  const thenableQueryMount = bindStreamProxy(thenableQueryEndpoint as never, {
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    upstreamAuth: () => ({}),
    authorize: () => {
      authorizeCalls += 1;
      return { allow: true, grant: {} };
    },
    recheck: () => ({ allow: true }),
    resolvePath: () => '/projects/a/events',
  });
  const thenableQueryRes = await thenableQueryMount.handle(
    new Request('https://api.example.test/api/streams/bearer/abc?view=all', {
      headers: { authorization: 'Bearer tok' },
    }),
    {
      params: { id: 'abc' },
      credentialMode: 'bearer',
      shutdownSignal: new AbortController().signal,
    },
  );
  assertEquals(thenableQueryRes.status, 400);
  assertEquals((await thenableQueryRes.json()).reason, 'invalid_stream_query');
  assertEquals(authorizeCalls, 0);

  // 3. Prototype-inherited keys cannot satisfy missing params, and schema inputs use null-prototype records
  let paramsInputProto: unknown = 'unset';
  let queryInputProto: unknown = 'unset';
  const protoShape: Record<string, unknown> = Object.create(null);
  protoShape['toString'] = {};
  protoShape['__proto__'] = {};
  const protoParamEndpoint = defineStreamEndpoint({
    id: 'projects.proto_check',
    path: '/api/streams/proto/{toString}/{__proto__}',
    params: {
      shape: protoShape,
      parse(value: unknown) {
        paramsInputProto = Object.getPrototypeOf(value);
        return value as { readonly toString: string; readonly __proto__: string };
      },
    } as never,
    query: {
      shape: {},
      parse(value: unknown) {
        queryInputProto = Object.getPrototypeOf(value);
        return value as Readonly<Record<string, string>>;
      },
    } as never,
    clientAuth: 'bearer',
  });

  const protoMount = bindStreamProxy(protoParamEndpoint, {
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    recheckEveryMs: null,
    upstreamAuth: () => ({}),
    authorize: ({ params, query }) => {
      authorizeCalls += 1;
      return { allow: true, grant: { params, query } };
    },
    recheck: () => ({ allow: true }),
    resolvePath: () => '/projects/proto/events',
  });

  // Missing own properties on plain `{}` (even though toString / __proto__ exist on Object.prototype) -> 400!
  const inheritedOnly = await protoMount.handle(
    new Request('https://api.example.test/api/streams/proto/a/b', {
      headers: { authorization: 'Bearer tok' },
    }),
    {
      params: {},
      credentialMode: 'bearer',
      shutdownSignal: new AbortController().signal,
    },
  );
  assertEquals(inheritedOnly.status, 400);
  assertEquals((await inheritedOnly.json()).reason, 'invalid_stream_params');
  assertEquals(authorizeCalls, 0);

  // Inherited string property via prototype chain also rejected by Object.hasOwn
  const protoWithString = Object.create({ toString: 'inherited', __proto__: 'inherited' });
  const inheritedStringRes = await protoMount.handle(
    new Request('https://api.example.test/api/streams/proto/a/b', {
      headers: { authorization: 'Bearer tok' },
    }),
    {
      params: protoWithString,
      credentialMode: 'bearer',
      shutdownSignal: new AbortController().signal,
    },
  );
  assertEquals(inheritedStringRes.status, 400);
  assertEquals(authorizeCalls, 0);

  // Actual own properties (including `__proto__` and `?__proto__=safe`) pass via null-prototype records safely
  const ownParams: Record<string, string> = Object.create(null);
  ownParams['toString'] = 'val1';
  ownParams['__proto__'] = 'val2';
  const ownOk = await protoMount.handle(
    new Request(
      'https://api.example.test/api/streams/proto/val1/val2?__proto__=safe&constructor=ok',
      {
        headers: { authorization: 'Bearer tok' },
      },
    ),
    {
      params: ownParams,
      credentialMode: 'bearer',
      shutdownSignal: new AbortController().signal,
    },
  );
  assertEquals(ownOk.status, 200);
  assertEquals(authorizeCalls, 1);
  assertEquals(paramsInputProto, null);
  assertEquals(queryInputProto, null);
  await ownOk.body?.cancel();
  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);
});
