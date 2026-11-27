import { assert, assertEquals, assertFalse, assertThrows } from '@std/assert';
import type {
  StreamProxyAdmissionContext,
  StreamProxyAuthDecision,
  StreamProxyClockPort,
  StreamProxyRecheckContext,
  StreamProxyRecheckDecision,
  StreamProxyRevocationSignal,
  StreamProxyRevocationSource,
} from '@netscript/plugin-streams-core/proxy';
import { createNetScriptChatStreamProxy } from '../src/runtime/ai/mod.ts';

class FakeClock implements StreamProxyClockPort {
  private currentMs: number;
  private nextId = 1;
  readonly timers = new Map<number, { readonly atMs: number; readonly onFire: () => void }>();

  constructor(startMs = 1_700_000_000_000) {
    this.currentMs = startMs;
  }

  nowMs(): number {
    return this.currentMs;
  }

  schedule(delayMs: number, onFire: () => void): () => void {
    const id = this.nextId++;
    const atMs = this.currentMs + Math.max(0, delayMs);
    this.timers.set(id, { atMs, onFire });
    return () => {
      this.timers.delete(id);
    };
  }

  advance(ms: number): void {
    this.currentMs += ms;
    while (true) {
      let next: [number, { readonly atMs: number; readonly onFire: () => void }] | undefined;
      for (const entry of this.timers.entries()) {
        if (entry[1].atMs <= this.currentMs) {
          if (!next || entry[1].atMs < next[1].atMs) next = entry;
        }
      }
      if (!next) break;
      this.timers.delete(next[0]);
      next[1].onFire();
    }
  }
}

class ControlledSseUpstream {
  private controller!: ReadableStreamDefaultController<Uint8Array>;
  private readonly encoder = new TextEncoder();
  cancelled = false;
  readonly stream: ReadableStream<Uint8Array>;

  constructor() {
    this.stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.controller = controller;
      },
      cancel: () => {
        this.cancelled = true;
      },
    });
  }

  push(text: string): void {
    this.controller.enqueue(this.encoder.encode(text));
  }

  close(): void {
    this.controller.close();
  }
}

function makeChatSseUnit(text: string, offset: string): string {
  const payload = JSON.stringify([{ type: 'TEXT_MESSAGE_CONTENT', delta: text }]);
  const control = JSON.stringify({ streamNextOffset: offset, upToDate: true });
  return `event: data\ndata: ${payload}\n\nevent: control\ndata: ${control}\n\n`;
}

async function readAllText(body: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!body) return '';
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let out = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      out += decoder.decode(value, { stream: true });
    }
    out += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  return out;
}

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 30; i += 1) await Promise.resolve();
}

Deno.test('Stage 4 construction validation: pairing authorize+recheck, authorized-only options, and immutable snapshots', async () => {
  // 1. Supplying only authorize or only recheck throws TypeError
  assertThrows(
    () =>
      createNetScriptChatStreamProxy({
        target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
        authorize: () => ({ allow: true, grant: { userId: 'u1' } }),
      }),
    TypeError,
    'authorize and recheck must both be provided together',
  );
  assertThrows(
    () =>
      createNetScriptChatStreamProxy({
        target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
        recheck: () => ({ allow: true }),
      }),
    TypeError,
    'authorize and recheck must both be provided together',
  );

  // 2. Non-function authorize / recheck throws TypeError
  assertThrows(
    () =>
      createNetScriptChatStreamProxy({
        target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
        authorize: 'nope' as never,
        recheck: () => ({ allow: true }),
      }),
    TypeError,
  );
  assertThrows(
    () =>
      createNetScriptChatStreamProxy({
        target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
        authorize: () => ({ allow: true, grant: 'g1' }),
        recheck: 123 as never,
      }),
    TypeError,
  );

  // 3. Passing any authorized-only option without authorize+recheck throws TypeError
  for (
    const partial of [
      { clientAuth: 'bearer' as const },
      { allowedOrigins: ['https://app.example.test'] },
      { trustProxy: () => true },
      { recheckEveryMs: 1_000 },
      { policyTimeoutMs: 1_000 },
      { clock: new FakeClock() },
    ]
  ) {
    assertThrows(
      () =>
        createNetScriptChatStreamProxy({
          target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
          ...partial,
        }),
      TypeError,
      'requires both authorize and recheck',
    );
  }

  // 4. Invalid proxy options fail fast at construction
  for (const badOrigin of [['*'], ['null'], ['https://app.example.test/path']]) {
    assertThrows(
      () =>
        createNetScriptChatStreamProxy({
          target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
          authorize: () => ({ allow: true, grant: 'g1' }),
          recheck: () => ({ allow: true }),
          allowedOrigins: badOrigin,
        }),
      TypeError,
    );
  }
  assertThrows(
    () =>
      createNetScriptChatStreamProxy({
        target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
        authorize: () => ({ allow: true, grant: 'g1' }),
        recheck: () => ({ allow: true }),
        recheckEveryMs: 10, // < 100 without injected clock
      }),
    TypeError,
  );

  // 5. Mutating allowedOrigins array after construction cannot add an attacker origin
  const mutableOrigins = ['https://trusted.example.test'];
  const handler = createNetScriptChatStreamProxy({
    target: { sessionId: 's1', baseUrl: 'http://upstream.test' },
    clientAuth: 'cookie',
    allowedOrigins: mutableOrigins,
    authorize: () => ({ allow: true, grant: 'g1' }),
    recheck: () => ({ allow: true }),
    auth: () => ({}),
    fetch: () =>
      Promise.resolve(new Response('[]', { headers: { 'content-type': 'application/json' } })),
  });
  mutableOrigins.push('https://evil.example.test');

  const denied = await handler(
    new Request('https://app.example.test/api/chat/s1', {
      method: 'GET',
      headers: {
        cookie: 'sid=1',
        origin: 'https://evil.example.test',
        'sec-fetch-site': 'cross-site',
      },
    }),
  );
  assertEquals(denied.status, 403);
  await denied.body?.cancel();
});

Deno.test('Gate 8 GET live=sse delegation: revocable chat SSE streaming, preserved overrides, and zero client credential forwarding', async () => {
  const upstream = new ControlledSseUpstream();
  let capturedReq: Request | undefined;
  let capturedAuthorizeUrl = '';
  let capturedRecheckPath = '';
  let allowed = true;
  let recheckCalls = 0;

  const handler = createNetScriptChatStreamProxy<{ readonly session: string }>({
    target: (req) => ({
      sessionId: new URL(req.url).searchParams.get('id') ?? 'missing',
      baseUrl: 'http://streams.internal:8080/tenant-a',
      headers: {
        'x-session-scope': 'scope-1',
        'authorization': 'Bearer overridden-by-auth',
      },
    }),
    streamPath: ({ target }) => `/chat/sessions/${target.sessionId}/messages?tenant=acme&live=sse`,
    auth: () => ({ Authorization: 'Bearer server-upstream-secret' }),
    clientAuth: 'bearer-or-cookie',
    authorize: (ctx) => {
      capturedAuthorizeUrl = ctx.request.url;
      assertEquals(ctx.credentialMode, 'cookie');
      return {
        allow: true,
        grant: { session: 'sess-1' },
        responseHeaders: { 'x-chat-tier': 'pro' },
        setCookies: ['__Host-refresh=rot1; Path=/; HttpOnly'],
      };
    },
    recheck: (ctx) => {
      recheckCalls += 1;
      capturedRecheckPath = ctx.streamPath;
      assertEquals(ctx.grant, { session: 'sess-1' });
      return allowed ? { allow: true } : { allow: false, reason: 'session_revoked' };
    },
    fetch: (input) => {
      assert(input instanceof Request, 'delegated fetch must receive a Request instance');
      capturedReq = input;
      return Promise.resolve(
        new Response(upstream.stream, {
          status: 200,
          headers: {
            'content-type': 'text/event-stream; charset=utf-8',
            'stream-next-offset': 'off-0',
            'access-control-allow-origin': '*',
            'set-cookie': 'upstream-leak=bad',
            'x-unlisted-header': 'drop-me',
          },
        }),
      );
    },
  });

  // Incoming request has id (dropped), colliding tenant/live (resolved wins), repeated tag=a&tag=b,
  // client Cookie (must NEVER reach upstream), and valid traceparent.
  const incomingUrl =
    'https://app.example.test/api/chat?id=sess-1&tenant=evil&live=long-poll&offset=off-0&handle=h1&tag=a&tag=b';
  const response = await handler(
    new Request(incomingUrl, {
      method: 'GET',
      headers: {
        cookie: '__Host-ns_session=client-secret-cookie',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-dest': 'empty',
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      },
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(capturedAuthorizeUrl, incomingUrl);
  assert(capturedReq !== undefined);

  // Verify ALL chat overrides were preserved on upstream Request URL & headers:
  const upstreamUrl = new URL(capturedReq.url);
  assertEquals(upstreamUrl.origin, 'http://streams.internal:8080');
  assertEquals(
    upstreamUrl.pathname,
    '/tenant-a/v1/stream/netscript/chat/sessions/sess-1/messages',
  );
  assertEquals(upstreamUrl.searchParams.get('id'), null);
  assertEquals(upstreamUrl.searchParams.getAll('tenant'), ['acme']);
  assertEquals(upstreamUrl.searchParams.getAll('live'), ['sse']);
  assertEquals(upstreamUrl.searchParams.get('offset'), 'off-0');
  assertEquals(upstreamUrl.searchParams.get('handle'), 'h1');
  assertEquals(upstreamUrl.searchParams.getAll('tag'), ['a', 'b']);

  // Server-side auth overlaid target.headers; zero client Cookie leaked upstream!
  assertEquals(capturedReq.headers.get('cookie'), null);
  assertEquals(capturedReq.headers.get('authorization'), 'Bearer server-upstream-secret');
  assertEquals(capturedReq.headers.get('x-session-scope'), 'scope-1');
  assertEquals(capturedReq.headers.get('accept'), 'text/event-stream');
  assertEquals(capturedReq.headers.get('accept-encoding'), 'identity');
  assertEquals(
    capturedReq.headers.get('traceparent'),
    '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
  );

  // 3-tier response headers enforced (unlisted/CORS/upstream Set-Cookie dropped; policy overlay kept)
  assertEquals(response.headers.get('content-type'), 'text/event-stream; charset=utf-8');
  assertEquals(response.headers.get('cache-control'), 'no-store, no-cache, no-transform');
  assertEquals(response.headers.get('x-content-type-options'), 'nosniff');
  assertEquals(response.headers.get('x-accel-buffering'), 'no');
  assertEquals(response.headers.get('stream-next-offset'), 'off-0');
  assertEquals(response.headers.get('x-chat-tier'), 'pro');
  assertEquals(response.headers.getSetCookie(), ['__Host-refresh=rot1; Path=/; HttpOnly']);
  assertEquals(response.headers.get('access-control-allow-origin'), null);
  assertEquals(response.headers.get('x-unlisted-header'), null);

  // Deliver unit 1 while authorized -> received intact; revoke before unit 2 -> withheld & EOF!
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  upstream.push(makeChatSseUnit('hello', 'off-1'));
  const first = await reader.read();
  assertFalse(first.done);
  const firstText = decoder.decode(first.value);
  assert(firstText.includes('"delta":"hello"'));
  assert(firstText.includes('"streamNextOffset":"off-1"'));
  assertEquals(capturedRecheckPath, '/chat/sessions/sess-1/messages');

  allowed = false;
  upstream.push(makeChatSseUnit('secret-after-revoke', 'off-2'));
  const second = await reader.read();
  assertEquals(second.done, true);
  assertEquals(upstream.cancelled, true);
  assertEquals(recheckCalls, 2);
  reader.releaseLock();
});

Deno.test('Gate 8 GET live=sse: push revocationSource, idle expiry on FakeClock, query hook, and duplicate live=sse rejection', async () => {
  const clock = new FakeClock();
  const listeners = new Map<string, (signal?: StreamProxyRevocationSignal) => void>();
  let unsubscribed = 0;
  const revocationSource: StreamProxyRevocationSource<{ readonly id: string }> = {
    subscribe(grant, notify) {
      listeners.set(grant.id, notify);
      return () => {
        unsubscribed += 1;
        listeners.delete(grant.id);
      };
    },
  };

  const upstreams: ControlledSseUpstream[] = [];
  const requestedUrls: string[] = [];
  let allowPostSubscribe = true;
  let allowExpiry = false;

  const handler = createNetScriptChatStreamProxy<{ readonly id: string }>({
    target: { sessionId: 's2', baseUrl: 'http://upstream.test' },
    query: (incoming) => {
      const out = new URLSearchParams();
      for (const [k, v] of incoming) {
        if (k === 'since') out.append('offset', v);
        else out.append(k, v);
      }
      return out;
    },
    auth: () => ({}),
    clientAuth: 'bearer',
    clock,
    recheckEveryMs: 5_000,
    policyTimeoutMs: 1_000,
    revocationSource,
    authorize: (ctx) => {
      assertEquals(ctx.credentialMode, 'bearer');
      const token = ctx.request.headers.get('authorization')?.slice('Bearer '.length) ?? '';
      return {
        allow: true,
        grant: { id: token },
        expiresAtMs: clock.nowMs() + 10_000,
      };
    },
    recheck: ({ reason }) => {
      if (reason === 'post-subscribe') {
        return allowPostSubscribe ? { allow: true } : { allow: false, reason: 'revoked' };
      }
      if (reason === 'expiry') {
        return allowExpiry
          ? { allow: true, expiresAtMs: clock.nowMs() + 10_000 }
          : { allow: false, reason: 'expired' };
      }
      return { allow: true };
    },
    fetch: (input) => {
      const req = input as Request;
      requestedUrls.push(req.url);
      assertEquals(req.headers.get('authorization'), null); // Client bearer NEVER forwarded!
      const u = new ControlledSseUpstream();
      upstreams.push(u);
      return Promise.resolve(
        new Response(u.stream, {
          status: 200,
          headers: { 'content-type': 'text/event-stream; charset=utf-8' },
        }),
      );
    },
  });

  // 1. Push notify({ action: 'revoked' }) closes idle reader immediately and unsubscribes once
  const res1 = await handler(
    new Request('https://app.example.test/api/chat/s2?live=sse&since=off-9', {
      headers: { authorization: 'Bearer tok-push' },
    }),
  );
  assertEquals(res1.status, 200);
  assertEquals(
    requestedUrls[0],
    'http://upstream.test/v1/stream/netscript/ai/chat/s2?live=sse&offset=off-9',
  );
  listeners.get('tok-push')!({ action: 'revoked', reason: 'logout' });
  assertEquals(await readAllText(res1.body), '');
  assertEquals(upstreams[0]!.cancelled, true);
  assertEquals(unsubscribed, 1);

  // 2. Idle expiry on FakeClock closes reader cleanly with zero pending timers
  const res2 = await handler(
    new Request('https://app.example.test/api/chat/s2?live=sse', {
      headers: { authorization: 'Bearer tok-exp' },
    }),
  );
  assertEquals(res2.status, 200);
  assertEquals(
    requestedUrls[1],
    'http://upstream.test/v1/stream/netscript/ai/chat/s2?live=sse&offset=-1',
  );
  clock.advance(10_000);
  await flushMicrotasks();
  assertEquals(await readAllText(res2.body), '');
  assertEquals(upstreams[1]!.cancelled, true);
  assertEquals(unsubscribed, 2);
  assertEquals(clock.timers.size, 0);

  // 3. Duplicate live=sse or mixed live=sse&live=long-poll cannot bypass revocable SSE -> 400
  for (const badQuery of ['?live=sse&live=sse', '?live=sse&live=long-poll', '?live=SSE']) {
    const resBad = await handler(
      new Request(`https://app.example.test/api/chat/s2${badQuery}`, {
        headers: { authorization: 'Bearer tok-bad' },
      }),
    );
    assertEquals(resBad.status, 400);
    const body = await resBad.json();
    assertEquals(body.reason, 'unsupported_live_mode');
  }
  allowPostSubscribe = false;
  allowExpiry = true;
});

Deno.test('Gate 8 POST and non-SSE GET authorized mode: CSRF/Origin, trustProxy, duplex half, header hygiene, and fail-closed redaction', async () => {
  const clock = new FakeClock();
  let authorizeCalls = 0;
  let fetchCalls = 0;
  let lastUpstreamReq: Request | undefined;
  let lastUpstreamBodyText = '';
  let nextUpstreamResponse: () => Response = () =>
    new Response(JSON.stringify({ messages: [{ id: 'm1' }] }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-encoding': 'gzip',
        'content-length': '5',
        'connection': 'keep-alive, x-dynamic-hop',
        'x-dynamic-hop': 'strip-me',
        'etag': 'W/"chat-1"',
        'stream-next-offset': 'off-55',
        'stream-up-to-date': 'true',
        'set-cookie': 'upstream-cookie=leak',
        'access-control-allow-origin': '*',
      },
    });
  let nextAuthDecision: () => unknown = () => ({
    allow: true,
    grant: { userId: 'u1' },
    responseHeaders: { 'x-auth-checked': 'yes' },
    setCookies: ['__Host-session=refreshed; Path=/; HttpOnly'],
  });

  const handler = createNetScriptChatStreamProxy({
    target: {
      sessionId: 's1',
      baseUrl: 'http://upstream.test',
      headers: { 'x-target-hdr': 'v1' },
    },
    auth: () => ({ Authorization: 'Bearer upstream-secret-xyz' }),
    allowedOrigins: ['https://allowed.example.test'],
    trustProxy: (ip) => ip === '10.0.0.1',
    policyTimeoutMs: 500,
    clock,
    authorize: async () => {
      authorizeCalls += 1;
      return await (nextAuthDecision() as ReturnType<
        NonNullable<Parameters<typeof createNetScriptChatStreamProxy>[0]['authorize']>
      >);
    },
    recheck: () => ({ allow: true }),
    fetch: async (input) => {
      fetchCalls += 1;
      const req = input as Request;
      lastUpstreamReq = req;
      lastUpstreamBodyText = req.body ? await req.text() : '';
      return nextUpstreamResponse();
    },
  });

  // 1. Cross-site cookie POST is denied 403 BEFORE authorize or fetch
  const csrfDenied = await handler(
    new Request('https://app.example.test/api/chat/s1', {
      method: 'POST',
      headers: {
        cookie: 'sid=client-cookie-secret',
        origin: 'https://evil.example.test',
        'sec-fetch-site': 'cross-site',
      },
      body: JSON.stringify({ prompt: 'hi' }),
    }),
  );
  assertEquals(csrfDenied.status, 403);
  assertEquals(authorizeCalls, 0);
  assertEquals(fetchCalls, 0);
  assertEquals((await csrfDenied.json()).reason, 'cross_site_cookie_denied');

  // 2. Malformed Authorization paired with valid Cookie -> 401 with ZERO fallback & ZERO authorize
  const badBearer = await handler(
    new Request('https://app.example.test/api/chat/s1', {
      method: 'GET',
      headers: {
        authorization: 'Basic dXNlcjpwYXNz',
        cookie: 'sid=client-cookie-secret',
        'sec-fetch-site': 'same-origin',
      },
    }),
  );
  assertEquals(badBearer.status, 401);
  assertEquals(authorizeCalls, 0);
  assertEquals((await badBearer.json()).reason, 'invalid_authorization_header');

  // 3. Trusted reverse proxy via Fresh ctx.info.remoteAddr admits same-origin forwarded cookie POST
  const postPayload = JSON.stringify({ message: 'hello world' });
  const postOk = await handler({
    req: new Request('http://internal.local/api/chat/s1?id=s1&handle=h9', {
      method: 'POST',
      headers: {
        cookie: 'sid=client-cookie-secret',
        origin: 'https://public.example.test',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'public.example.test',
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json',
      },
      body: postPayload,
    }),
    info: { remoteAddr: { transport: 'tcp', hostname: '10.0.0.1', port: 443 } },
  });
  assertEquals(postOk.status, 200);
  assertEquals(authorizeCalls, 1);
  assertEquals(fetchCalls, 1);
  assert(lastUpstreamReq !== undefined);
  assertEquals(lastUpstreamReq.method, 'POST');
  assertEquals(lastUpstreamBodyText, postPayload);
  assertEquals(lastUpstreamReq.headers.get('cookie'), null);
  assertEquals(lastUpstreamReq.headers.get('authorization'), 'Bearer upstream-secret-xyz');
  assertEquals(lastUpstreamReq.headers.get('content-type'), 'application/json');
  assertEquals(lastUpstreamReq.headers.get('accept-encoding'), 'identity');
  assertEquals(lastUpstreamReq.headers.get('x-target-hdr'), 'v1');
  assertEquals(new URL(lastUpstreamReq.url).searchParams.get('id'), null);
  assertEquals(new URL(lastUpstreamReq.url).searchParams.get('handle'), 'h9');

  // Non-SSE response headers preserved while corrupting/hop-by-hop/upstream-auth/CORS stripped!
  assertEquals(postOk.headers.get('content-type'), 'application/json');
  assertEquals(postOk.headers.get('etag'), 'W/"chat-1"');
  assertEquals(postOk.headers.get('stream-next-offset'), 'off-55');
  assertEquals(postOk.headers.get('stream-up-to-date'), 'true');
  assertEquals(postOk.headers.get('content-encoding'), null);
  assertEquals(postOk.headers.get('content-length'), null);
  assertEquals(postOk.headers.get('x-dynamic-hop'), null);
  assertEquals(postOk.headers.get('access-control-allow-origin'), null);
  assertEquals(postOk.headers.get('x-auth-checked'), 'yes');
  assertEquals(postOk.headers.getSetCookie(), ['__Host-session=refreshed; Path=/; HttpOnly']);
  assertEquals(postOk.headers.get('cache-control'), 'no-store');
  assertEquals(await postOk.json(), { messages: [{ id: 'm1' }] });

  // 4. Untrusted peer cannot spoof X-Forwarded-Host -> 403
  const spoofedFwd = await handler({
    req: new Request('http://internal.local/api/chat/s1', {
      method: 'GET',
      headers: {
        cookie: 'sid=1',
        origin: 'https://public.example.test',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'public.example.test',
      },
    }),
    info: { remoteAddr: { transport: 'tcp', hostname: '192.0.2.50', port: 12345 } },
  });
  assertEquals(spoofedFwd.status, 403);
  await spoofedFwd.body?.cancel();

  // 5. Non-SSE GET (live=long-poll) with Bearer succeeds and never leaks client Bearer upstream
  const longPollOk = await handler(
    new Request('https://app.example.test/api/chat/s1?offset=off-55&live=long-poll', {
      method: 'GET',
      headers: { authorization: 'Bearer client-user-token-secret' },
    }),
  );
  assertEquals(longPollOk.status, 200);
  assertEquals(lastUpstreamReq!.headers.get('authorization'), 'Bearer upstream-secret-xyz');
  assertEquals(new URL(lastUpstreamReq!.url).searchParams.get('live'), 'long-poll');
  await longPollOk.body?.cancel();

  // 6. Denial, expired grant, reserved policy header, throwing authorize, and timeout all fail closed redacted
  nextAuthDecision = () => ({ allow: false, status: 403, reason: 'not_chat_member' });
  const denied = await handler(
    new Request('https://app.example.test/api/chat/s1', {
      headers: { authorization: 'Bearer client-tok' },
    }),
  );
  assertEquals(denied.status, 403);
  assertEquals((await denied.json()).reason, 'not_chat_member');

  nextAuthDecision = () => ({ allow: true, grant: 'g', expiresAtMs: clock.nowMs() });
  const expired = await handler(
    new Request('https://app.example.test/api/chat/s1', {
      headers: { authorization: 'Bearer client-tok' },
    }),
  );
  assertEquals(expired.status, 401);
  assertEquals((await expired.json()).reason, 'session_expired');

  nextAuthDecision = () => ({
    allow: true,
    grant: 'g',
    responseHeaders: { 'cache-control': 'public, max-age=3600' },
  });
  const badPolicyHdr = await handler(
    new Request('https://app.example.test/api/chat/s1', {
      headers: { authorization: 'Bearer client-tok' },
    }),
  );
  assertEquals(badPolicyHdr.status, 503);
  assertEquals((await badPolicyHdr.json()).reason, 'invalid_policy_headers');

  nextAuthDecision = () => {
    throw new Error('SECRET_DB_PASSWORD_LEAK');
  };
  const thrown = await handler(
    new Request('https://app.example.test/api/chat/s1', {
      headers: { authorization: 'Bearer client-tok' },
    }),
  );
  assertEquals(thrown.status, 503);
  const thrownText = await thrown.text();
  assertFalse(thrownText.includes('SECRET_DB_PASSWORD_LEAK'));

  nextAuthDecision = () => new Promise(() => {});
  const timeoutPromise = handler(
    new Request('https://app.example.test/api/chat/s1', {
      headers: { authorization: 'Bearer client-tok' },
    }),
  );
  await flushMicrotasks();
  clock.advance(500);
  const timedOut = await timeoutPromise;
  assertEquals(timedOut.status, 503);
  assertEquals(clock.timers.size, 0);
  await timedOut.body?.cancel();

  // 7. Upstream 401/302 and unexpected text/event-stream on non-SSE GET map to redacted 502
  nextAuthDecision = () => ({ allow: true, grant: 'g' });
  nextUpstreamResponse = () => new Response('upstream secret fail', { status: 401 });
  const up401 = await handler(
    new Request('https://app.example.test/api/chat/s1', {
      headers: { authorization: 'Bearer client-tok' },
    }),
  );
  assertEquals(up401.status, 502);
  assertEquals((await up401.json()).reason, 'upstream_auth_failed');

  nextUpstreamResponse = () =>
    new Response(null, { status: 302, headers: { location: 'https://attacker.test' } });
  const up302 = await handler(
    new Request('https://app.example.test/api/chat/s1', {
      headers: { authorization: 'Bearer client-tok' },
    }),
  );
  assertEquals(up302.status, 502);
  assertEquals((await up302.json()).reason, 'upstream_redirect_blocked');

  nextUpstreamResponse = () =>
    new Response('event: data\ndata: []\n\n', {
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
    });
  const unexpectedSse = await handler(
    new Request('https://app.example.test/api/chat/s1?live=long-poll', {
      headers: { authorization: 'Bearer client-tok' },
    }),
  );
  assertEquals(unexpectedSse.status, 502);
  assertEquals((await unexpectedSse.json()).reason, 'unexpected_sse_response');
});

Deno.test('Gate 8 concurrent GET live=sse requests isolate per-request target.baseUrl and target.headers', async () => {
  const upstreamA = new ControlledSseUpstream();
  const upstreamB = new ControlledSseUpstream();
  const seen = new Map<string, { readonly url: string; readonly tenant: string | null }>();

  const handler = createNetScriptChatStreamProxy<{ readonly id: string }>({
    target: (req) => {
      const id = new URL(req.url).searchParams.get('id')!;
      return {
        sessionId: id,
        baseUrl: id === 'a' ? 'http://host-a.test' : 'http://host-b.test',
        headers: { 'x-tenant': id === 'a' ? 'tenant-a' : 'tenant-b' },
      };
    },
    auth: () => ({}),
    authorize: (ctx) => ({
      allow: true,
      grant: { id: new URL(ctx.request.url).searchParams.get('id')! },
    }),
    recheck: () => ({ allow: true }),
    fetch: (input) => {
      const req = input as Request;
      const isA = req.url.startsWith('http://host-a.test');
      seen.set(isA ? 'a' : 'b', { url: req.url, tenant: req.headers.get('x-tenant') });
      return Promise.resolve(
        new Response(isA ? upstreamA.stream : upstreamB.stream, {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }),
      );
    },
  });

  const [resA, resB] = await Promise.all([
    handler(
      new Request('https://app.example.test/api/chat?id=a&live=sse', {
        headers: { authorization: 'Bearer tok-a' },
      }),
    ),
    handler(
      new Request('https://app.example.test/api/chat?id=b&live=sse', {
        headers: { authorization: 'Bearer tok-b' },
      }),
    ),
  ]);

  assertEquals(resA.status, 200);
  assertEquals(resB.status, 200);
  assertEquals(seen.get('a'), {
    url: 'http://host-a.test/v1/stream/netscript/ai/chat/a?live=sse&offset=-1',
    tenant: 'tenant-a',
  });
  assertEquals(seen.get('b'), {
    url: 'http://host-b.test/v1/stream/netscript/ai/chat/b?live=sse&offset=-1',
    tenant: 'tenant-b',
  });

  upstreamA.push(makeChatSseUnit('from-a', 'a-1'));
  upstreamA.close();
  upstreamB.push(makeChatSseUnit('from-b', 'b-1'));
  upstreamB.close();

  const [textA, textB] = await Promise.all([readAllText(resA.body), readAllText(resB.body)]);
  assert(textA.includes('"delta":"from-a"') && !textA.includes('from-b'));
  assert(textB.includes('"delta":"from-b"') && !textB.includes('from-a'));

  // Structural compatibility check: hooks typed directly with @netscript/plugin-streams-core/proxy types assign cleanly.
  const typedAuthorize = (
    _ctx: StreamProxyAdmissionContext,
  ): StreamProxyAuthDecision<{ readonly id: string }> => ({ allow: true, grant: { id: 'typed' } });
  const typedRecheck = (
    _ctx: StreamProxyRecheckContext<{ readonly id: string }>,
  ): StreamProxyRecheckDecision => ({ allow: true });
  const typedProxy = createNetScriptChatStreamProxy({
    target: { sessionId: 's-typed', baseUrl: 'http://upstream.test' },
    authorize: typedAuthorize,
    recheck: typedRecheck,
  });
  assert(typeof typedProxy === 'function');
});

Deno.test('Gate 8 live HTTP upstream: authorized POST duplex:half and redacted upstream 401 cleanly release HTTP resources', async () => {
  const controller = new AbortController();
  const server = Deno.serve(
    { hostname: '127.0.0.1', port: 0, signal: controller.signal, onListen() {} },
    async (req) => {
      assertEquals(req.headers.get('cookie'), null);
      assertEquals(req.headers.get('authorization'), 'Bearer server-only-secret');
      assertEquals(req.headers.get('accept-encoding'), 'identity');
      if (new URL(req.url).searchParams.get('fail') === '401') {
        return new Response('upstream-secret-failure', { status: 401 });
      }
      const bodyText = await req.text();
      return new Response(JSON.stringify({ echoed: bodyText }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-encoding': 'gzip',
          'stream-next-offset': 'live-1',
        },
      });
    },
  );

  try {
    const { port } = server.addr as Deno.NetAddr;
    const handler = createNetScriptChatStreamProxy({
      target: { sessionId: 'live-chat', baseUrl: `http://127.0.0.1:${port}` },
      auth: () => ({ Authorization: 'Bearer server-only-secret' }),
      authorize: () => ({ allow: true, grant: { session: 'live-chat' } }),
      recheck: () => ({ allow: true }),
    });

    // 1. Streaming ReadableStream POST body (exercises real duplex: 'half') + gzip-mislabel fence
    const streamBody = new ReadableStream<Uint8Array>({
      start(ctrl) {
        ctrl.enqueue(new TextEncoder().encode('{"turn":1}'));
        ctrl.close();
      },
    });
    const postRes = await handler(
      new Request('https://app.example.test/api/chat/live-chat', {
        method: 'POST',
        headers: {
          authorization: 'Bearer client-user-token',
          cookie: 'sid=client-cookie-never-forwarded',
          'content-type': 'application/json',
        },
        body: streamBody,
      }),
    );
    assertEquals(postRes.status, 200);
    assertEquals(postRes.headers.get('content-encoding'), null);
    assertEquals(postRes.headers.get('stream-next-offset'), 'live-1');
    assertEquals(await postRes.json(), { echoed: '{"turn":1}' });

    // 2. Real HTTP upstream 401 cancels body cleanly (0 Deno resource leaks) and returns redacted 502
    const errRes = await handler(
      new Request('https://app.example.test/api/chat/live-chat?fail=401', {
        method: 'GET',
        headers: { authorization: 'Bearer client-user-token' },
      }),
    );
    assertEquals(errRes.status, 502);
    const errText = await errRes.text();
    assertFalse(errText.includes('upstream-secret-failure'));
    assertEquals(JSON.parse(errText).reason, 'upstream_auth_failed');
  } finally {
    controller.abort();
    await server.finished.catch(() => undefined);
  }
});
