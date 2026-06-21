import { assertEquals } from '@std/assert';
import { createScopeAuthorizer } from '../../src/auth/scope-authorizer.ts';
import type { AuthzRequest, Principal } from '../../src/auth/types.ts';

const principal: Principal = {
  subject: 'user:1',
  scopes: ['users:read'],
  roles: ['admin'],
  scheme: 'custom',
  claims: {},
};

function request(overrides: Partial<AuthzRequest> = {}): AuthzRequest {
  return {
    principal,
    method: 'GET',
    path: '/api/users',
    ...overrides,
  };
}

Deno.test('scope authorizer allows a matching rule with satisfied scopes and roles', () => {
  const authorizer = createScopeAuthorizer({
    rules: [{
      match: (candidate) => candidate.path === '/api/users',
      requireScopes: ['users:read'],
      requireRoles: ['admin'],
    }],
  });

  assertEquals(authorizer.authorize(request()), { allow: true });
});

Deno.test('scope authorizer denies missing scope', () => {
  const authorizer = createScopeAuthorizer({
    rules: [{
      match: () => true,
      requireScopes: ['users:write'],
    }],
  });

  assertEquals(authorizer.authorize(request()), {
    allow: false,
    reason: 'authz.missing-scope:users:write',
  });
});

Deno.test('scope authorizer denies missing role', () => {
  const authorizer = createScopeAuthorizer({
    rules: [{
      match: () => true,
      requireRoles: ['operator'],
    }],
  });

  assertEquals(authorizer.authorize(request()), {
    allow: false,
    reason: 'authz.missing-role:operator',
  });
});

Deno.test('scope authorizer denies by default when no rule matches', () => {
  const authorizer = createScopeAuthorizer({
    rules: [{ match: () => false }],
  });

  assertEquals(authorizer.authorize(request()), {
    allow: false,
    reason: 'authz.no-matching-rule',
  });
});

Deno.test('scope authorizer can allow by default when explicitly configured', () => {
  const authorizer = createScopeAuthorizer({
    rules: [{ match: () => false }],
    denyByDefault: false,
  });

  assertEquals(authorizer.authorize(request()), { allow: true });
});
