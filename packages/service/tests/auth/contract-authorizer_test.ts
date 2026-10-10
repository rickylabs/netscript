import { assertEquals, assertThrows } from '@std/assert';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { createContractAuthorizer } from '../../src/auth/mod.ts';
import { createScopeAuthorizer } from '../../src/auth/scope-authorizer.ts';
import type {
  ContractPolicyContract,
  ProcedurePolicyResolution,
} from '../../src/auth/contract/contract-policy.ts';
import type { AuthzRequest, MatchAwareAuthorizerPort, Principal } from '../../src/auth/types.ts';
import type { ContractAuthorizerRawRoute } from '../../src/auth/options.ts';

const principal: Principal = {
  subject: 'user:contract-policy',
  scopes: ['items:read'],
  roles: ['reader'],
  scheme: 'custom',
  claims: {},
};

Deno.test('contract resolver preserves canonical mounted RPC paths and remaps only legacy paths', () => {
  const flat = {
    list: baseContract.route({ method: 'GET', path: '/items' }).output(SuccessSchema)
      .meta({ access: { authentication: 'required', authorization: { scopes: ['items:read'] } } }),
  };
  const resolver = createContractAuthorizer({
    v1: { sample: baseContract.prefix('/v1/sample').router(flat) },
  })
    .bind({
      apiPath: '/api',
      rpcPath: '/api/rpc',
      deprecatedRpcRoutes: [{
        pathPrefix: '/api/rpc/v1/',
        replacementPrefix: '/api/rpc/v1/sample/',
      }],
    });
  const expected: ProcedurePolicyResolution = {
    matched: true,
    policy: { authentication: 'required', requiredScopes: ['items:read'], requiredRoles: [] },
  };
  for (
    const [path, method] of [
      ['/api/v1/sample/items', 'GET'],
      ['/api/rpc/v1/sample/list', 'POST'],
      ['/api/rpc/v1/list', 'POST'],
    ]
  ) assertEquals(resolver.resolve({ path, method }), expected, path);
  for (const path of ['/api/rpc/v1/sample/missing', '/api/rpc/v1/sample-other/list']) {
    assertEquals(resolver.resolve({ path, method: 'POST' }), { matched: false });
  }
});

function request(
  path: string,
  principalOverride: Principal = principal,
  method = 'GET',
): AuthzRequest {
  return { principal: principalOverride, method, path };
}

Deno.test('createContractAuthorizer rejects optional authentication during construction', () => {
  const contract = {
    optionalItem: baseContract
      .route({ method: 'GET', path: '/items/optional' })
      .output(SuccessSchema)
      .meta({ access: { authentication: 'optional' } }),
  } satisfies ContractPolicyContract;

  assertThrows(
    () => createContractAuthorizer(contract),
    Error,
    '[netscript.service.contract-policy] optional authentication is unsupported: optionalItem',
  );
});

Deno.test('contract resolver dispatches REST, RPC, aliases, and renamed procedure keys', () => {
  const contract = {
    v1: {
      renamedRead: baseContract
        .route({ method: 'GET', path: '/items/{id}' })
        .output(SuccessSchema)
        .meta({
          access: {
            authentication: 'required',
            authorization: { scopes: ['items:read'], roles: ['reader'] },
          },
        }),
    },
  } satisfies ContractPolicyContract;
  const authorizer = createContractAuthorizer(contract);
  const resolver = authorizer.bind({
    apiPath: '/rest',
    rpcPath: '/transport',
    rpcAliases: ['/legacy-rpc'],
    deprecatedRpcRoutes: [{
      pathPrefix: '/transport/v0',
      replacementPrefix: '/transport/v1',
    }],
  });
  const expected: ProcedurePolicyResolution = {
    matched: true,
    policy: {
      authentication: 'required',
      requiredScopes: ['items:read'],
      requiredRoles: ['reader'],
    },
  };

  assertEquals(resolver.resolve({ method: 'GET', path: '/rest/items/42' }), expected);
  assertEquals(resolver.resolve({ method: 'GET', path: '/transport/v1/renamedRead' }), expected);
  assertEquals(resolver.resolve({ method: 'GET', path: '/legacy-rpc/v1/renamedRead' }), expected);
  assertEquals(resolver.resolve({ method: 'GET', path: '/transport/v0/renamedRead' }), expected);
  assertEquals(resolver.resolve({ method: 'GET', path: '/transport/v1/readItem' }), {
    matched: false,
  });
});

Deno.test('contract authorizer uses fallback only when matched procedure metadata is absent', async () => {
  const contract = {
    legacyItem: baseContract
      .route({ method: 'GET', path: '/legacy/items' })
      .output(SuccessSchema),
  } satisfies ContractPolicyContract;
  const fallback = createScopeAuthorizer({
    rules: [{
      match: (candidate) => candidate.path === '/rest/legacy/items',
      requireScopes: ['items:read'],
    }],
    denyByDefault: false,
  });
  const authorizer = createContractAuthorizer(contract, { fallback });
  authorizer.bind({ apiPath: '/rest', rpcPath: '/rpc' });

  assertEquals(await authorizer.authorize(request('/rest/legacy/items')), { allow: true });
  assertEquals(await authorizer.authorize(request('/rpc/legacyItem')), {
    allow: false,
    reason: 'authz.no-matching-rule',
  });
});

Deno.test('contract authorizer denies a principal missing a declared scope', async () => {
  const contract = {
    updateItem: baseContract
      .route({ method: 'POST', path: '/items/{id}' })
      .output(SuccessSchema)
      .meta({
        access: {
          authentication: 'required',
          authorization: { scopes: ['items:write'] },
        },
      }),
  } satisfies ContractPolicyContract;
  const authorizer = createContractAuthorizer(contract);
  authorizer.bind({ apiPath: '/rest', rpcPath: '/rpc' });

  assertEquals(await authorizer.authorize(request('/rest/items/42', principal, 'POST')), {
    allow: false,
    reason: 'authz.missing-scope:items:write',
  });
});

Deno.test('contract metadata wins when fallback authorization disagrees', async () => {
  const contract = {
    publicStatus: baseContract
      .route({ method: 'GET', path: '/status' })
      .output(SuccessSchema)
      .meta({ access: { authentication: 'none' } }),
    protectedItem: baseContract
      .route({ method: 'GET', path: '/items/{id}' })
      .output(SuccessSchema)
      .meta({
        access: {
          authentication: 'required',
          authorization: { scopes: ['items:write'] },
        },
      }),
  } satisfies ContractPolicyContract;
  let fallbackCalls = 0;
  const fallback: MatchAwareAuthorizerPort = {
    authorize: () => ({ allow: false, reason: 'fallback-deny' }),
    authorizeMatch: (request) => {
      fallbackCalls += 1;
      return request.path.endsWith('/status')
        ? { matched: true, decision: { allow: false, reason: 'fallback-deny' } }
        : { matched: true, decision: { allow: true } };
    },
  };
  const authorizer = createContractAuthorizer(contract, { fallback });
  authorizer.bind({ apiPath: '/rest', rpcPath: '/rpc' });

  assertEquals(await authorizer.authorize(request('/rest/items/42')), {
    allow: false,
    reason: 'authz.missing-scope:items:write',
  });
  assertEquals(await authorizer.authorize(request('/rest/status')), { allow: true });
  assertEquals(fallbackCalls, 0);
});

const rawRouteContract = {
  readItem: baseContract
    .route({ method: 'GET', path: '/items/{id}' })
    .output(SuccessSchema)
    .meta({ access: { authentication: 'required' } }),
} satisfies ContractPolicyContract;

Deno.test('contract resolver matches a declared raw route exactly as authentication-required', () => {
  const resolver = createContractAuthorizer(rawRouteContract, {
    rawRoutes: [{ path: '/api/tools/mcp/', authentication: 'required' }],
  }).bind({ apiPath: '/api', rpcPath: '/api/rpc' });
  const required: ProcedurePolicyResolution = {
    matched: true,
    policy: { authentication: 'required', requiredScopes: [], requiredRoles: [] },
  };

  for (const path of ['/api/tools/mcp', '/api/tools/mcp/']) {
    assertEquals(resolver.resolve({ method: 'POST', path }), required, path);
  }
  for (
    const path of ['/api/tools/mcp-admin', '/api/tools/mcp/nested', '/api/tools', '/API/tools/mcp']
  ) {
    assertEquals(resolver.resolve({ method: 'POST', path }), { matched: false }, path);
  }
});

Deno.test('contract authorizer enforces raw route requirements and denies undeclared routes', async () => {
  const authorizer = createContractAuthorizer(rawRouteContract, {
    rawRoutes: [{
      path: '/api/tools/mcp',
      authentication: 'required',
      authorization: { scopes: ['items:read'], roles: ['service'] },
    }],
  });
  authorizer.bind({ apiPath: '/api', rpcPath: '/api/rpc' });
  const service: Principal = { ...principal, subject: 'service:worker', roles: ['service'] };

  assertEquals(await authorizer.authorize(request('/api/tools/mcp', service, 'POST')), {
    allow: true,
  });
  assertEquals(await authorizer.authorize(request('/api/tools/mcp', principal, 'POST')), {
    allow: false,
    reason: 'authz.missing-role:service',
  });
  assertEquals(await authorizer.authorize(request('/api/tools/other', service, 'POST')), {
    allow: false,
    reason: 'authz.no-contract-procedure',
  });
});

Deno.test('createContractAuthorizer rejects raw routes that are not exact authenticated paths', () => {
  const invalid: readonly [unknown, string][] = [
    [{ path: '/api/tools/*', authentication: 'required' }, '/api/tools/* is not an exact'],
    [{ path: '/api/tools/:id', authentication: 'required' }, '/api/tools/:id is not an exact'],
    [{ path: '/api/tools/{id}', authentication: 'required' }, '/api/tools/{id} is not an exact'],
    [{ path: 'api/tools/mcp', authentication: 'required' }, 'api/tools/mcp is not an exact'],
    [{ path: '/api/tools/mcp', authentication: 'none' }, '/api/tools/mcp must require'],
  ];
  for (const [route, message] of invalid) {
    assertThrows(
      () =>
        createContractAuthorizer(rawRouteContract, {
          rawRoutes: [route as ContractAuthorizerRawRoute],
        }),
      Error,
      `[netscript.service.contract-policy] invalid raw route: ${message}`,
    );
  }
  assertThrows(
    () =>
      createContractAuthorizer(rawRouteContract, {
        rawRoutes: [
          { path: '/api/tools/mcp', authentication: 'required' },
          { path: '/api/tools/mcp/', authentication: 'required' },
        ],
      }),
    Error,
    'invalid raw route: /api/tools/mcp is declared more than once',
  );
});

Deno.test('contract resolver refuses raw routes that overlap the REST or RPC projection', () => {
  for (const path of ['/api/items/42', '/api/rpc/tools', '/api/rpc']) {
    const authorizer = createContractAuthorizer(rawRouteContract, {
      rawRoutes: [{ path, authentication: 'required' }],
    });
    assertThrows(
      () => authorizer.bind({ apiPath: '/api', rpcPath: '/api/rpc' }),
      Error,
      `[netscript.service.contract-policy] raw route overlaps the contract projection: ${path}`,
    );
  }
});
