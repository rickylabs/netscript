import { assertEquals } from '@std/assert';
import { implement, os } from '@orpc/server';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { createContractAuthorizer, createService } from '../../mod.ts';
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

Deno.test('builder injects a principal only when the Hono auth context has one', () => {
  const principal: Principal = {
    subject: 'user:context',
    scopes: ['users:read'],
    roles: ['reader'],
    scheme: 'custom',
    claims: {},
  };
  const factoryResult = Object.freeze({ tenant: 'tenant-a' });
  const builder = createService({}, { name: 'auth-context' })
    .withContext(() => factoryResult);
  const context = (builder as unknown as {
    buildRpcContext(
      c: { get(key: string): unknown; req: { header(name: string): string | undefined } },
      traceContext: boolean,
    ): Record<string, unknown>;
  }).buildRpcContext({
    get: (key: string) => key === 'principal' ? principal : undefined,
    req: { header: () => undefined },
  }, false);

  assertEquals(context, { tenant: 'tenant-a', principal });
  assertEquals(factoryResult, { tenant: 'tenant-a' });
  assertEquals(Object.hasOwn(factoryResult, 'principal'), false);

  const anonymousContext = (builder as unknown as {
    buildRpcContext(
      c: { get(key: string): unknown; req: { header(name: string): string | undefined } },
      traceContext: boolean,
    ): Record<string, unknown>;
  }).buildRpcContext({
    get: () => undefined,
    req: { header: () => undefined },
  }, false);

  assertEquals(anonymousContext, { tenant: 'tenant-a' });
  assertEquals(Object.hasOwn(anonymousContext, 'principal'), false);
});

Deno.test('builder binds one contract policy resolver to actual REST and RPC mounts', async () => {
  const contract = {
    renamedStatus: baseContract
      .route({ method: 'GET', path: '/status' })
      .output(SuccessSchema)
      .meta({ access: { authentication: 'none' } }),
    readItem: baseContract
      .route({ method: 'GET', path: '/items/{id}' })
      .output(SuccessSchema)
      .meta({
        access: {
          authentication: 'required',
          authorization: { scopes: ['users:read'] },
        },
      }),
  };
  const implemented = implement(contract);
  const router = os.router({
    renamedStatus: implemented.renamedStatus.handler(() => ({ success: true })),
    readItem: implemented.readItem.handler(() => ({ success: true })),
  });
  const app = createService(router, { name: 'contract-policy-builder' })
    .withRPC({
      apiPath: '/rest',
      rpcPath: '/transport',
      rpcAliases: ['/legacy-rpc'],
    })
    .withAuthn({ authenticator })
    .withAuthz({ authorizer: createContractAuthorizer(contract) })
    .build();

  const publicRest = await app.request('/rest/status');
  const publicRpc = await app.request('/transport/renamedStatus');
  const publicAlias = await app.request('/legacy-rpc/renamedStatus');
  const missingCredential = await app.request('/rest/items/42');
  const missingScope = await app.request('/transport/readItem', {
    headers: { authorization: 'Bearer write' },
  });
  const allowed = await app.request('/rest/items/42', {
    headers: { authorization: 'Bearer read' },
  });

  assertEquals(publicRest.status, 200);
  assertEquals(publicRpc.status, 200);
  assertEquals(publicAlias.status, 200);
  assertEquals(missingCredential.status, 401);
  assertEquals(missingScope.status, 403);
  assertEquals(await missingScope.json(), {
    error: 'FORBIDDEN',
    message: 'authz.missing-scope:users:read',
  });
  assertEquals(allowed.status, 200);
});
