import { assertEquals } from '@std/assert';
import { implement, os } from '@orpc/server';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import {
  type ContractAuthorizerRawRoute,
  createContractAuthorizer,
  createService,
} from '../../mod.ts';
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

const rawRouteAuthenticator = createStaticCredentialAuthenticator({
  credentials: {
    user: { subject: 'user:operator', scopes: [], roles: ['operator'] },
    worker: { subject: 'service:hermes-worker', scopes: [], roles: ['service'] },
  },
});

function rawRouteApp(rawRoutes: readonly ContractAuthorizerRawRoute[]) {
  const contract = {
    readItem: baseContract
      .route({ method: 'GET', path: '/items/{id}' })
      .output(SuccessSchema)
      .meta({ access: { authentication: 'required' } }),
  };
  const router = os.router({
    readItem: implement(contract).readItem.handler(() => ({ success: true })),
  });
  const echoSubject = (c: unknown) => {
    const ctx = c as { get(key: string): unknown; json(data: unknown): Response };
    return ctx.json({ subject: (ctx.get('principal') as Principal).subject });
  };
  return createService(router, { name: 'raw-route-policy' })
    .withRPC()
    .withAuthn({ authenticator: rawRouteAuthenticator })
    .withAuthz({ authorizer: createContractAuthorizer(contract, { rawRoutes }) })
    .route('all', '/api/tools/mcp', echoSubject)
    .route('all', '/api/tools/other', echoSubject)
    .route('all', '/api/tools/mcp-admin', echoSubject)
    .route('all', '/api/tools/mcp/nested', echoSubject)
    .route('all', '/hooks/mcp', echoSubject)
    .build();
}

const DECLARED_MCP: readonly ContractAuthorizerRawRoute[] = [
  { path: '/api/tools/mcp', authentication: 'required' },
];

Deno.test('declared raw route under the contract authorizer serves an authenticated caller', async () => {
  const app = rawRouteApp(DECLARED_MCP);

  const response = await app.request('/api/tools/mcp', {
    method: 'POST',
    headers: { authorization: 'Bearer user' },
  });

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { subject: 'user:operator' });
});

Deno.test('declared raw route rejects an unauthenticated caller with 401', async () => {
  const app = rawRouteApp([
    ...DECLARED_MCP,
    { path: '/hooks/mcp', authentication: 'required' },
  ]);

  for (const path of ['/api/tools/mcp', '/hooks/mcp']) {
    const response = await app.request(path, { method: 'POST' });
    assertEquals(response.status, 401, path);
    assertEquals(await response.json(), {
      error: 'UNAUTHORIZED',
      message: 'missing-credential',
    });
  }
});

Deno.test('undeclared raw sibling stays denied with authz.no-contract-procedure', async () => {
  const app = rawRouteApp(DECLARED_MCP);

  const response = await app.request('/api/tools/other', {
    method: 'POST',
    headers: { authorization: 'Bearer user' },
  });

  assertEquals(response.status, 403);
  assertEquals(await response.json(), {
    error: 'FORBIDDEN',
    message: 'authz.no-contract-procedure',
  });
});

Deno.test('raw route declaration matches exactly, without prefix confusion', async () => {
  const app = rawRouteApp(DECLARED_MCP);

  for (const path of ['/api/tools/mcp-admin', '/api/tools/mcp/nested', '/api/tools']) {
    const response = await app.request(path, {
      method: 'POST',
      headers: { authorization: 'Bearer user' },
    });
    assertEquals(response.status, 403, path);
    assertEquals(await response.json(), {
      error: 'FORBIDDEN',
      message: 'authz.no-contract-procedure',
    }, path);
  }
});

Deno.test('declared raw route admits a service-identity bearer and enforces declared roles', async () => {
  const app = rawRouteApp([{
    path: '/api/tools/mcp',
    authentication: 'required',
    authorization: { roles: ['service'] },
  }]);

  const worker = await app.request('/api/tools/mcp', {
    method: 'POST',
    headers: { authorization: 'Bearer worker' },
  });
  const user = await app.request('/api/tools/mcp', {
    method: 'POST',
    headers: { authorization: 'Bearer user' },
  });

  assertEquals(worker.status, 200);
  assertEquals(await worker.json(), { subject: 'service:hermes-worker' });
  assertEquals(user.status, 403);
  assertEquals(await user.json(), {
    error: 'FORBIDDEN',
    message: 'authz.missing-role:service',
  });
});
