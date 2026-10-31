import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { type Context, Hono } from 'hono';
import { createAuthnMiddleware, createAuthzMiddleware } from '../../src/auth/auth-middleware.ts';
import type { ProcedurePolicyResolver } from '../../src/auth/contract/contract-policy.ts';
import type { AuthenticatorPort, AuthorizerPort, Principal } from '../../src/auth/types.ts';
import type { AnonymousRule, AuthnOptions } from '../../src/auth/mod.ts';

type AuthTestEnv = {
  Variables: {
    principal: Principal;
  };
};

const principal: Principal = {
  subject: 'user:1',
  scopes: ['users:read'],
  roles: ['admin'],
  scheme: 'custom',
  claims: {},
};

for (const asynchronous of [false, true]) {
  Deno.test(`authn verifier ${asynchronous ? 'rejection' : 'throw'} is redacted 503, not invalid credentials`, async () => {
    let reached = false;
    const app = new Hono<AuthTestEnv>();
    app.use(
      '*',
      createAuthnMiddleware({
        authenticator: {
          authenticate: () => {
            const error = new Error('synthetic-private-verifier-detail');
            if (asynchronous) return Promise.reject(error);
            throw error;
          },
        },
      }),
    );
    app.get('/api/users', (c) => {
      reached = true;
      return c.json({ reached });
    });
    const response = await app.request('/api/users');
    assertEquals(response.status, 503);
    assertEquals(await response.json(), {
      error: 'SERVICE_UNAVAILABLE',
      message: 'Authentication service unavailable',
    });
    assertEquals(reached, false);
    assertEquals(response.headers.has('set-cookie'), false);
  });
}

Deno.test('authn preserves downstream error-handler ownership after authentication', async () => {
  const app = new Hono<AuthTestEnv>();
  app.use(
    '*',
    createAuthnMiddleware({
      authenticator: { authenticate: () => ({ ok: true, principal }) },
    }),
  );
  app.onError((_error, c) => c.json({ error: 'downstream-owned' }, 502));
  app.get('/api/users', () => {
    throw new Error('downstream failure');
  });
  const response = await app.request('/api/users');
  assertEquals(response.status, 502);
  assertEquals(await response.json(), { error: 'downstream-owned' });
});

Deno.test('authn does not catch a downstream next rejection', async () => {
  const app = new Hono<AuthTestEnv>();
  let captured: Context | undefined;
  app.get('/api/users', (c) => {
    captured = c;
    return c.json({ captured: true });
  });
  await app.request('/api/users');
  const middleware = createAuthnMiddleware({
    authenticator: { authenticate: () => ({ ok: true, principal }) },
  });
  await assertRejects(
    async () => {
      await middleware(captured!, () => Promise.reject(new Error('downstream-owned')));
    },
    Error,
    'downstream-owned',
  );
});

Deno.test('authn middleware returns 401 for guarded path rejection', async () => {
  const authenticator: AuthenticatorPort = {
    authenticate: () => ({ ok: false, reason: 'invalid-credential' }),
  };
  const app = new Hono<AuthTestEnv>();
  app.use('*', createAuthnMiddleware({ authenticator }));
  app.get('/api/users', (c) => c.json({ reached: true }));

  const response = await app.request('/api/users');
  const body = await response.json();

  assertEquals(response.status, 401);
  assertEquals(body, { error: 'UNAUTHORIZED', message: 'invalid-credential' });
});

Deno.test('authn middleware sets principal and calls next on success', async () => {
  const authenticator: AuthenticatorPort = {
    authenticate: () => ({ ok: true, principal }),
  };
  const app = new Hono<AuthTestEnv>();
  app.use('*', createAuthnMiddleware({ authenticator }));
  app.get('/api/users', (c) => c.json({ subject: c.get('principal').subject }));

  const response = await app.request('/api/users');
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body, { subject: 'user:1' });
});

Deno.test('authn middleware exposes full headers and cookies to authenticators', async () => {
  let observedHeader: string | undefined;
  let observedCookie: string | undefined;
  let observedHeaders: string | undefined;
  const authenticator: AuthenticatorPort = {
    authenticate: (request) => {
      observedHeader = request.header('x-session-id');
      observedCookie = request.cookie('sid');
      observedHeaders = request.headers().get('x-session-id') ?? undefined;
      return { ok: true, principal };
    },
  };
  const app = new Hono<AuthTestEnv>();
  app.use('*', createAuthnMiddleware({ authenticator }));
  app.get('/api/users', (c) => c.json({ ok: true }));

  const response = await app.request('/api/users', {
    headers: {
      cookie: 'sid=session-123; theme=dark',
      'x-session-id': 'header-session',
    },
  });

  assertEquals(response.status, 200);
  assertEquals(observedHeader, 'header-session');
  assertEquals(observedCookie, 'session-123');
  assertEquals(observedHeaders, 'header-session');
});

Deno.test('authn middleware applies response headers and Set-Cookie values on success', async () => {
  const authenticator: AuthenticatorPort = {
    authenticate: () => ({
      ok: true,
      principal,
      responseHeaders: { 'x-auth-refresh': 'rotated' },
      setCookies: [
        'sid=session-456; Path=/; HttpOnly',
        'csrf=csrf-456; Path=/; SameSite=Lax',
      ],
    }),
  };
  const app = new Hono<AuthTestEnv>();
  app.use('*', createAuthnMiddleware({ authenticator }));
  app.get('/api/users', (c) => c.json({ ok: true }));

  const response = await app.request('/api/users');

  assertEquals(response.status, 200);
  assertEquals(response.headers.get('x-auth-refresh'), 'rotated');
  const setCookie = response.headers.get('set-cookie') ?? '';
  assertEquals(setCookie.includes('sid=session-456'), true);
  assertEquals(setCookie.includes('csrf=csrf-456'), true);
});

Deno.test('authn middleware bypasses anonymous health paths', async () => {
  let calls = 0;
  const authenticator: AuthenticatorPort = {
    authenticate: () => {
      calls += 1;
      return { ok: false, reason: 'should-not-run' };
    },
  };
  const app = new Hono<AuthTestEnv>();
  app.use('*', createAuthnMiddleware({ authenticator }));
  app.get('/health', (c) => c.json({ ok: true }));

  const response = await app.request('/health');

  assertEquals(response.status, 200);
  assertEquals(calls, 0);
});

Deno.test('authz middleware returns 401 when principal is missing on guarded path', async () => {
  const authorizer: AuthorizerPort = {
    authorize: () => ({ allow: true }),
  };
  const app = new Hono<AuthTestEnv>();
  app.use('*', createAuthzMiddleware({ authorizer }));
  app.get('/api/users', (c) => c.json({ reached: true }));

  const response = await app.request('/api/users');
  const body = await response.json();

  assertEquals(response.status, 401);
  assertEquals(body, { error: 'UNAUTHORIZED', message: 'missing-principal' });
});

Deno.test('authz middleware returns 403 when authorizer denies', async () => {
  const authorizer: AuthorizerPort = {
    authorize: () => ({ allow: false, reason: 'authz.missing-scope:users:write' }),
  };
  const app = new Hono<AuthTestEnv>();
  app.use('*', async (c, next) => {
    c.set('principal', principal);
    await next();
  });
  app.use('*', createAuthzMiddleware({ authorizer }));
  app.get('/api/users', (c) => c.json({ reached: true }));

  const response = await app.request('/api/users');
  const body = await response.json();

  assertEquals(response.status, 403);
  assertEquals(body, { error: 'FORBIDDEN', message: 'authz.missing-scope:users:write' });
});

Deno.test('authz middleware calls next when authorizer allows', async () => {
  const authorizer: AuthorizerPort = {
    authorize: () => ({ allow: true }),
  };
  const app = new Hono<AuthTestEnv>();
  app.use('*', async (c, next) => {
    c.set('principal', principal);
    await next();
  });
  app.use('*', createAuthzMiddleware({ authorizer }));
  app.get('/api/users', (c) => c.json({ ok: true }));

  const response = await app.request('/api/users');
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body, { ok: true });
});

Deno.test('authz middleware fails closed when authorizer throws', async () => {
  const authorizer: AuthorizerPort = {
    authorize: () => {
      throw new Error('policy backend unavailable');
    },
  };
  const app = new Hono<AuthTestEnv>();
  app.use('*', async (c, next) => {
    c.set('principal', principal);
    await next();
  });
  app.use('*', createAuthzMiddleware({ authorizer }));
  app.get('/api/users', (c) => c.json({ ok: true }));

  const response = await app.request('/api/users');
  const body = await response.json();

  assertEquals(response.status, 403);
  assertEquals(body, { error: 'FORBIDDEN', message: 'authz.error' });
});

Deno.test('one contract resolver makes a declared public procedure bypass authn and authz', async () => {
  let resolverCalls = 0;
  let authenticatorCalls = 0;
  let authorizerCalls = 0;
  const resolver: ProcedurePolicyResolver = {
    resolve: () => {
      resolverCalls += 1;
      return {
        matched: true,
        policy: { authentication: 'none', requiredScopes: [], requiredRoles: [] },
      };
    },
  };
  const authenticator: AuthenticatorPort = {
    authenticate: () => {
      authenticatorCalls += 1;
      return { ok: false, reason: 'should-not-run' };
    },
  };
  const authorizer: AuthorizerPort = {
    authorize: () => {
      authorizerCalls += 1;
      return { allow: false, reason: 'should-not-run' };
    },
  };
  const app = new Hono<AuthTestEnv>();
  app.use('*', createAuthnMiddleware({ authenticator, policyResolver: resolver }));
  app.use('*', createAuthzMiddleware({ authorizer, policyResolver: resolver }));
  app.get('/api/public', (c) => c.json({ public: true }));

  const response = await app.request('/api/public');

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { public: true });
  assertEquals(resolverCalls, 2);
  assertEquals(authenticatorCalls, 0);
  assertEquals(authorizerCalls, 0);
});

Deno.test('authn middleware guards a matched required procedure outside legacy prefixes', async () => {
  let authenticatorCalls = 0;
  const resolver: ProcedurePolicyResolver = {
    resolve: () => ({
      matched: true,
      policy: { authentication: 'required', requiredScopes: [], requiredRoles: [] },
    }),
  };
  const authenticator: AuthenticatorPort = {
    authenticate: () => {
      authenticatorCalls += 1;
      return { ok: false, reason: 'missing-credential' };
    },
  };
  const app = new Hono<AuthTestEnv>();
  app.use('*', createAuthnMiddleware({ authenticator, policyResolver: resolver }));
  app.get('/transport/v1/read', (c) => c.json({ reached: true }));

  const response = await app.request('/transport/v1/read');

  assertEquals(response.status, 401);
  assertEquals(authenticatorCalls, 1);
});

function exactTest(name: string, fn: Deno.TestDefinition['fn']): void {
  Deno.test({ name, fn, sanitizeOps: true, sanitizeResources: true, sanitizeExit: true });
}

exactTest('exact anonymous rules validate in both middleware factories', () => {
  const invalid = [
    { method: 'get', path: '/health' },
    { method: 'OPTIONS', path: '/health' },
    { method: 'ALL', path: '/health' },
    ...[
      'health',
      '/health/',
      '//health',
      '/he%61lth',
      '/health*',
      '/health?x',
      '/health#f',
      '/health/{id}',
      '/health :x',
      '/health\\x',
      '',
    ].map((path) => ({ method: 'GET', path })),
  ];
  for (const rule of invalid) {
    const options: AuthnOptions = {
      authenticator: { authenticate: () => ({ ok: true, principal }) },
    };
    Object.defineProperty(options, 'allowAnonymous', { value: [rule] });
    assertThrows(() => createAuthnMiddleware(options), TypeError, 'invalid anonymous request');
    const authorizer: AuthorizerPort = { authorize: () => ({ allow: true }) };
    const authz = { authorizer };
    Object.defineProperty(authz, 'allowAnonymous', { value: [rule] });
    assertThrows(() => createAuthzMiddleware(authz), TypeError, 'invalid anonymous request');
  }
  for (const factory of [createAuthnMiddleware, createAuthzMiddleware]) {
    factory({
      authenticator: { authenticate: () => ({ ok: true, principal }) },
      authorizer: { authorize: () => ({ allow: true }) },
      allowAnonymous: [{ method: 'GET', path: '/' }, { method: 'GET', path: '/' }],
    });
  }
});

exactTest(
  'exact anonymous method/path matrix counts dispatch and keeps contract precedence',
  async (t) => {
    type Row = {
      rules?: readonly AnonymousRule[];
      method: string;
      path: string;
      anonymous: boolean;
      policy?: 'none' | 'required';
      throwing?: boolean;
    };
    const get: AnonymousRule[] = [{ method: 'GET', path: '/health' }];
    const rows: Row[] = [];
    for (const rules of [undefined, [], ['/health'], ['/health/']]) {
      rows.push({ rules, method: 'POST', path: '/health/anything', anonymous: true });
      rows.push({ rules, method: 'DELETE', path: '/health%2Fx', anonymous: false });
    }
    for (const method of ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      rows.push({ rules: get, method, path: '/health', anonymous: method === 'GET' });
    }
    for (
      const path of [
        '/health?x=1',
        '/x/../health',
        '/health/live',
        '/health/x',
        '/healthz',
        '/health/',
        '//health',
        '/HEALTH',
        '/he%61lth',
        '/health%2Fx',
        '/health%2F..%2Fx',
      ]
    ) {
      rows.push({
        rules: get,
        method: 'GET',
        path,
        anonymous: path.includes('?') || path === '/x/../health',
      });
    }
    const head: AnonymousRule[] = [{ method: 'HEAD', path: '/health' }];
    rows.push(
      { rules: head, method: 'HEAD', path: '/health', anonymous: true },
      { rules: head, method: 'GET', path: '/health', anonymous: false },
      { rules: ['/api/docs', ...get], method: 'POST', path: '/api/docs/anything', anonymous: true },
      { rules: ['/api/docs', ...get], method: 'POST', path: '/health', anonymous: false },
      { rules: get, method: 'GET', path: '/api/public', anonymous: true, policy: 'none' },
      { rules: get, method: 'GET', path: '/health', anonymous: false, policy: 'required' },
      { rules: get, method: 'POST', path: '/health', anonymous: false, throwing: true },
    );
    for (const row of rows) {
      await t.step(
        `${row.method} ${row.path} ${JSON.stringify(row.rules)} ${row.policy ?? ''}`,
        async () => {
          let authn = 0;
          let authz = 0;
          let handler = 0;
          const app = new Hono<AuthTestEnv>();
          const policy = row.policy
            ? { authentication: row.policy, requiredScopes: [], requiredRoles: [] }
            : undefined;
          const policyResolver: ProcedurePolicyResolver = {
            resolve: () => policy ? { matched: true, policy } : { matched: false },
          };
          const options = { protect: ['/'], allowAnonymous: row.rules, policyResolver };
          const authenticator: AuthenticatorPort = {
            authenticate: () => {
              authn++;
              if (row.throwing) throw new Error('synthetic-private-detail');
              return { ok: false, reason: 'guarded' };
            },
          };
          const authorizer: AuthorizerPort = {
            authorize: () => {
              authz++;
              return { allow: false, reason: 'guarded' };
            },
          };
          app.use('*', createAuthnMiddleware({ ...options, authenticator }));
          app.use('*', createAuthzMiddleware({ ...options, authorizer }));
          app.all('/*', (c) => {
            handler++;
            return c.text('handled');
          });
          const response = await app.request(`http://localhost${row.path}`, { method: row.method });
          const body = await response.text();
          assertEquals([response.status, authn, authz, handler], [
            row.anonymous ? 200 : row.throwing ? 503 : 401,
            row.anonymous ? 0 : 1,
            0,
            row.anonymous ? 1 : 0,
          ]);
          if (row.method === 'HEAD') assertEquals(body, '');
          if (row.throwing) {
            assertEquals(JSON.parse(body), {
              error: 'SERVICE_UNAVAILABLE',
              message: 'Authentication service unavailable',
            });
          }
        },
      );
    }
  },
);
