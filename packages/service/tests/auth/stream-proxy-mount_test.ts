import { assert, assertEquals, assertFalse, assertThrows } from '@std/assert';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { defineStreamEndpoint, type StreamEndpointContract } from '@netscript/contracts/streams';
import { z } from 'zod';
import {
  type AuthenticatorPort,
  type AuthorizerPort,
  createContractAuthorizer,
  createContractOverlayAuthorizer,
  createService,
  defineService,
  type Principal,
  type StreamProxyMount,
  type StreamProxyMountContext,
} from '../../mod.ts';
import {
  createCompositeAuthenticator,
  createInstallationSecret,
  createInternalCredentialAuthenticator,
  createStaticCredentialAuthenticator,
} from '../../src/auth/mod.ts';
import { patternsIntersect } from '../../src/auth/contract/stream-endpoint-policy.ts';
import { matchAndCanonicalizeStreamRequest } from '../../src/builder/stream-proxy-guard.ts';
import { normalizeStreamEndpoint } from '../../src/auth/contract/stream-endpoint-policy.ts';

const projectsFeedEndpoint = defineStreamEndpoint({
  id: 'projects.feed',
  path: '/api/streams/projects/{projectId}',
  params: z.object({ projectId: z.string().min(1) }),
  clientAuth: 'bearer-or-cookie',
  access: {
    authentication: 'required',
    authorization: { scopes: ['projects:read'], roles: ['member'] },
  },
});

const internalEventsEndpoint = defineStreamEndpoint({
  id: 'internal.events',
  path: '/api/streams/internal/{topic}',
  params: z.object({ topic: z.string().min(1) }),
  clientAuth: 'bearer',
  access: {
    authentication: 'required',
    audience: 'internal',
  },
});

const baseApiContract = {
  orders: {
    list: baseContract
      .route({ method: 'GET', path: '/orders' })
      .meta({ access: { authentication: 'required', authorization: { scopes: ['orders:read'] } } })
      .output(SuccessSchema),
  },
};

function makePrincipal(overrides: Partial<Principal> = {}): Principal {
  return {
    subject: overrides.subject ?? 'user:bearer',
    scopes: overrides.scopes ?? ['projects:read'],
    roles: overrides.roles ?? ['member'],
    scheme: overrides.scheme ?? 'bearer',
    claims: overrides.claims ?? {},
  };
}

function makeStructuralMount(
  endpoint: StreamEndpointContract<unknown, unknown, unknown, unknown> = projectsFeedEndpoint,
  options: {
    readonly guardConfig?: StreamProxyMount['guardConfig'];
    readonly onHandle?: (
      request: Request,
      context: StreamProxyMountContext,
    ) => Response | Promise<Response>;
  } = {},
): StreamProxyMount {
  return {
    endpoint,
    ...(options.guardConfig ? { guardConfig: options.guardConfig } : {}),
    async handle(request, context) {
      if (options.onHandle) return await options.onHandle(request, context);
      return new Response('event: control\ndata: {"streamNextOffset":"o1"}\n\n', {
        status: 200,
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-store, no-cache, no-transform',
          'x-content-type-options': 'nosniff',
          'x-accel-buffering': 'no',
          'vary': 'Authorization, Cookie, Origin, Sec-Fetch-Site, Sec-Fetch-Dest',
        },
      });
    },
  };
}

Deno.test('Gate 6 composite authenticator: strict credentialMode scoping prevents Bearer->Cookie fallback and binds principal', async () => {
  let bearerCalls = 0;
  let cookieCalls = 0;
  let cookieHeaderVisibleToBearerAuth = false;
  let authHeaderVisibleToCookieAuth = false;
  let handleCalls = 0;
  let observedContext: StreamProxyMountContext | undefined;

  const bearerAuth: AuthenticatorPort = {
    authenticate(req) {
      bearerCalls += 1;
      if (
        req.header('cookie') !== undefined || req.headers().has('cookie') ||
        req.cookie('__Host-s') !== undefined
      ) {
        cookieHeaderVisibleToBearerAuth = true;
      }
      const auth = req.header('authorization');
      if (!auth) return { ok: false, reason: 'missing-credential' };
      if (auth === 'Bearer good-bearer') {
        return {
          ok: true,
          principal: makePrincipal({ subject: 'user:bearer-1', scheme: 'bearer' }),
        };
      }
      return { ok: false, reason: 'invalid-bearer' };
    },
  };

  const cookieAuth: AuthenticatorPort = {
    authenticate(req) {
      cookieCalls += 1;
      if (req.header('authorization') !== undefined || req.headers().has('authorization')) {
        authHeaderVisibleToCookieAuth = true;
      }
      const session = req.cookie('__Host-s');
      if (!session) return { ok: false, reason: 'missing-credential' };
      if (session === 'good-cookie') {
        return {
          ok: true,
          principal: makePrincipal({ subject: 'user:cookie-1', scheme: 'custom' }),
        };
      }
      return { ok: false, reason: 'invalid-cookie' };
    },
  };

  const app = createService({}, { name: 'composite-stream' })
    .withAuthn({ authenticator: createCompositeAuthenticator([bearerAuth, cookieAuth]) })
    .withAuthz({ authorizer: createContractAuthorizer(baseApiContract) })
    .withStreamProxy(
      makeStructuralMount(projectsFeedEndpoint, {
        guardConfig: {
          allowedOrigins: ['https://partner.example.test'],
          trustProxy: (ip) => ip === '10.0.0.1',
        },
        onHandle(_req, ctx) {
          handleCalls += 1;
          observedContext = ctx;
          return new Response('event: control\ndata: {"streamNextOffset":"o1"}\n\n', {
            status: 200,
            headers: { 'content-type': 'text/event-stream; charset=utf-8' },
          });
        },
      }),
    )
    .build();

  // 1. Invalid Bearer + valid Cookie -> 401, ZERO fallback to cookie principal, ZERO handle calls!
  const invalidBearerWithCookie = await app.request('/api/streams/projects/p1', {
    headers: {
      authorization: 'Bearer revoked-token',
      cookie: '__Host-s=good-cookie',
      'sec-fetch-site': 'same-origin',
    },
  });
  assertEquals(invalidBearerWithCookie.status, 401);
  assertEquals(handleCalls, 0);
  assertEquals(cookieHeaderVisibleToBearerAuth, false);

  // 2. Malformed / empty / non-Bearer Authorization + valid Cookie -> 401 BEFORE withAuthn even runs!
  const bearerCallsBefore = bearerCalls;
  const cookieCallsBefore = cookieCalls;
  for (const badAuth of ['Basic abc', '', 'Bearer', 'Bearer a b', 'Bearer t1, Bearer t2']) {
    const h = new Headers({ cookie: '__Host-s=good-cookie', 'sec-fetch-site': 'same-origin' });
    h.set('authorization', badAuth);
    const res = await app.request('/api/streams/projects/p1', { headers: h });
    assertEquals(res.status, 401, `bad Authorization ${JSON.stringify(badAuth)} must fail 401`);
  }
  assertEquals(bearerCalls, bearerCallsBefore);
  assertEquals(cookieCalls, cookieCallsBefore);

  // 3. Cross-site cookie request -> 403 BEFORE withAuthn runs (session refresh never executes!)
  const crossSite = await app.request('/api/streams/projects/p1', {
    headers: {
      cookie: '__Host-s=good-cookie',
      origin: 'https://evil.example.test',
      'sec-fetch-site': 'cross-site',
    },
  });
  assertEquals(crossSite.status, 403);
  assertEquals(cookieCalls, cookieCallsBefore);

  // 4. Valid Bearer + valid Cookie -> 200 bound strictly to bearer-1 principal (never cookie-1)
  const bothValid = await app.request('/api/streams/projects/p1', {
    headers: {
      authorization: 'Bearer good-bearer',
      cookie: '__Host-s=good-cookie',
      'sec-fetch-site': 'same-origin',
    },
  });
  assertEquals(bothValid.status, 200);
  assertEquals(observedContext?.credentialMode, 'bearer');
  assertEquals(observedContext?.principal?.subject, 'user:bearer-1');
  assertEquals(observedContext?.params, { projectId: 'p1' });
  await bothValid.body?.cancel();

  // 5. Valid Cookie with allowlisted Origin -> 200 bound to cookie-1 (authorization hidden from cookieAuth)
  authHeaderVisibleToCookieAuth = false;
  const cookieAllowed = await app.request('/api/streams/projects/p2', {
    headers: {
      cookie: '__Host-s=good-cookie',
      origin: 'https://partner.example.test',
      'sec-fetch-site': 'cross-site',
    },
  });
  assertEquals(cookieAllowed.status, 200);
  assertEquals(observedContext?.credentialMode, 'cookie');
  assertEquals(observedContext?.principal?.subject, 'user:cookie-1');
  assertEquals(authHeaderVisibleToCookieAuth, false);
  await cookieAllowed.body?.cancel();

  // 6. Trusted reverse-proxy peer with forwarded origin -> 200; untrusted peer -> 403
  const trustedForward = await app.fetch(
    new Request('http://127.0.0.1:3001/api/streams/projects/p3', {
      headers: {
        cookie: '__Host-s=good-cookie',
        origin: 'https://public.example.test',
        'sec-fetch-site': 'same-origin',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'public.example.test',
      },
    }),
    { remoteAddr: { transport: 'tcp', hostname: '10.0.0.1', port: 4000 } },
  );
  assertEquals(trustedForward.status, 200);
  await trustedForward.body?.cancel();

  const untrustedForward = await app.fetch(
    new Request('http://127.0.0.1:3001/api/streams/projects/p3', {
      headers: {
        cookie: '__Host-s=good-cookie',
        origin: 'https://public.example.test',
        'sec-fetch-site': 'same-origin',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'public.example.test',
      },
    }),
    { remoteAddr: { transport: 'tcp', hostname: '10.0.0.99', port: 4000 } },
  );
  assertEquals(untrustedForward.status, 403);

  // 7. Throwing trustProxy fails closed 503 without leaking exception text
  const throwingTrustApp = createService({}, { name: 'throw-trust' })
    .withAuthn({ authenticator: cookieAuth })
    .withStreamProxy(
      makeStructuralMount(projectsFeedEndpoint, {
        guardConfig: {
          trustProxy: () => {
            throw new Error('SECRET_TRUST_CRASH');
          },
        },
      }),
    )
    .build();
  const trustErr = await throwingTrustApp.fetch(
    new Request('http://127.0.0.1:3001/api/streams/projects/p1', {
      headers: { cookie: '__Host-s=good-cookie', 'sec-fetch-site': 'same-origin' },
    }),
    { remoteAddr: { transport: 'tcp', hostname: '10.0.0.1', port: 4000 } },
  );
  assertEquals(trustErr.status, 503);
  assertFalse((await trustErr.text()).includes('SECRET_TRUST_CRASH'));
});

Deno.test('Gate 6 mounted response ownership: additive Set-Cookie + withCors + reserved AuthnResult.responseHeaders 503', async () => {
  let authnHeaders: Readonly<Record<string, string>> | undefined = { 'x-authn-custom': 'yes' };
  let authnCookies: readonly string[] | undefined = ['authn=1; Path=/; HttpOnly'];
  let mountHandleCalls = 0;

  const authenticator: AuthenticatorPort = {
    authenticate() {
      return {
        ok: true,
        principal: makePrincipal(),
        responseHeaders: authnHeaders,
        setCookies: authnCookies,
      };
    },
  };

  const app = createService({}, { name: 'cors-cookie-stream' })
    .withCors({ origin: ['https://partner.example.test'], credentials: true })
    .withAuthn({ authenticator })
    .withAuthz({ authorizer: createContractAuthorizer(baseApiContract) })
    .withStreamProxy(
      makeStructuralMount(projectsFeedEndpoint, {
        guardConfig: { allowedOrigins: ['https://partner.example.test'] },
        onHandle() {
          mountHandleCalls += 1;
          const headers = new Headers({
            'content-type': 'text/event-stream; charset=utf-8',
            'cache-control': 'no-store, no-cache, no-transform',
            'x-content-type-options': 'nosniff',
            'x-accel-buffering': 'no',
            'x-proxy-custom': 'ok',
            'vary': 'Authorization, Cookie, Origin, Sec-Fetch-Site, Sec-Fetch-Dest',
          });
          headers.append('set-cookie', 'proxy=2; Path=/; HttpOnly');
          return new Response('event: control\ndata: {"streamNextOffset":"o1"}\n\n', {
            status: 200,
            headers,
          });
        },
      }),
    )
    .build();

  // 1. Additive Set-Cookie + non-reserved AuthnResult header + CORS + mandatory Tier 3 headers
  const res = await app.request('/api/streams/projects/p1', {
    headers: {
      authorization: 'Bearer tok-1',
      origin: 'https://partner.example.test',
    },
  });
  assertEquals(res.status, 200);
  assertEquals(res.headers.getSetCookie(), [
    'authn=1; Path=/; HttpOnly',
    'proxy=2; Path=/; HttpOnly',
  ]);
  assertEquals(res.headers.get('cache-control'), 'no-store, no-cache, no-transform');
  assertEquals(res.headers.get('x-content-type-options'), 'nosniff');
  assertEquals(res.headers.get('x-accel-buffering'), 'no');
  assertEquals(res.headers.get('x-authn-custom'), 'yes');
  assertEquals(res.headers.get('x-proxy-custom'), 'ok');
  assertEquals(res.headers.get('access-control-allow-origin'), 'https://partner.example.test');
  assertEquals(res.headers.get('access-control-allow-credentials'), 'true');
  const varyTokens = (res.headers.get('vary') ?? '').toLowerCase().split(',').map((t) => t.trim());
  for (
    const required of ['origin', 'authorization', 'cookie', 'sec-fetch-site', 'sec-fetch-dest']
  ) {
    assert(
      varyTokens.includes(required),
      `missing Vary token ${required} in ${res.headers.get('vary')}`,
    );
  }
  await res.body?.cancel();

  // 2. Reserved AuthnResult.responseHeaders -> fail closed 503 with zero mount.handle calls!
  const callsBeforeReserved = mountHandleCalls;
  for (
    const reservedHeader of [
      ['cache-control', 'public'],
      ['content-type', 'text/plain'],
      ['access-control-allow-origin', '*'],
      ['cross-origin-resource-policy', 'cross-origin'],
      ['vary', '*'],
      ['set-cookie', 'sneaky=1'],
      ['stream-next-offset', 'forged'],
      ['etag', '"forged"'],
      ['x-bad-unicode', 'caf\u0100'],
    ] as const
  ) {
    authnHeaders = { [reservedHeader[0]]: reservedHeader[1] };
    authnCookies = undefined;
    const errRes = await app.request('/api/streams/projects/p1', {
      headers: { authorization: 'Bearer tok-1' },
    });
    assertEquals(
      errRes.status,
      503,
      `reserved AuthnResult header ${reservedHeader[0]} must fail 503`,
    );
    assertEquals(errRes.headers.get('cache-control'), 'no-store');
  }
  assertEquals(mountHandleCalls, callsBeforeReserved);
});

Deno.test('Gate 7 authoritative contract/overlay policy, options.streamEndpoints cross-check, and structural mount enforcement', async () => {
  const staticAuth = createStaticCredentialAuthenticator({
    credentials: {
      'ok-token': { subject: 'u:ok', scopes: ['projects:read'], roles: ['member'] },
      'wrong-scope': { subject: 'u:nos', scopes: ['other:read'], roles: ['member'] },
      'wrong-role': { subject: 'u:nor', scopes: ['projects:read'], roles: ['guest'] },
    },
  });
  const internalSecret = await createInstallationSecret(
    new TextEncoder().encode('0123456789abcdef0123456789abcdef'),
  );
  const internalAuth = createInternalCredentialAuthenticator({
    secret: internalSecret,
    service: 'streams-svc',
  });

  // 1. createContractAuthorizer (single registration via withStreamProxy only)
  {
    const app = createService({}, { name: 'strict-stream' })
      .withAuthn({ authenticator: createCompositeAuthenticator([internalAuth, staticAuth]) })
      .withAuthz({ authorizer: createContractAuthorizer(baseApiContract) })
      .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
      .withStreamProxy(makeStructuralMount(internalEventsEndpoint))
      .build();

    assertEquals((await app.request('/api/streams/projects/p1')).status, 401);
    assertEquals(
      (await app.request('/api/streams/projects/p1', {
        headers: { authorization: 'Bearer wrong-scope' },
      })).status,
      403,
    );
    assertEquals(
      (await app.request('/api/streams/projects/p1', {
        headers: { authorization: 'Bearer wrong-role' },
      })).status,
      403,
    );
    const okRes = await app.request('/api/streams/projects/p1', {
      headers: { authorization: 'Bearer ok-token' },
    });
    assertEquals(okRes.status, 200);
    await okRes.body?.cancel();

    // Non-GET on regular stream path -> 404 procedure_not_found after auth
    const postStream = await app.request('/api/streams/projects/p1', {
      method: 'POST',
      headers: { authorization: 'Bearer ok-token' },
    });
    assertEquals(postStream.status, 404);
    assertEquals((await postStream.json()).code, 'procedure_not_found');

    // Internal-audience stream rejects non-internal caller on GET AND HEAD/POST
    assertEquals(
      (await app.request('/api/streams/internal/jobs', {
        headers: { authorization: 'Bearer ok-token' },
      })).status,
      403,
    );
    assertEquals(
      (await app.request('/api/streams/internal/jobs', {
        method: 'POST',
        headers: { authorization: 'Bearer ok-token' },
      })).status,
      403,
    );
  }

  // 2. createContractOverlayAuthorizer (even with allowAnonymous: ['/api'] -> zero fallthrough to allow-all!)
  {
    const overlayApp = createService({}, { name: 'overlay-stream' })
      .withAuthn({ authenticator: staticAuth, allowAnonymous: ['/api'] })
      .withAuthz({ authorizer: createContractOverlayAuthorizer(baseApiContract) })
      .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
      .withStreamProxy(makeStructuralMount(internalEventsEndpoint))
      .build();

    assertEquals((await overlayApp.request('/api/streams/projects/p1')).status, 401);
    assertEquals(
      (await overlayApp.request('/api/streams/projects/p1', {
        headers: { authorization: 'Bearer wrong-scope' },
      })).status,
      403,
    );
    assertEquals(
      (await overlayApp.request('/api/streams/internal/jobs', {
        method: 'HEAD',
        headers: { authorization: 'Bearer ok-token' },
      })).status,
      403,
    );
    const okOverlay = await overlayApp.request('/api/streams/projects/p1', {
      headers: { authorization: 'Bearer ok-token' },
    });
    assertEquals(okOverlay.status, 200);
    await okOverlay.body?.cancel();
  }

  // 3. Explicit options.streamEndpoints cross-check on BOTH authorizers
  const mismatchedAccess = defineStreamEndpoint({
    id: 'projects.feed',
    path: '/api/streams/projects/{projectId}',
    params: z.object({ projectId: z.string().min(1) }),
    clientAuth: 'bearer-or-cookie',
    access: { authentication: 'required', authorization: { scopes: ['different:scope'] } },
  });
  const mismatchedClientAuth = defineStreamEndpoint({
    id: 'projects.feed',
    path: '/api/streams/projects/{projectId}',
    params: z.object({ projectId: z.string().min(1) }),
    clientAuth: 'bearer',
    access: {
      authentication: 'required',
      authorization: { scopes: ['projects:read'], roles: ['member'] },
    },
  });
  const extraEndpoint = defineStreamEndpoint({
    id: 'extra.feed',
    path: '/api/streams/extra',
  });

  for (const makeAuthz of [createContractAuthorizer, createContractOverlayAuthorizer]) {
    // Exact match succeeds
    const matched = createService({}, { name: 'pin-ok' })
      .withAuthn({ authenticator: staticAuth })
      .withAuthz({
        authorizer: makeAuthz(baseApiContract, { streamEndpoints: [projectsFeedEndpoint] }),
      })
      .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
      .build();
    const res = await matched.request('/api/streams/projects/p1', {
      headers: { authorization: 'Bearer ok-token' },
    });
    assertEquals(res.status, 200);
    await res.body?.cancel();

    // Omitted mounted endpoint throws
    assertThrows(
      () =>
        createService({}, { name: 'pin-omit' })
          .withAuthn({ authenticator: staticAuth })
          .withAuthz({ authorizer: makeAuthz(baseApiContract, { streamEndpoints: [] }) })
          .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
          .build(),
      Error,
      'stream endpoint policy mismatch: projects.feed',
    );

    // Extra unmounted endpoint throws
    assertThrows(
      () =>
        createService({}, { name: 'pin-extra' })
          .withAuthn({ authenticator: staticAuth })
          .withAuthz({
            authorizer: makeAuthz(baseApiContract, {
              streamEndpoints: [projectsFeedEndpoint, extraEndpoint],
            }),
          })
          .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
          .build(),
      Error,
      'stream endpoint policy mismatch: extra.feed',
    );

    // Mismatched access or clientAuth throws
    assertThrows(
      () =>
        createService({}, { name: 'pin-access' })
          .withAuthn({ authenticator: staticAuth })
          .withAuthz({
            authorizer: makeAuthz(baseApiContract, { streamEndpoints: [mismatchedAccess] }),
          })
          .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
          .build(),
      Error,
      'stream endpoint policy mismatch: projects.feed',
    );
    assertThrows(
      () =>
        createService({}, { name: 'pin-client-auth' })
          .withAuthn({ authenticator: staticAuth })
          .withAuthz({
            authorizer: makeAuthz(baseApiContract, { streamEndpoints: [mismatchedClientAuth] }),
          })
          .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
          .build(),
      Error,
      'stream endpoint policy mismatch: projects.feed',
    );
  }

  // 4. Non-contract allow-all AuthorizerPort and no-authz STILL enforce endpoint.access on structural mounts
  const allowAllAuthorizer: AuthorizerPort = { authorize: () => ({ allow: true }) };
  for (const useAllowAll of [false, true]) {
    const builder = createService({}, { name: 'non-contract' })
      .withAuthn({ authenticator: staticAuth })
      .withStreamProxy(makeStructuralMount(projectsFeedEndpoint));
    if (useAllowAll) builder.withAuthz({ authorizer: allowAllAuthorizer });
    const app = builder.build();

    assertEquals((await app.request('/api/streams/projects/p1')).status, 401);
    assertEquals(
      (await app.request('/api/streams/projects/p1', {
        headers: { authorization: 'Bearer wrong-scope' },
      })).status,
      403,
    );
    const ok = await app.request('/api/streams/projects/p1', {
      headers: { authorization: 'Bearer ok-token' },
    });
    assertEquals(ok.status, 200);
    await ok.body?.cancel();
  }

  // 5. Missing withAuthn throws synchronously at build() and defineService({ auth: { public: true } })
  assertThrows(
    () => createService({}, { name: 'no-authn' }).withStreamProxy(makeStructuralMount()).build(),
    Error,
    'requires service authentication',
  );
  let defineThrew = false;
  try {
    await defineService({}, {
      name: 'pub-stream',
      port: 0,
      auth: { public: true, reason: 'test' },
      streamProxies: [makeStructuralMount()],
    });
  } catch (err) {
    defineThrew = err instanceof Error && err.message.includes('requires service authentication');
  }
  assertEquals(defineThrew, true);
});

Deno.test('Gate 7 symmetric patternsIntersect overlap detection and pre-authn canonicalization', async () => {
  // 1. Unit assertions on symmetric patternsIntersect
  assertEquals(
    patternsIntersect('/api/streams/projects/summary', '/api/streams/projects/{projectId}'),
    true,
  );
  assertEquals(patternsIntersect('/api/streams/{a}/feed', '/api/streams/projects/{b}'), true);
  assertEquals(patternsIntersect('/api/streams/*', '/api/streams/projects/{projectId}'), true);
  assertEquals(patternsIntersect('/api/rpc/**', '/api/rpc/{feedId}'), true);
  assertEquals(
    patternsIntersect('/api/streams/projects/{projectId}', '/api/streams/orders/{orderId}'),
    false,
  );

  const staticAuth = createStaticCredentialAuthenticator({
    credentials: { 'ok-token': { subject: 'u:ok', scopes: ['projects:read'], roles: ['member'] } },
  });

  // 2. Concrete-inside-template oRPC overlap throws at build()
  const concreteOverlapContract = {
    summary: baseContract
      .route({ method: 'GET', path: '/streams/projects/summary' })
      .output(SuccessSchema),
  };
  assertThrows(
    () =>
      createService({}, { name: 'orpc-concrete' })
        .withAuthn({ authenticator: staticAuth })
        .withAuthz({ authorizer: createContractAuthorizer(concreteOverlapContract) })
        .withRPC()
        .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
        .build(),
    Error,
    'stream endpoint path overlaps',
  );

  // 3. Template-vs-template oRPC overlap throws at build() (/api/streams/{a}/feed vs /api/streams/projects/{b})
  const templateOverlapContract = {
    feed: baseContract
      .route({ method: 'GET', path: '/streams/{a}/feed' })
      .output(SuccessSchema),
  };
  const projectsSubFeed = defineStreamEndpoint({
    id: 'projects.subfeed',
    path: '/api/streams/projects/{b}',
    params: z.object({ b: z.string() }),
  });
  assertThrows(
    () =>
      createService({}, { name: 'orpc-template' })
        .withAuthn({ authenticator: staticAuth })
        .withAuthz({ authorizer: createContractAuthorizer(templateOverlapContract) })
        .withRPC()
        .withStreamProxy(makeStructuralMount(projectsSubFeed))
        .build(),
    Error,
    'stream endpoint path overlaps',
  );

  // 4. Ordinary ServiceBuilder.route() concrete & wildcard overlap throws at build()
  assertThrows(
    () =>
      createService({}, { name: 'route-concrete' })
        .withAuthn({ authenticator: staticAuth })
        .route('get', '/api/streams/projects/custom', (c) => c.text('hi'))
        .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
        .build(),
    Error,
    'stream endpoint path overlaps',
  );
  assertThrows(
    () =>
      createService({}, { name: 'route-wild' })
        .withAuthn({ authenticator: staticAuth })
        .route('all', '/api/streams/*', (c) => c.text('hi'))
        .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
        .build(),
    Error,
    'stream endpoint path overlaps',
  );

  // 5. RPC mount overlap throws at build()
  const rpcOverlapStream = defineStreamEndpoint({
    id: 'rpc.overlap',
    path: '/api/rpc/{feedId}',
    params: z.object({ feedId: z.string() }),
  });
  assertThrows(
    () =>
      createService({}, { name: 'rpc-overlap' })
        .withAuthn({ authenticator: staticAuth })
        .withAuthz({ authorizer: createContractAuthorizer(baseApiContract) })
        .withRPC()
        .withStreamProxy(makeStructuralMount(rpcOverlapStream))
        .build(),
    Error,
    'stream endpoint path overlaps',
  );

  // 6. rawRoutes, retiredPaths, and stream-vs-stream overlaps throw
  assertThrows(
    () =>
      createService({}, { name: 'raw-overlap' })
        .withAuthn({ authenticator: staticAuth })
        .withAuthz({
          authorizer: createContractAuthorizer(baseApiContract, {
            rawRoutes: [{ path: '/api/streams/projects/legacy', authentication: 'required' }],
          }),
        })
        .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
        .build(),
    Error,
    'stream endpoint path overlaps',
  );
  assertThrows(
    () =>
      createService({}, { name: 'retired-overlap' })
        .withAuthn({ authenticator: staticAuth })
        .withAuthz({
          authorizer: createContractAuthorizer(baseApiContract, {
            retiredPaths: ['/api/streams/projects/old'],
          }),
        })
        .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
        .build(),
    Error,
    'stream endpoint path overlaps',
  );
  assertThrows(
    () =>
      createService({}, { name: 'stream-stream' })
        .withAuthn({ authenticator: staticAuth })
        .withStreamProxy(makeStructuralMount(projectsFeedEndpoint))
        .withStreamProxy(makeStructuralMount(projectsSubFeed))
        .build(),
    Error,
    'stream endpoint path overlaps',
  );

  // 7. Pre-authn canonicalization: encoded static segment, %2F, %5C, %2e%2e -> 400 BEFORE authn!
  let authnCalls = 0;
  let capturedParams: Readonly<Record<string, string>> | undefined;
  const canonicalApp = createService({}, { name: 'canon-stream' })
    .withAuthn({
      authenticator: {
        authenticate(req) {
          authnCalls += 1;
          return staticAuth.authenticate(req);
        },
      },
    })
    .withStreamProxy(
      makeStructuralMount(projectsFeedEndpoint, {
        onHandle(_req, ctx) {
          capturedParams = ctx.params;
          return new Response('event: control\ndata: {"streamNextOffset":"o1"}\n\n', {
            status: 200,
            headers: { 'content-type': 'text/event-stream; charset=utf-8' },
          });
        },
      }),
    )
    .build();

  for (
    const badPath of [
      '/api/%73treams/projects/p1',
      '/api/streams/projects/a%2Fb',
      '/api/streams/projects/a%2fb',
      '/api/streams/projects/a%5Cb',
      '/api/streams/projects/..%2fsecret',
      '/api/streams/projects/%ZZ',
    ]
  ) {
    const res = await canonicalApp.request(badPath, {
      headers: { authorization: 'Bearer ok-token' },
    });
    assertEquals(res.status, 400, `non-canonical path ${badPath} must fail 400`);
  }
  assertEquals(authnCalls, 0);

  // Direct canonicalizer check for raw dot segments (in case an upstream transport skips URL normalization)
  const compiledGuard = [{
    endpoint: normalizeStreamEndpoint(projectsFeedEndpoint),
    allowedOrigins: new Set<string>(),
    trustProxy: false as const,
    allowDirectNavigation: false,
  }];
  assertEquals(
    matchAndCanonicalizeStreamRequest(
      '/api/streams/projects/..',
      '/api/streams/projects/..',
      compiledGuard,
    ).kind,
    'invalid',
  );
  assertEquals(
    matchAndCanonicalizeStreamRequest(
      '/api/streams/projects/%2e%2e',
      '/api/streams/projects/..',
      compiledGuard,
    ).kind,
    'invalid',
  );
  assertEquals(
    matchAndCanonicalizeStreamRequest(
      '/api/streams/projects/.',
      '/api/streams/projects/.',
      compiledGuard,
    ).kind,
    'invalid',
  );

  // Valid percent-encoded param value passes and decodes cleanly
  const validEncoded = await canonicalApp.request('/api/streams/projects/proj%201', {
    headers: { authorization: 'Bearer ok-token' },
  });
  assertEquals(validEncoded.status, 200);
  assertEquals(capturedParams, { projectId: 'proj 1' });
  await validEncoded.body?.cancel();
});

Deno.test('Gate 7 live serve(): running.stop() aborts pre-drain shutdownSignal and drains open SSE well below drainTimeoutMs', async () => {
  const staticAuth = createStaticCredentialAuthenticator({
    credentials: { 'ok-token': { subject: 'u:ok', scopes: ['projects:read'], roles: ['member'] } },
  });
  let shutdownSignalAborted = false;

  const mount = makeStructuralMount(projectsFeedEndpoint, {
    onHandle(_req, ctx) {
      const encoder = new TextEncoder();
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode('event: control\ndata: {"streamNextOffset":"o1"}\n\n'));
          const onAbort = (): void => {
            shutdownSignalAborted = true;
            try {
              controller.close();
            } catch {
              // already closed
            }
          };
          if (ctx.shutdownSignal.aborted) onAbort();
          else ctx.shutdownSignal.addEventListener('abort', onAbort, { once: true });
        },
      });
      return new Response(body, {
        status: 200,
        headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      });
    },
  });

  const running = await createService({}, { name: 'shutdown-stream' })
    .withAuthn({ authenticator: staticAuth })
    .withAuthz({ authorizer: createContractAuthorizer(baseApiContract) })
    .withStreamProxy(mount)
    .serve({ port: 0, hostname: '127.0.0.1', drainTimeoutMs: 10_000, handleSignals: false });

  try {
    const url = `http://${running.addr.hostname}:${running.addr.port}/api/streams/projects/live-1`;
    const res = await fetch(url, { headers: { authorization: 'Bearer ok-token' } });
    assertEquals(res.status, 200);
    const reader = res.body!.getReader();
    const first = await reader.read();
    assertFalse(first.done);

    // Reader is now idle & open; trigger running.stop() and verify prompt pre-drain shutdown
    const t0 = performance.now();
    const stopPromise = running.stop();
    const next = await reader.read();
    assertEquals(next.done, true);
    reader.releaseLock();
    await stopPromise;
    const elapsedMs = performance.now() - t0;

    assertEquals(shutdownSignalAborted, true);
    assert(
      elapsedMs < 3_000,
      `running.stop() took ${elapsedMs.toFixed(1)}ms (expected << 10_000ms)`,
    );
  } finally {
    await running.stop();
  }
});
