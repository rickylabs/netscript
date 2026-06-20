import { assertEquals } from '@std/assert';
import { createService } from '../../mod.ts';
import { createScopeAuthorizer } from '../../src/auth/scope-authorizer.ts';
import { createStaticCredentialAuthenticator } from '../../src/auth/static-credential-authenticator.ts';
import type { Principal } from '../../src/auth/types.ts';

const authenticator = createStaticCredentialAuthenticator({
  credentials: {
    read: {
      subject: 'user:reader',
      scopes: ['users:read'],
      roles: ['reader'],
    },
    write: {
      subject: 'user:writer',
      scopes: ['users:write'],
      roles: ['writer'],
    },
  },
});

const authorizer = createScopeAuthorizer({
  rules: [{
    match: (request) => request.path.startsWith('/api/users'),
    requireScopes: ['users:read'],
  }],
});

Deno.test('builder auth returns 401, 403, and 200 for guarded routes', async () => {
  const app = createService({}, { name: 'auth-builder' })
    .route('get', '/api/users', (c: unknown) => {
      const ctx = c as {
        get(key: string): unknown;
        json(data: unknown): Response;
      };
      const principal = ctx.get('principal') as Principal;
      return ctx.json({ subject: principal.subject });
    })
    .withAuthz({ authorizer })
    .withAuthn({ authenticator })
    .build();

  const unauthenticated = await app.request('/api/users');
  assertEquals(unauthenticated.status, 401);
  assertEquals(await unauthenticated.json(), {
    error: 'UNAUTHORIZED',
    message: 'missing-credential',
  });

  const forbidden = await app.request('/api/users', {
    headers: { authorization: 'Bearer write' },
  });
  assertEquals(forbidden.status, 403);
  assertEquals(await forbidden.json(), {
    error: 'FORBIDDEN',
    message: 'authz.missing-scope:users:read',
  });

  const allowed = await app.request('/api/users', {
    headers: { authorization: 'Bearer read' },
  });
  assertEquals(allowed.status, 200);
  assertEquals(await allowed.json(), { subject: 'user:reader' });
});

Deno.test('builder auth leaves health public under guarded api prefix', async () => {
  const app = createService({}, { name: 'auth-health' })
    .withAuthn({ authenticator })
    .withHealth()
    .build();

  const response = await app.request('/health');

  assertEquals(response.status, 200);
});

Deno.test('builder injects Hono principal into oRPC context', () => {
  const principal: Principal = {
    subject: 'user:context',
    scopes: ['users:read'],
    roles: ['reader'],
    scheme: 'custom',
    claims: {},
  };
  const builder = createService({}, { name: 'auth-context' });
  const context = (builder as unknown as {
    buildRpcContext(
      c: { get(key: string): unknown; req: { header(name: string): string | undefined } },
      traceContext: boolean,
    ): Record<string, unknown>;
  }).buildRpcContext({
    get: (key: string) => key === 'principal' ? principal : undefined,
    req: { header: () => undefined },
  }, false);

  assertEquals(context.principal, principal);
});
