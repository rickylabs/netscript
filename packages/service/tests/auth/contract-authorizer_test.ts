import { assertEquals, assertThrows } from '@std/assert';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { createContractAuthorizer } from '../../src/auth/mod.ts';
import { createScopeAuthorizer } from '../../src/auth/scope-authorizer.ts';
import type {
  ContractPolicyContract,
  ProcedurePolicyResolution,
} from '../../src/auth/contract-policy.ts';
import type { AuthzRequest, MatchAwareAuthorizerPort, Principal } from '../../src/auth/types.ts';

const principal: Principal = {
  subject: 'user:contract-policy',
  scopes: ['items:read'],
  roles: ['reader'],
  scheme: 'custom',
  claims: {},
};

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
