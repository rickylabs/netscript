import { assert, assertEquals, assertFalse, assertThrows } from '@std/assert';
import { DurableStreamTestServer } from 'npm:@durable-streams/server@0.3.9';
import { configure, type LogRecord, resetLogging } from '@netscript/logger';
import {
  createStreamSseReplayStateV1,
  parseStreamSseEventV1,
  reduceStreamSseReplayStateV1,
} from '../../src/sse/mod.ts';
import {
  createNetScriptStreamProxy,
  type StreamProxyAuthDecision,
  type StreamProxyCloseEvent,
  type StreamProxyRevocationSignal,
} from '../../proxy.ts';
import {
  createControlledUpstream,
  createDeferred,
  createSharedRevocationHub,
  flushMicrotasks,
  makeStateChange,
  readAllText,
  readOneChunkText,
  sseControlBlock,
  sseDataBlock,
  stopDurableStreamTestServerCleanly,
  type TestGrant,
} from './_test_helpers.ts';

Deno.test('construction validation rejects invalid hooks, timers, limits, origins, and offsets', () => {
  const validBase = {
    authorize: () => ({ allow: true as const, grant: {} }),
    recheck: () => ({ allow: true as const }),
    resolvePath: () => '/ok/path',
  };
  assertThrows(
    () => createNetScriptStreamProxy({ ...validBase, allowedOrigins: ['*'] }),
    TypeError,
  );
  assertThrows(
    () => createNetScriptStreamProxy({ ...validBase, allowedOrigins: ['null'] }),
    TypeError,
  );
  assertThrows(
    () => createNetScriptStreamProxy({ ...validBase, allowedOrigins: ['https://a.test/path'] }),
    TypeError,
  );
  assertThrows(() => createNetScriptStreamProxy({ ...validBase, recheckEveryMs: 50 }), TypeError);
  assertThrows(() => createNetScriptStreamProxy({ ...validBase, policyTimeoutMs: 0 }), TypeError);
  assertThrows(
    () => createNetScriptStreamProxy({ ...validBase, maxPendingBatchBytes: 512 }),
    TypeError,
  );
  assertThrows(() => createNetScriptStreamProxy({ ...validBase, maxActiveReaders: 0 }), TypeError);
  assertThrows(
    () =>
      createNetScriptStreamProxy({ ...validBase, maxReadersPerKey: { key: () => 'k', max: 0 } }),
    TypeError,
  );
  assertThrows(
    () => createNetScriptStreamProxy({ ...validBase, defaultOffset: 'bad offset' }),
    TypeError,
  );
});

Deno.test('Gate 5 & Gate 6: credential selection, Cookie Origin/Fetch Metadata/trustProxy, ?live= handling, upstream isolation, and dynamic Connection stripping', async () => {
  // 1. Credential selection matrix
  let authorizeCalls = 0;
  const upstream = createControlledUpstream({
    responseHeaders: {
      'connection': 'keep-alive, etag',
      'etag': '"v1-nominated-hop-by-hop"',
      'x-unlisted': 'leak',
      'access-control-allow-origin': '*',
      'content-encoding': 'gzip',
      'content-length': '5',
      'www-authenticate': 'Bearer realm="upstream"',
      'set-cookie': 'upstream=1',
      'stream-next-offset': 'o1',
    },
  });

  const makeProxy = (
    clientAuth: 'bearer' | 'cookie' | 'bearer-or-cookie',
    extra: Partial<Parameters<typeof createNetScriptStreamProxy>[0]> = {},
  ) =>
    createNetScriptStreamProxy({
      baseUrl: 'http://streams.internal',
      fetch: upstream.fetch,
      clientAuth,
      recheckEveryMs: null,
      upstreamAuth: () => ({ authorization: 'Bearer UPSTREAM_SECRET_999' }),
      authorize: ({ credentialMode }) => {
        authorizeCalls += 1;
        return {
          allow: true,
          grant: { mode: credentialMode },
          responseHeaders: { 'x-app-mode': credentialMode },
          setCookies: [
            '__Host-refresh=rot1; Path=/; HttpOnly',
            '__Host-second=rot2; Path=/; HttpOnly',
          ],
        };
      },
      recheck: () => ({ allow: true }),
      resolvePath: () => '/projects/sec/events',
      ...extra,
    });

  // Malformed / empty / duplicate / non-Bearer Authorization with valid Cookie -> 401, 0 authorize calls
  const dualProxy = makeProxy('bearer-or-cookie');
  const badAuths = [
    'Basic abc',
    '',
    '   ',
    'Bearer',
    'Bearer a b',
    'Bearer tok1, Bearer tok2',
    'Bearer tok\x01bad',
  ];
  for (const bad of badAuths) {
    const h = new Headers({ cookie: '__Host-s=ok', 'sec-fetch-site': 'same-origin' });
    h.set('authorization', bad);
    const res = await dualProxy(new Request('https://app.example.test/stream', { headers: h }));
    assertEquals(res.status, 401, `bad auth ${JSON.stringify(bad)} must return 401`);
  }
  assertEquals(authorizeCalls, 0);

  // clientAuth: 'cookie' rejects any Authorization header
  const cookieProxy = makeProxy('cookie');
  assertEquals(
    (await cookieProxy(
      new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer ok' } }),
    )).status,
    401,
  );
  assertEquals(authorizeCalls, 0);

  // clientAuth: 'bearer' rejects cookie-only request; admits valid Bearer + Cookie with credentialMode: 'bearer'
  const bearerProxy = makeProxy('bearer');
  assertEquals(
    (await bearerProxy(
      new Request('https://app.example.test/stream', { headers: { cookie: 's=1' } }),
    )).status,
    401,
  );
  const okBearer = await bearerProxy(
    new Request('https://app.example.test/stream', {
      headers: { authorization: 'Bearer valid_tok.123-abc~+/=', cookie: 'CLIENT_COOKIE_SECRET' },
    }),
  );
  assertEquals(okBearer.status, 200);
  // Upstream isolation & dynamic Connection stripping assertions
  const upReq = upstream.readers[0]!;
  assertEquals(upReq.headers.get('authorization'), 'Bearer UPSTREAM_SECRET_999');
  assertEquals(upReq.headers.get('accept-encoding'), 'identity');
  assertEquals(upReq.headers.get('cookie'), null);

  assertEquals(okBearer.headers.get('stream-next-offset'), 'o1');
  assertEquals(okBearer.headers.get('etag'), null); // Nominated by Connection: keep-alive, etag!
  assertEquals(okBearer.headers.get('x-unlisted'), null);
  assertEquals(okBearer.headers.get('access-control-allow-origin'), null);
  assertEquals(okBearer.headers.get('content-encoding'), null);
  assertEquals(okBearer.headers.get('content-length'), null);
  assertEquals(okBearer.headers.get('www-authenticate'), null);
  assertEquals(okBearer.headers.get('x-app-mode'), 'bearer');
  assertEquals(okBearer.headers.get('cache-control'), 'no-store, no-cache, no-transform');
  assertEquals(okBearer.headers.get('x-content-type-options'), 'nosniff');
  assertEquals(okBearer.headers.get('x-accel-buffering'), 'no');
  assertEquals(okBearer.headers.getSetCookie(), [
    '__Host-refresh=rot1; Path=/; HttpOnly',
    '__Host-second=rot2; Path=/; HttpOnly',
  ]);
  // >1 KiB SSE stream passes uncorrupted
  const bigPayload = sseDataBlock(makeStateChange('big', { text: 'A'.repeat(2048) })) +
    sseControlBlock({ streamNextOffset: 'off_big' });
  const textP = readAllText(okBearer.body);
  upReq.push(bigPayload);
  upReq.close();
  assertEquals(await textP, bigPayload);

  // 2. Cookie Origin / Fetch Metadata / trustProxy checks
  assertEquals(
    (await cookieProxy(
      new Request('https://app.example.test/stream', {
        headers: { 'sec-fetch-site': 'cross-site' },
      }),
    )).status,
    403,
  );
  assertEquals(
    (await cookieProxy(
      new Request('https://app.example.test/stream', {
        headers: { origin: 'https://evil.example.test' },
      }),
    )).status,
    403,
  );
  assertEquals(
    (await cookieProxy(
      new Request('https://app.example.test/stream', { headers: { origin: 'null' } }),
    )).status,
    403,
  );
  assertEquals(
    (await cookieProxy(
      new Request('https://app.example.test/stream', {
        headers: { 'sec-fetch-site': 'none', 'sec-fetch-dest': 'document' },
      }),
    )).status,
    403,
  );

  // Explicit allowedOrigins admits exact match
  const corsCookieProxy = makeProxy('cookie', { allowedOrigins: ['https://partner.example.test'] });
  const allowedRes = await corsCookieProxy(
    new Request('https://app.example.test/stream', {
      headers: {
        origin: 'https://partner.example.test',
        'sec-fetch-site': 'cross-site',
        'sec-fetch-dest': 'empty',
      },
    }),
  );
  assertEquals(allowedRes.status, 200);
  await allowedRes.body?.cancel();

  // trustProxy: false ignores spoofed forwarded headers -> 403
  assertEquals(
    (await cookieProxy(
      new Request('http://127.0.0.1:3001/stream', {
        headers: {
          origin: 'https://public.example.test',
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'public.example.test',
        },
      }),
      { remoteAddr: { transport: 'tcp', hostname: '127.0.0.1', port: 4444 } },
    )).status,
    403,
  );

  // trustProxy: trusted remoteAddr complete pair -> 200; untrusted / missing / partial / malformed -> 403
  const trustedProxy = makeProxy('cookie', { trustProxy: (ip) => ip === '10.0.0.1' });
  const trustedOk = await trustedProxy(
    new Request('http://127.0.0.1:3001/stream', {
      headers: {
        origin: 'https://public.example.test',
        'sec-fetch-site': 'same-origin',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'public.example.test',
      },
    }),
    { remoteAddr: { transport: 'tcp', hostname: '10.0.0.1', port: 4444 } },
  );
  assertEquals(trustedOk.status, 200);
  await trustedOk.body?.cancel();

  // Untrusted peer
  assertEquals(
    (await trustedProxy(
      new Request('http://127.0.0.1:3001/stream', {
        headers: {
          origin: 'https://public.example.test',
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'public.example.test',
        },
      }),
      { remoteAddr: { transport: 'tcp', hostname: '10.0.0.99', port: 4444 } },
    )).status,
    403,
  );
  // Missing remoteAddr
  assertEquals(
    (await trustedProxy(
      new Request('http://127.0.0.1:3001/stream', {
        headers: {
          origin: 'https://public.example.test',
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'public.example.test',
        },
      }),
    )).status,
    403,
  );
  // Partial pair (X-Forwarded-Proto alone against internal 127.0.0.1 host -> mismatch -> 403)
  assertEquals(
    (await trustedProxy(
      new Request('http://127.0.0.1:3001/stream', {
        headers: { origin: 'https://public.example.test', 'x-forwarded-proto': 'https' },
      }),
      { remoteAddr: { transport: 'tcp', hostname: '10.0.0.1', port: 4444 } },
    )).status,
    403,
  );
  // Malformed multi-value X-Forwarded-Host -> 403
  assertEquals(
    (await trustedProxy(
      new Request('http://127.0.0.1:3001/stream', {
        headers: {
          origin: 'https://public.example.test',
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'public.example.test, evil.test',
        },
      }),
      { remoteAddr: { transport: 'tcp', hostname: '10.0.0.1', port: 4444 } },
    )).status,
    403,
  );

  // 3. ?live= handling (omitted & single 'sse' ok; others & duplicates -> 400)
  const liveOk = await bearerProxy(
    new Request('https://app.example.test/stream?offset=-1&live=sse', {
      headers: { authorization: 'Bearer ok' },
    }),
  );
  assertEquals(liveOk.status, 200);
  await liveOk.body?.cancel();
  for (
    const badQuery of [
      'live=long-poll',
      'live=false',
      'live=',
      'live=sse&live=sse',
      'offset=1&offset=2',
    ]
  ) {
    const r = await bearerProxy(
      new Request(`https://app.example.test/stream?${badQuery}`, {
        headers: { authorization: 'Bearer ok' },
      }),
    );
    assertEquals(r.status, 400, `expected 400 for ?${badQuery}`);
  }

  // 4. Upstream 302 redirect (redirect: 'manual'), 401/403 -> 502, conditional 410 -> 410
  for (
    const [upStatus, expectedStatus] of [[302, 502], [401, 502], [403, 502], [410, 410]] as const
  ) {
    let seenRedirect: RequestRedirect | undefined;
    const p = createNetScriptStreamProxy({
      baseUrl: 'http://streams.internal',
      upstreamAuth: () => ({ authorization: 'Bearer TOP_SECRET_UPSTREAM' }),
      fetch: (_u, init) => {
        seenRedirect = init?.redirect;
        return Promise.resolve(new Response('upstream-secret-body', { status: upStatus }));
      },
      authorize: () => ({ allow: true, grant: {} }),
      recheck: () => ({ allow: true }),
      resolvePath: () => '/projects/status/events',
    });
    const r = await p(
      new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer ok' } }),
    );
    assertEquals(seenRedirect, 'manual');
    assertEquals(r.status, expectedStatus);
    assertFalse((await r.text()).includes('upstream-secret-body'));
  }

  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);
});

Deno.test('Gate 5 real DurableStreamTestServer: 404 absent stream & bearer/cookie offset resume parsing cleanly through STREAM_SSE_CONTRACT_V1', async () => {
  const server = new DurableStreamTestServer({ port: 0 });
  const baseUrl = await server.start();
  const streamPath = '/projects/resume/events';
  const fullUrl = `${baseUrl}/v1/stream/netscript${streamPath}`;

  try {
    const proxy = createNetScriptStreamProxy({
      baseUrl,
      upstreamAuth: () => ({}),
      recheckEveryMs: null,
      authorize: () => ({ allow: true, grant: { ok: true } }),
      recheck: () => ({ allow: true }),
      resolvePath: ({ request }) =>
        new URL(request.url).pathname.endsWith('/missing')
          ? '/projects/missing/events'
          : streamPath,
    });

    // Absent stream -> 404 after admission
    const missing = await proxy(
      new Request('https://app.example.test/missing', {
        headers: { authorization: 'Bearer tok-1' },
      }),
    );
    assertEquals(missing.status, 404);

    // Create batch 1, read through bearer client, parse with parseStreamSseEventV1 + reduceStreamSseReplayStateV1
    const put = await fetch(fullUrl, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(makeStateChange('item-1', { step: 1 })),
    });
    await put.body?.cancel();

    const r1 = await proxy(
      new Request('https://app.example.test/stream?offset=-1&live=sse', {
        headers: { authorization: 'Bearer tok-1' },
      }),
    );
    assertEquals(r1.status, 200);
    const reader1 = r1.body!.getReader();
    const chunk1 = await readOneChunkText(reader1);
    await reader1.cancel('disconnect');
    reader1.releaseLock();

    let state = createStreamSseReplayStateV1();
    for (const block of chunk1.text.trim().split('\n\n')) {
      const lines = block.split('\n');
      const eventName = lines.find((l) => l.startsWith('event:'))!.slice(6).trim();
      const data = lines.filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join(
        '\n',
      );
      const parsed = parseStreamSseEventV1({
        eventName,
        data,
        lastCommittedOffset: state.lastCommittedOffset,
      });
      assertEquals(parsed.ok, true);
      if (parsed.ok) state = reduceStreamSseReplayStateV1(state, parsed.frame).state;
    }
    assert(state.lastCommittedOffset !== undefined);
    const offset1 = state.lastCommittedOffset!;

    // Append batch 2 and resume as cookie client from offset1
    const post = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(makeStateChange('item-2', { step: 2 })),
    });
    await post.body?.cancel();

    const r2 = await proxy(
      new Request(`https://app.example.test/stream?offset=${encodeURIComponent(offset1)}`, {
        headers: { cookie: '__Host-ns_session=cookie-1', 'sec-fetch-site': 'same-origin' },
      }),
    );
    assertEquals(r2.status, 200);
    const reader2 = r2.body!.getReader();
    const chunk2 = await readOneChunkText(reader2);
    await reader2.cancel('done');
    reader2.releaseLock();
    assertFalse(chunk2.text.includes('item-1'));
    assert(chunk2.text.includes('item-2'));
  } finally {
    await stopDurableStreamTestServerCleanly(server);
  }
});

Deno.test('Finding 2 adversarial fail-closed matrix: non-ByteString headers, throwing getters, throwing trustProxy, and invalid upstream baseUrl', async () => {
  // 2a: Non-ByteString responseHeaders / setCookies and invalid header names fail closed 503 with 0 upstream & freed slots
  {
    const upstream = createControlledUpstream();
    let mode: 'bad-header-val' | 'bad-cookie-val' | 'bad-header-name' | 'ok' = 'bad-header-val';
    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      fetch: upstream.fetch,
      recheckEveryMs: null,
      maxActiveReaders: 1,
      maxReadersPerKey: { key: (g) => g.sessionId, max: 1 },
      upstreamAuth: () => ({}),
      authorize: (): StreamProxyAuthDecision<TestGrant> => {
        if (mode === 'bad-header-val') {
          return {
            allow: true,
            grant: { sessionId: 'h1' },
            responseHeaders: { 'x-app-note': 'caf\u0100' },
          };
        }
        if (mode === 'bad-cookie-val') {
          return {
            allow: true,
            grant: { sessionId: 'h1' },
            setCookies: ['__Host-s=bad\u0100val; Path=/'],
          };
        }
        if (mode === 'bad-header-name') {
          return {
            allow: true,
            grant: { sessionId: 'h1' },
            responseHeaders: { 'bad name': 'ok' },
          };
        }
        return { allow: true, grant: { sessionId: 'h1' } };
      },
      recheck: () => ({ allow: true }),
      resolvePath: () => '/projects/h/events',
    });

    for (const m of ['bad-header-val', 'bad-cookie-val', 'bad-header-name'] as const) {
      mode = m;
      const res = await proxy(
        new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer h1' } }),
      );
      assertEquals(res.status, 503, `mode=${m} must fail closed 503`);
    }
    assertEquals(upstream.totalOpened, 0);

    // Follow-up valid request proves both global (max=1) and per-key (max=1) slots were released
    mode = 'ok';
    const okRes = await proxy(
      new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer h1' } }),
    );
    assertEquals(okRes.status, 200);
    await okRes.body?.cancel();
    await flushMicrotasks();
    assertEquals(upstream.activeCount, 0);
  }

  // 2b: Hostile / throwing decision getters in authorize, setup recheck, and streaming recheck
  {
    const upstream = createControlledUpstream();
    const throwingAuthDecisions: unknown[] = [
      Object.defineProperty({}, 'allow', {
        get() {
          throw new Error('AUTH_ALLOW_GETTER_SECRET');
        },
      }),
      Object.defineProperty({ allow: true }, 'grant', {
        get() {
          throw new Error('AUTH_GRANT_GETTER_SECRET');
        },
      }),
      Object.defineProperty({ allow: true, grant: { sessionId: 'g1' } }, 'responseHeaders', {
        get() {
          throw new Error('AUTH_HEADERS_GETTER_SECRET');
        },
      }),
      Object.defineProperty({ allow: true, grant: { sessionId: 'g1' } }, 'setCookies', {
        get() {
          throw new Error('AUTH_COOKIES_GETTER_SECRET');
        },
      }),
      Object.defineProperty({ allow: true, grant: { sessionId: 'g1' } }, 'expiresAtMs', {
        get() {
          throw new Error('AUTH_EXPIRY_GETTER_SECRET');
        },
      }),
    ];
    let idx = 0;
    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      fetch: upstream.fetch,
      maxActiveReaders: 1,
      upstreamAuth: () => ({}),
      authorize: () =>
        idx < throwingAuthDecisions.length
          ? (throwingAuthDecisions[idx++] as never)
          : { allow: true, grant: { sessionId: 'ok' } },
      recheck: () => ({ allow: true }),
      resolvePath: () => '/projects/g/events',
    });

    for (let i = 0; i < throwingAuthDecisions.length; i += 1) {
      const res = await proxy(
        new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer g1' } }),
      );
      assertEquals(res.status, 503);
      assertFalse((await res.text()).includes('GETTER_SECRET'));
    }
    assertEquals(upstream.totalOpened, 0);
    const recovery = await proxy(
      new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer g1' } }),
    );
    assertEquals(recovery.status, 200);
    await recovery.body?.cancel();

    // Setup post-subscribe throwing recheck getter -> 503, unsubscribed, 0 upstream
    const hubSetup = createSharedRevocationHub();
    const setupGetterProxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      fetch: upstream.fetch,
      maxActiveReaders: 1,
      revocationSource: hubSetup.revocationSource,
      upstreamAuth: () => ({}),
      authorize: () => ({ allow: true, grant: { sessionId: 'setup-g' } }),
      recheck: () =>
        Object.defineProperty({ allow: true }, 'expiresAtMs', {
          get() {
            throw new Error('SETUP_RECHECK_GETTER');
          },
        }) as never,
      resolvePath: () => '/projects/g/events',
    });
    const setupRes = await setupGetterProxy(
      new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer g1' } }),
    );
    assertEquals(setupRes.status, 503);
    assertEquals(hubSetup.unsubscribeCount('setup-g'), 1);

    // Streaming before-delivery throwing recheck getter -> closeOnce('policy-error'), 0 bytes emitted
    const streamUpstream = createControlledUpstream();
    const closed: StreamProxyCloseEvent[] = [];
    const streamGetterProxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      fetch: streamUpstream.fetch,
      recheckEveryMs: null,
      upstreamAuth: () => ({}),
      authorize: () => ({ allow: true, grant: { sessionId: 'stream-g' } }),
      recheck: () =>
        Object.defineProperty({}, 'allow', {
          get() {
            throw new Error('STREAM_RECHECK_GETTER');
          },
        }) as never,
      resolvePath: () => '/projects/g/events',
      onClose: (e) => closed.push(e),
    });
    const streamRes = await streamGetterProxy(
      new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer g1' } }),
    );
    assertEquals(streamRes.status, 200);
    streamUpstream.readers[0]!.push(
      sseDataBlock(makeStateChange('secret', { v: 1 })) +
        sseControlBlock({ streamNextOffset: 'o1' }),
    );
    assertEquals(await readAllText(streamRes.body), '');
    assertEquals(closed.length, 1);
    assertEquals(closed[0]!.reason, 'policy-error');
    await flushMicrotasks();
    assertEquals(streamUpstream.activeCount, 0);
  }

  // 2c: Throwing trustProxy predicate fails closed 503, redacts message, frees slot
  {
    const upstream = createControlledUpstream();
    let shouldThrow = true;
    const proxy = createNetScriptStreamProxy({
      baseUrl: 'http://streams.internal',
      fetch: upstream.fetch,
      clientAuth: 'cookie',
      maxActiveReaders: 1,
      trustProxy: () => {
        if (shouldThrow) throw new Error('TRUST_PROXY_SECRET_CRASH');
        return true;
      },
      upstreamAuth: () => ({}),
      authorize: () => ({ allow: true, grant: {} }),
      recheck: () => ({ allow: true }),
      resolvePath: () => '/projects/tp/events',
    });

    const errRes = await proxy(
      new Request('http://127.0.0.1:3001/stream', {
        headers: {
          origin: 'https://public.example.test',
          'sec-fetch-site': 'same-origin',
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'public.example.test',
        },
      }),
      { remoteAddr: { transport: 'tcp', hostname: '10.0.0.1', port: 4444 } },
    );
    assertEquals(errRes.status, 503);
    assertFalse((await errRes.text()).includes('TRUST_PROXY_SECRET_CRASH'));
    assertEquals(upstream.totalOpened, 0);

    shouldThrow = false;
    const okRes = await proxy(
      new Request('http://127.0.0.1:3001/stream', {
        headers: {
          origin: 'https://public.example.test',
          'sec-fetch-site': 'same-origin',
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'public.example.test',
        },
      }),
      { remoteAddr: { transport: 'tcp', hostname: '10.0.0.1', port: 4444 } },
    );
    assertEquals(okRes.status, 200);
    await okRes.body?.cancel();
    await flushMicrotasks();
    assertEquals(upstream.activeCount, 0);
  }

  // 2d: Invalid upstream baseUrl (query, fragment, userinfo, non-HTTP(S), malformed) -> 502, 0 fetch calls, slot freed
  {
    const upstream = createControlledUpstream();
    const badBaseUrls = [
      'http://streams.internal?injected=1',
      'http://streams.internal#frag',
      'http://user:pass@streams.internal',
      'ftp://streams.internal',
      'not a valid url',
    ];
    let currentBase = badBaseUrls[0]!;
    const proxy = createNetScriptStreamProxy({
      baseUrl: () => currentBase,
      fetch: upstream.fetch,
      recheckEveryMs: null,
      maxActiveReaders: 1,
      upstreamAuth: () => ({}),
      authorize: () => ({ allow: true, grant: {} }),
      recheck: () => ({ allow: true }),
      resolvePath: () => '/projects/url/events',
    });

    for (const bad of badBaseUrls) {
      currentBase = bad;
      const res = await proxy(
        new Request('https://app.example.test/stream', {
          headers: { authorization: 'Bearer ok' },
        }),
      );
      assertEquals(res.status, 502, `bad baseUrl ${bad} must fail closed 502`);
    }
    assertEquals(upstream.totalOpened, 0);

    // Valid prefixed baseUrl composes cleanly and proves slot was released
    currentBase = 'http://streams.internal/prefix/';
    const okRes = await proxy(
      new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer ok' } }),
    );
    assertEquals(okRes.status, 200);
    assertEquals(
      upstream.readers[0]!.url,
      'http://streams.internal/prefix/v1/stream/netscript/projects/url/events?offset=-1&live=sse',
    );
    await okRes.body?.cancel();
    await flushMicrotasks();
    assertEquals(upstream.activeCount, 0);
  }
});

Deno.test('Gate 6 redaction & reserved headers: zero secrets in structured log records or HTTP bodies', async () => {
  const captured: LogRecord[] = [];
  await resetLogging();
  await configure({
    sinks: { capture: (record: LogRecord) => captured.push(record) },
    loggers: [{
      category: ['netscript', 'streams', 'proxy'],
      lowestLevel: 'debug',
      sinks: ['capture'],
    }],
  });

  const SECRETS = [
    'BEARER_SECRET_XYZ_111',
    'COOKIE_SECRET_XYZ_222',
    'UPSTREAM_SECRET_XYZ_333',
    'QUERY_SECRET_XYZ_444',
    'RAW_THROWN_POLICY_ERR_555',
  ];

  try {
    let upstreamOpened = 0;
    const reservedHeaders = [
      'cache-control',
      'content-type',
      'access-control-allow-origin',
      'vary',
      'set-cookie',
      'stream-next-offset',
      'stream-cursor',
      'etag',
    ];
    for (const h of reservedHeaders) {
      const p = createNetScriptStreamProxy({
        baseUrl: 'http://streams.internal',
        upstreamAuth: () => ({ authorization: `Bearer ${SECRETS[2]}` }),
        fetch: () => {
          upstreamOpened += 1;
          return Promise.resolve(new Response(null, { status: 200 }));
        },
        authorize: () => ({
          allow: true,
          grant: { secret: SECRETS[0] },
          responseHeaders: { [h]: 'bad' },
        }),
        recheck: () => ({ allow: true }),
        resolvePath: () => '/projects/r/events',
      });
      const res = await p(
        new Request(`https://app.example.test/stream?q=${SECRETS[3]}`, {
          headers: { authorization: `Bearer ${SECRETS[0]}`, cookie: `s=${SECRETS[1]}` },
        }),
      );
      assertEquals(res.status, 503, `reserved header ${h} must fail closed 503`);
      const body = await res.text();
      for (const s of SECRETS) assertFalse(body.includes(s));
    }
    assertEquals(upstreamOpened, 0);

    // Denial 401, throw 503, upstream 401 -> 502
    const scenarios = [
      createNetScriptStreamProxy({
        baseUrl: 'http://streams.internal',
        upstreamAuth: () => ({ authorization: `Bearer ${SECRETS[2]}` }),
        authorize: () => ({ allow: false, status: 401, reason: `denied ${SECRETS[0]}` }),
        recheck: () => ({ allow: true }),
        resolvePath: () => '/projects/r/events',
      }),
      createNetScriptStreamProxy({
        baseUrl: 'http://streams.internal',
        upstreamAuth: () => ({ authorization: `Bearer ${SECRETS[2]}` }),
        authorize: () => {
          throw new Error(SECRETS[4]);
        },
        recheck: () => ({ allow: true }),
        resolvePath: () => '/projects/r/events',
      }),
      createNetScriptStreamProxy({
        baseUrl: 'http://streams.internal',
        upstreamAuth: () => ({ authorization: `Bearer ${SECRETS[2]}` }),
        fetch: () => Promise.resolve(new Response(SECRETS[2], { status: 401 })),
        authorize: () => ({ allow: true, grant: { secret: SECRETS[0] } }),
        recheck: () => ({ allow: true }),
        resolvePath: () => '/projects/r/events',
      }),
    ];

    for (const p of scenarios) {
      const res = await p(
        new Request(`https://app.example.test/stream?q=${SECRETS[3]}`, {
          headers: { authorization: `Bearer ${SECRETS[0]}`, cookie: `s=${SECRETS[1]}` },
        }),
      );
      const body = await res.text();
      for (const s of SECRETS) assertFalse(body.includes(s), `HTTP body leaked ${s}`);
    }

    const serializedLogs = JSON.stringify(captured);
    for (const s of SECRETS) {
      assertFalse(serializedLogs.includes(s), `Log records leaked ${s}`);
    }
  } finally {
    await resetLogging();
  }
});

Deno.test('Gate 9 reader caps (maxActiveReaders 503 + maxReadersPerKey 429 + early-exit slot release) and wake-storm coalescing', async () => {
  // 1. maxActiveReaders + early-exit slot release across Steps 2, 3, 4, 5
  const upstream = createControlledUpstream();
  let authCalls = 0;
  let badPathOnce = true;

  const capProxy = createNetScriptStreamProxy<TestGrant>({
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    recheckEveryMs: null,
    maxActiveReaders: 2,
    maxReadersPerKey: { key: (g) => g.sessionId, max: 1 },
    upstreamAuth: () => ({}),
    authorize: ({ request }) => {
      authCalls += 1;
      const sid = (request.headers.get('authorization') ?? '').slice('Bearer '.length);
      if (sid === 'deny') return { allow: false, status: 403, reason: 'denied' };
      return { allow: true, grant: { sessionId: sid } };
    },
    recheck: () => ({ allow: true }),
    resolvePath: () => {
      if (badPathOnce) {
        badPathOnce = false;
        return '/../traversal'; // Step 5 early exit -> must release BOTH global & per-key slots!
      }
      return '/projects/cap/events';
    },
  });

  // Step 2 (401), Step 3 (400), Step 4 (403), Step 5 (500) early exits must ALL release reserved slots!
  assertEquals(
    (await capProxy(
      new Request('https://app.example.test/stream', { headers: { authorization: 'Basic bad' } }),
    )).status,
    401,
  );
  assertEquals(
    (await capProxy(
      new Request('https://app.example.test/stream?live=false', {
        headers: { authorization: 'Bearer s1' },
      }),
    )).status,
    400,
  );
  assertEquals(
    (await capProxy(
      new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer deny' } }),
    )).status,
    403,
  );
  assertEquals(
    (await capProxy(
      new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer s1' } }),
    )).status,
    500,
  );

  // Now open 1 reader for s1 -> succeeds (proves Step 5 freed BOTH global & s1 per-key slots!)
  const r1 = await capProxy(
    new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer s1' } }),
  );
  assertEquals(r1.status, 200);

  // 2nd concurrent reader for s1 -> 429 + Retry-After, zero upstream opened
  const openedBefore429 = upstream.totalOpened;
  const r1Dup = await capProxy(
    new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer s1' } }),
  );
  assertEquals(r1Dup.status, 429);
  assertEquals(r1Dup.headers.get('retry-after'), '5');
  assertEquals(upstream.totalOpened, openedBefore429);

  // Reader for s2 -> succeeds (200)
  const r2 = await capProxy(
    new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer s2' } }),
  );
  assertEquals(r2.status, 200);

  // 3rd reader (s3) hits maxActiveReaders: 2 BEFORE authorize -> 503 + Retry-After
  const authBefore503 = authCalls;
  const r3 = await capProxy(
    new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer s3' } }),
  );
  assertEquals(r3.status, 503);
  assertEquals(r3.headers.get('retry-after'), '5');
  assertEquals(authCalls, authBefore503);

  // Close r1 -> next request for s3 succeeds 200
  await r1.body?.cancel();
  await flushMicrotasks();
  const r3Ok = await capProxy(
    new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer s3' } }),
  );
  assertEquals(r3Ok.status, 200);
  await r2.body?.cancel();
  await r3Ok.body?.cancel();
  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);

  // 2. Wake-storm coalescing: 20 push 'recheck' wakes during an in-flight check coalesce into 1 re-fence cycle
  const stormUpstream = createControlledUpstream();
  const firstCheckPaused = createDeferred<void>();
  const firstCheckRelease = createDeferred<void>();
  let deliveryChecks = 0;
  let notifyFn: ((s?: StreamProxyRevocationSignal) => void) | undefined;

  const stormProxy = createNetScriptStreamProxy<TestGrant>({
    baseUrl: 'http://streams.internal',
    fetch: stormUpstream.fetch,
    recheckEveryMs: null,
    upstreamAuth: () => ({}),
    revocationSource: {
      subscribe(_grant, notify) {
        notifyFn = notify;
        return () => {};
      },
    },
    authorize: () => ({ allow: true, grant: { sessionId: 'storm' } }),
    recheck: async ({ reason }) => {
      if (reason === 'post-subscribe') return { allow: true };
      deliveryChecks += 1;
      if (deliveryChecks === 1) {
        firstCheckPaused.resolve();
        await firstCheckRelease.promise;
      }
      return { allow: true };
    },
    resolvePath: () => '/projects/storm/events',
  });

  const stormRes = await stormProxy(
    new Request('https://app.example.test/stream', { headers: { authorization: 'Bearer ok' } }),
  );
  const stormReader = stormRes.body!.getReader();
  stormUpstream.readers[0]!.push(
    sseDataBlock(makeStateChange('k1', { v: 1 })) + sseControlBlock({ streamNextOffset: 'o1' }),
  );
  const readP = readOneChunkText(stormReader);
  await firstCheckPaused.promise;

  // Fire 20 burst wakes while check #1 is in flight -> must coalesce into exactly 1 re-fence check (#2)!
  for (let i = 0; i < 20; i += 1) {
    notifyFn?.({ action: 'recheck' });
  }
  firstCheckRelease.resolve();
  const unit = await readP;
  assertFalse(unit.done);
  assertEquals(deliveryChecks, 2);
  await stormReader.cancel('done');
  stormReader.releaseLock();
  await flushMicrotasks();
  assertEquals(stormUpstream.activeCount, 0);
});

Deno.test('Gate 9 32-reader real DurableStreamTestServer soak: 1 update/s cadence, mid-run revocations, and offset-resume reconnects', async () => {
  const server = new DurableStreamTestServer({ port: 0 });
  const baseUrl = await server.start();
  const streamPath = '/projects/soak-real/events';
  const fullUrl = `${baseUrl}/v1/stream/netscript${streamPath}`;
  const hub = createSharedRevocationHub();
  const closedEvents: StreamProxyCloseEvent[] = [];

  type ReplayState = ReturnType<typeof createStreamSseReplayStateV1>;
  const readNextDataKeys = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    initialState: ReplayState,
  ): Promise<
    { readonly done: boolean; readonly keys: readonly string[]; readonly state: ReplayState }
  > => {
    let state = initialState;
    while (true) {
      const chunk = await readOneChunkText(reader);
      if (chunk.done) return { done: true, keys: [], state };
      const keys: string[] = [];
      for (const block of chunk.text.trim().split('\n\n')) {
        if (!block.trim()) continue;
        const lines = block.split('\n');
        const eventLine = lines.find((l) => l.startsWith('event:'));
        if (!eventLine) continue;
        const eventName = eventLine.slice(6).trim();
        const data = lines
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trim())
          .join('\n');
        const parsed = parseStreamSseEventV1({
          eventName,
          data,
          lastCommittedOffset: state.lastCommittedOffset,
        });
        assertEquals(parsed.ok, true, `failed to parse SSE block: ${block}`);
        if (!parsed.ok) continue;
        if (parsed.frame.event === 'data') {
          for (const item of parsed.frame.payload) {
            keys.push(item.key);
          }
        }
        state = reduceStreamSseReplayStateV1(state, parsed.frame).state;
      }
      if (keys.length > 0) return { done: false, keys, state };
    }
  };

  try {
    const seedRes = await fetch(fullUrl, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(makeStateChange('seed-0', { step: 0 })),
    });
    assert(seedRes.ok, `PUT seed failed: ${seedRes.status}`);
    await seedRes.body?.cancel();

    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl,
      revocationSource: hub.revocationSource,
      recheckEveryMs: null,
      maxActiveReaders: 64,
      upstreamAuth: () => ({}),
      authorize: ({ request }) => {
        const sid = (request.headers.get('authorization') ?? '').slice('Bearer '.length);
        return hub.isActive(sid)
          ? { allow: true, grant: { sessionId: sid } }
          : { allow: false, status: 401, reason: 'revoked' };
      },
      recheck: ({ grant }) =>
        hub.isActive(grant.sessionId) ? { allow: true } : { allow: false, reason: 'revoked' },
      resolvePath: () => streamPath,
      onClose: (e) => closedEvents.push(e),
    });

    const READER_COUNT = 32;
    const TOTAL_LIVE_UPDATES = 5;
    const REVOKE_BEFORE_UPDATE = 3;
    const RECONNECT_BEFORE_UPDATE = 4;
    const RECONNECT_INDICES = new Set([1, 3]);
    const CADENCE_MS = 1_000;
    const latenciesMs: number[] = [];

    const readers: Array<{
      readonly sid: string;
      readonly index: number;
      reader: ReadableStreamDefaultReader<Uint8Array>;
      replayState: ReplayState;
      readonly receivedKeys: string[];
      revoked: boolean;
    }> = [];

    for (let i = 0; i < READER_COUNT; i += 1) {
      const sid = `soak-reader-${i}`;
      const res = await proxy(
        new Request('https://app.example.test/stream?offset=-1&live=sse', {
          headers: { authorization: `Bearer ${sid}` },
        }),
      );
      assertEquals(res.status, 200);
      readers.push({
        sid,
        index: i,
        reader: res.body!.getReader(),
        replayState: createStreamSseReplayStateV1(),
        receivedKeys: [],
        revoked: false,
      });
    }

    // Drain initial seed-0 unit on all 32 readers
    await Promise.all(
      readers.map(async (r) => {
        const out = await readNextDataKeys(r.reader, r.replayState);
        assertFalse(out.done);
        r.replayState = out.state;
        r.receivedKeys.push(...out.keys);
        assert(r.replayState.lastCommittedOffset !== undefined);
      }),
    );

    // Publish 5 live updates paced at 1 update/s with mid-run revocation & mid-run offset-resume reconnects
    let lastPublishAtMs = performance.now();
    for (let u = 1; u <= TOTAL_LIVE_UPDATES; u += 1) {
      if (u === REVOKE_BEFORE_UPDATE) {
        for (const r of readers) {
          if (r.index % 2 === 0) {
            r.revoked = true;
            hub.revoke(r.sid, 'revoked');
          }
        }
        await Promise.all(
          readers
            .filter((r) => r.revoked)
            .map(async (r) => {
              const eof = await readOneChunkText(r.reader);
              assertEquals(eof.done, true);
              assertEquals(eof.text, '');
              r.reader.releaseLock();
              const retry = await proxy(
                new Request('https://app.example.test/stream', {
                  headers: { authorization: `Bearer ${r.sid}` },
                }),
              );
              assertEquals(retry.status, 401);
            }),
        );
      }

      if (u === RECONNECT_BEFORE_UPDATE) {
        await Promise.all(
          readers
            .filter((r) => RECONNECT_INDICES.has(r.index))
            .map(async (r) => {
              const resumeOffset = r.replayState.lastCommittedOffset!;
              await r.reader.cancel('mid-run-reconnect');
              r.reader.releaseLock();
              const resumedRes = await proxy(
                new Request(
                  `https://app.example.test/stream?offset=${
                    encodeURIComponent(resumeOffset)
                  }&live=sse`,
                  { headers: { authorization: `Bearer ${r.sid}` } },
                ),
              );
              assertEquals(resumedRes.status, 200);
              r.reader = resumedRes.body!.getReader();
            }),
        );
      }

      if (u > 1) {
        const waitMs = Math.max(0, CADENCE_MS - (performance.now() - lastPublishAtMs));
        if (waitMs > 0) {
          await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
        }
      }

      const activeList = readers.filter((r) => !r.revoked);
      const readPromises = activeList.map(async (r) => {
        const out = await readNextDataKeys(r.reader, r.replayState);
        return { r, out, receivedAtMs: performance.now() };
      });

      const publishStartMs = performance.now();
      lastPublishAtMs = publishStartMs;
      const postRes = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(makeStateChange(`u${u}`, { u })),
      });
      assert(postRes.ok, `POST u${u} failed: ${postRes.status}`);
      await postRes.body?.cancel();

      const results = await Promise.all(readPromises);
      for (const { r, out, receivedAtMs } of results) {
        assertFalse(out.done, `authorized reader ${r.sid} closed unexpectedly at u${u}`);
        latenciesMs.push(Math.max(0, receivedAtMs - publishStartMs));
        r.replayState = out.state;
        r.receivedKeys.push(...out.keys);
      }
    }

    // Verify exact zero-gap, zero-duplicate history on authorized readers and zero post-revocation deliveries
    for (const r of readers) {
      if (r.revoked) {
        assertEquals(r.receivedKeys, ['seed-0', 'u1', 'u2']);
        assertEquals(hub.unsubscribeCount(r.sid), 1);
      } else {
        assertEquals(r.receivedKeys, ['seed-0', 'u1', 'u2', 'u3', 'u4', 'u5']);
        await r.reader.cancel('shutdown');
        r.reader.releaseLock();
        const expectedUnsubs = RECONNECT_INDICES.has(r.index) ? 2 : 1;
        assertEquals(hub.unsubscribeCount(r.sid), expectedUnsubs);
      }
    }

    latenciesMs.sort((a, b) => a - b);
    const p95 =
      latenciesMs[Math.min(latenciesMs.length - 1, Math.floor(latenciesMs.length * 0.95))] ?? 0;
    assert(p95 < 1_000, `32-reader soak p95 delivery latency too high: ${p95.toFixed(2)}ms`);
    assertEquals(closedEvents.length, READER_COUNT + RECONNECT_INDICES.size);
  } finally {
    await stopDurableStreamTestServerCleanly(server);
  }
});

Deno.test('Gate 10: @netscript/plugin-streams-core/proxy public declarations have zero @orpc leakage', async () => {
  const entrypoint = new URL('../../proxy.ts', import.meta.url).href;
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['doc', '--json', entrypoint],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stderr = new TextDecoder().decode(output.stderr);
  assertEquals(output.code, 0, stderr);
  const raw = new TextDecoder().decode(output.stdout);
  assertFalse(raw.includes('@orpc'), '@netscript/plugin-streams-core/proxy leaks @orpc');
});
