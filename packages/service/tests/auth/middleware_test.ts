import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { createAuthnMiddleware, createAuthzMiddleware } from '../../src/auth/auth-middleware.ts';
import type { AuthenticatorPort, AuthorizerPort, Principal } from '../../src/auth/types.ts';

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
