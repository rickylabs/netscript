import { assert, assertEquals, assertStrictEquals } from '@std/assert';
import { os } from '@orpc/server';
import { type CorsOptions, createOpenAPIHandler, createRPCHandler, createService } from '../mod.ts';
import { createStaticCredentialAuthenticator } from '../src/auth/mod.ts';

function test(name: string, fn: Deno.TestDefinition['fn']): void {
  Deno.test({ name, fn, sanitizeOps: true, sanitizeResources: true, sanitizeExit: true });
}

const allowed = 'https://app.example';
const hostile = 'https://hostile.example';
const origins = [allowed, hostile, `${allowed}.attacker.example`, 'null', undefined];
const cookies = ['first=1; Path=/; HttpOnly', 'second=2; Path=/; SameSite=Lax'];
const payload = 'data: first\n\ndata: second\n\n';
const headers = [
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-expose-headers',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-max-age',
];
const router = os.router({
  ping: os.handler(() => ({ ok: true })),
  status: os.route({ method: 'GET', path: '/status' }).handler(() => ({ ok: true })),
  boom: os.handler(() => {
    throw new Error('procedure failure');
  }),
});

function policy(credentials = true): NonNullable<CorsOptions> {
  return {
    origin: [allowed],
    credentials,
    exposeHeaders: credentials ? ['X-Trace'] : [],
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  };
}

function upstream(vary = 'origin, Accept-Encoding'): Response {
  const responseHeaders = new Headers({
    'access-control-allow-origin': '*',
    'access-control-allow-credentials': 'true',
    'access-control-expose-headers': 'Stream-Next-Offset',
    'access-control-allow-methods': 'GET, POST',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '600',
    vary,
    'stream-next-offset': '42',
    'content-type': 'text/event-stream',
    etag: '"upstream"',
  });
  for (const cookie of cookies) responseHeaders.append('set-cookie', cookie);
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(payload.slice(0, 13)));
      controller.enqueue(new TextEncoder().encode(payload.slice(13)));
      controller.close();
    },
  });
  return new Response(body, {
    status: 202,
    statusText: 'Upstream Accepted',
    headers: responseHeaders,
  });
}

function fixture(options: CorsOptions | false = policy()) {
  const calls = { authn: 0, authz: 0, handler: 0 };
  const observed: {
    body: ReadableStream<Uint8Array> | null;
    bytes?: ArrayBuffer;
    statusText?: string;
  } = { body: null };
  const staticAuthenticator = createStaticCredentialAuthenticator({
    credentials: { fixture: { subject: 'test', scopes: [], roles: [] } },
  });
  const builder = createService(router, { name: 'cors-authority' });
  if (options !== false) builder.withCors(options);
  const app = builder.use(async (c, next) => {
    if (c.req.path === '/middleware') {
      c.header('access-control-allow-origin', '*');
      return c.text('middleware');
    }
    await next();
    observed.bytes = await c.res.clone().arrayBuffer();
    observed.statusText = c.res.statusText;
    observed.body = c.res.body;
    return;
  }).withAuthn({
    protect: ['/api'],
    authenticator: {
      authenticate(request) {
        calls.authn++;
        if (request.path === '/api/unavailable') throw new Error('authenticator failure');
        return staticAuthenticator.authenticate(request);
      },
    },
  }).withAuthz({
    authorizer: {
      authorize(request) {
        calls.authz++;
        return request.path === '/api/deny'
          ? { allow: false, reason: 'fixture-denied' }
          : { allow: true };
      },
    },
  }).withBodyLimit({ maxBytes: 64 }).withHealth().withRPC()
    .route('get', '/raw', () => {
      calls.handler++;
      return upstream();
    })
    .route('get', '/raw-no-origin-vary', () => upstream('Accept-Encoding'))
    .route('get', '/redirect', () => Response.redirect('https://destination.example/', 302))
    .route('get', '/cookie', (c) => {
      for (const cookie of cookies) c.header('set-cookie', cookie, { append: true });
      return c.text('cookie');
    })
    .route('get', '/error', () => {
      throw new Error('raw failure');
    })
    .build();
  return { app, calls, observed };
}

function corsValues(response: Response): Array<string | null> {
  return headers.map((name) => response.headers.get(name));
}

function assertVary(response: Response, expected: string[]): void {
  const tokens = response.headers.get('vary')?.split(',').map((token) => token.trim()) ?? [];
  assertEquals(tokens.map((token) => token.toLowerCase()).sort(), [...expected].sort());
}

function requestHeaders(origin?: string): Headers {
  const result = new Headers({
    authorization: 'Bearer fixture',
    'content-type': 'application/json',
  });
  if (origin !== undefined) result.set('origin', origin);
  return result;
}

interface Surface {
  path: string;
  status: number;
  method?: string;
  body?: string;
  unauthenticated?: boolean;
  text?: string;
}

const surfaces: Surface[] = [
  { path: '/api/rpc/ping', method: 'POST', body: '{}', status: 200, text: '{"json":{"ok":true}}' },
  { path: '/api/status', status: 200, text: '{"ok":true}' },
  { path: '/raw', status: 202, text: payload },
  { path: '/raw', method: 'HEAD', status: 202, text: '' },
  { path: '/redirect', status: 302, text: '' },
  { path: '/cookie', status: 200, text: 'cookie' },
  { path: '/health', status: 200 },
  { path: '/missing', status: 404 },
  { path: '/api/rpc/boom', method: 'POST', body: '{}', status: 500 },
  { path: '/error', status: 500 },
  { path: '/api/status', unauthenticated: true, status: 401 },
  { path: '/api/deny', status: 403 },
  { path: '/api/unavailable', status: 503 },
  { path: '/api/rpc/ping', method: 'POST', body: 'x'.repeat(65), status: 413 },
  { path: '/middleware', status: 200, text: 'middleware' },
];

for (const credentials of [true, false]) {
  test(`CORS authority covers every response (credentials=${credentials})`, async (t) => {
    const { app, observed } = fixture(policy(credentials));
    for (const origin of origins) {
      for (const surface of surfaces) {
        await t.step(
          `${origin ?? 'absent'} ${surface.method ?? 'GET'} ${surface.path} ${surface.status}`,
          async () => {
            const reqHeaders = requestHeaders(origin);
            if (surface.unauthenticated) reqHeaders.delete('authorization');
            const response = await app.request(surface.path, {
              method: surface.method,
              body: surface.body,
              headers: reqHeaders,
            });
            assertEquals(response.status, surface.status);
            assertEquals(corsValues(response), [
              origin === allowed ? allowed : null,
              credentials ? 'true' : null,
              credentials ? 'X-Trace' : null,
              null,
              null,
              null,
            ]);
            assertVary(
              response,
              surface.path === '/raw' ? ['origin', 'accept-encoding'] : ['origin'],
            );
            if (surface.path === '/raw') {
              assertEquals(response.statusText, 'Upstream Accepted');
              assertEquals(response.headers.get('content-type'), 'text/event-stream');
              assertEquals(response.headers.get('stream-next-offset'), '42');
              assertEquals(response.headers.get('etag'), '"upstream"');
              if (surface.method !== 'HEAD') assertStrictEquals(response.body, observed.body);
            }
            assertEquals(
              response.headers.getSetCookie(),
              ['/raw', '/cookie'].includes(surface.path) ? cookies : [],
            );
            if (surface.path === '/redirect') {
              assertEquals(response.headers.get('location'), 'https://destination.example/');
            }
            const body = await response.text();
            if (surface.path !== '/middleware') {
              assertEquals(response.statusText, observed.statusText);
              if (surface.method !== 'HEAD') {
                assertEquals(new TextEncoder().encode(body).buffer, observed.bytes);
              }
            }
            if (surface.text !== undefined) assertEquals(body, surface.text);
            else {
              assert(body.length > 0);
              if (surface.path === '/health') assertEquals(JSON.parse(body).status, 'healthy');
              else {
                assert(body.includes(
                  surface.status === 500
                    ? 'INTERNAL'
                    : surface.status === 404
                    ? 'NOT_FOUND'
                    : surface.status === 401
                    ? 'UNAUTHORIZED'
                    : surface.status === 403
                    ? 'FORBIDDEN'
                    : surface.status === 503
                    ? 'SERVICE_UNAVAILABLE'
                    : 'PAYLOAD_TOO_LARGE',
                ));
              }
            }
          },
        );
      }
    }
  });
}

test('CORS native preflight short-circuits all surfaces before authentication', async (t) => {
  for (const credentials of [true, false]) {
    const { app, calls } = fixture(policy(credentials));
    for (const origin of origins) {
      for (const path of ['/api/rpc/ping', '/api/status', '/raw', '/health']) {
        await t.step(`${credentials} ${origin ?? 'absent'} ${path}`, async () => {
          const reqHeaders = requestHeaders(origin);
          reqHeaders.delete('authorization');
          reqHeaders.set('access-control-request-method', 'POST');
          reqHeaders.set('access-control-request-headers', 'Authorization,Content-Type');
          const response = await app.request(path, { method: 'OPTIONS', headers: reqHeaders });
          assertEquals(response.status, 204);
          assertEquals(await response.text(), '');
          assertEquals(corsValues(response), [
            origin === allowed ? allowed : null,
            credentials ? 'true' : null,
            credentials ? 'X-Trace' : null,
            'GET,POST',
            'Authorization,Content-Type',
            '600',
          ]);
          // Native Hono varies on request headers even when allowHeaders is configured.
          assertVary(response, ['origin', 'access-control-request-headers']);
          assertEquals(calls, { authn: 0, authz: 0, handler: 0 });
        });
      }
    }
  }
  const { app } = fixture({ origin: [allowed] });
  const response = await app.request('/raw', {
    method: 'OPTIONS',
    headers: { origin: allowed, 'access-control-request-headers': 'X-Requested' },
  });
  assertEquals(corsValues(response), [
    allowed,
    null,
    null,
    'GET,HEAD,PUT,POST,DELETE,PATCH,QUERY',
    'X-Requested',
    null,
  ]);
  assertVary(response, ['origin', 'access-control-request-headers']);
  assertEquals(await response.text(), '');
});

test('CORS wildcard preserves supplied Vary without forcing Origin', async () => {
  const { app } = fixture({ origin: '*' });
  for (const origin of origins) {
    for (const path of ['/api/rpc/ping', '/api/status', '/raw', '/raw-no-origin-vary']) {
      const response = await app.request(path, {
        headers: requestHeaders(origin),
        ...(path.includes('/rpc/') ? { method: 'POST', body: '{}' } : {}),
      });
      assertEquals(corsValues(response), ['*', null, null, null, null, null]);
      // oRPC and /raw supply Origin; native wildcard policy does not invent or remove it.
      assertVary(
        response,
        path === '/raw-no-origin-vary'
          ? ['accept-encoding']
          : path === '/raw'
          ? ['origin', 'accept-encoding']
          : ['origin'],
      );
      assertEquals(
        await response.text(),
        path.startsWith('/raw')
          ? payload
          : path.includes('/rpc/')
          ? '{"json":{"ok":true}}'
          : '{"ok":true}',
      );
    }
  }
});

test('CORS Vary union retains checkpoint tokens, first spelling, and wildcard', async () => {
  const app = createService({}, { name: 'vary-union' })
    .use(async (c, next) => {
      c.header('vary', 'Accept-Encoding', { append: true });
      await next();
    }).withCors({ origin: [allowed] })
    .route('get', '/overwrite', (c) => {
      c.header('vary', 'Cookie');
      return c.text('overwrite');
    })
    .route('get', '/dedupe', (c) => {
      c.header('vary', 'Cookie, cookie, ACCEPT-ENCODING, origin');
      return c.text('dedupe');
    })
    .route('get', '/response', () => new Response('response', { headers: { vary: 'Cookie' } }))
    .route('get', '/star', (c) => {
      c.header('vary', 'Cookie, *, Origin');
      return c.text('star');
    }).build();
  for (
    const [path, vary] of [
      ['/overwrite', 'Accept-Encoding, Cookie, Origin'],
      ['/dedupe', 'Accept-Encoding, Cookie, origin'],
      // Hono's own response setter lets the placeholder win over returned Response headers.
      ['/response', 'Accept-Encoding, Origin'],
      ['/star', '*'],
    ]
  ) {
    const response = await app.request(path, { headers: { origin: allowed } });
    assertEquals(response.headers.get('vary'), vary);
    assertEquals(corsValues(response), [allowed, null, null, null, null, null]);
    assertEquals(await response.text(), path.slice(1));
  }
});

test('CORS resolves once and rejects async credentialed wildcard on real projections', async () => {
  for (const wildcard of [false, true]) {
    let calls = 0;
    const { app } = fixture({
      credentials: true,
      origin: async (origin) => {
        calls++;
        await Promise.resolve();
        return wildcard ? '*' : origin === allowed ? origin : null;
      },
    });
    for (const path of ['/api/rpc/ping', '/api/status', '/raw']) {
      for (const origin of origins) {
        const before = calls;
        const response = await app.request(path, {
          headers: requestHeaders(origin),
          ...(path.includes('/rpc/') ? { method: 'POST', body: '{}' } : {}),
        });
        assertEquals(calls, before + 1);
        assertEquals(corsValues(response), [
          !wildcard && origin === allowed ? allowed : null,
          'true',
          null,
          null,
          null,
          null,
        ]);
        await response.arrayBuffer();
      }
    }
  }
});

test('CORS snapshots environment and caller arrays before requests', async () => {
  const previous = Deno.env.get('NETSCRIPT_CORS_ORIGINS');
  try {
    Deno.env.set('NETSCRIPT_CORS_ORIGINS', allowed);
    const { app } = fixture({});
    Deno.env.set('NETSCRIPT_CORS_ORIGINS', hostile);
    const options = policy();
    const explicit = fixture(options);
    options.exposeHeaders?.push('Mutated');
    options.allowHeaders?.push('Mutated');
    options.allowMethods = ['DELETE'];
    if (Array.isArray(options.origin)) options.origin.push(hostile);
    for (const path of ['/api/rpc/ping', '/raw']) {
      for (const origin of [allowed, hostile]) {
        for (const [target, credentials] of [[app, false], [explicit.app, true]] as const) {
          const response = await target.request(path, {
            headers: requestHeaders(origin),
            ...(path.includes('/rpc/') ? { method: 'POST', body: '{}' } : {}),
          });
          assertEquals(corsValues(response), [
            origin === allowed ? allowed : null,
            credentials ? 'true' : null,
            credentials ? 'X-Trace' : null,
            null,
            null,
            null,
          ]);
          await response.arrayBuffer();
        }
      }
    }
    const preflight = await explicit.app.request('/raw', {
      method: 'OPTIONS',
      headers: { origin: allowed },
    });
    assertEquals(corsValues(preflight), [
      allowed,
      'true',
      'X-Trace',
      'GET,POST',
      'Authorization,Content-Type',
      '600',
    ]);
    await preflight.arrayBuffer();
  } finally {
    if (previous === undefined) Deno.env.delete('NETSCRIPT_CORS_ORIGINS');
    else Deno.env.set('NETSCRIPT_CORS_ORIGINS', previous);
  }
});

test('no withCors and standalone RPC/OpenAPI preserve their existing CORS boundary', async () => {
  const { app } = fixture(false);
  const raw = await app.request('/raw', { headers: { origin: hostile } });
  assertEquals(corsValues(raw), [
    '*',
    'true',
    'Stream-Next-Offset',
    'GET, POST',
    'authorization, content-type',
    '600',
  ]);
  assertVary(raw, ['origin', 'accept-encoding']);
  assertEquals(raw.headers.getSetCookie(), cookies);
  assertEquals(await raw.text(), payload);
  for (const origin of [hostile, undefined]) {
    const req = new Request('http://localhost/api/rpc/ping', {
      method: 'POST',
      headers: requestHeaders(origin),
      body: '{}',
    });
    const rpc = await createRPCHandler(router).handle(req, { prefix: '/api/rpc' });
    const rest = await createOpenAPIHandler(router).handle(
      new Request('http://localhost/api/status', { headers: requestHeaders(origin) }),
      { prefix: '/api' },
    );
    const built = await app.request('/api/rpc/ping', {
      method: 'POST',
      headers: requestHeaders(origin),
      body: '{}',
    });
    for (const response of [rpc.response, rest.response, built]) {
      assert(response);
      assertEquals(response.status, 200);
      assertEquals(corsValues(response), [origin ?? '', null, null, null, null, null]);
      assertVary(response, ['origin']);
      await response.arrayBuffer();
    }
  }
});
