import { assertEquals } from '@std/assert';
import { createStaticCredentialAuthenticator } from '../../src/auth/static-credential-authenticator.ts';
import { createTrustedHeaderAuthenticator } from '../../src/auth/trusted-header-authenticator.ts';
import type { AuthnRequest } from '../../src/auth/types.ts';

function request(headers: Record<string, string> = {}): AuthnRequest {
  const normalized = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  const fullHeaders = new Headers(headers);
  return {
    method: 'GET',
    path: '/api/users',
    header: (name) => normalized.get(name.toLowerCase()),
    headers: () => new Headers(fullHeaders),
    cookie: (name) => {
      const cookie = normalized.get('cookie');
      return cookie?.split(';')
        .map((part) => part.trim())
        .map((part) => part.split('='))
        .find(([key]) => key === name)
        ?.[1];
    },
  };
}

Deno.test('static credential authenticator accepts a bearer token', async () => {
  const authenticator = createStaticCredentialAuthenticator({
    credentials: {
      'bearer-secret': {
        subject: 'user:1',
        scopes: ['users:read'],
        roles: ['admin'],
      },
    },
  });

  const result = await authenticator.authenticate(
    request({ authorization: 'Bearer bearer-secret' }),
  );

  assertEquals(result, {
    ok: true,
    principal: {
      subject: 'user:1',
      scopes: ['users:read'],
      roles: ['admin'],
      scheme: 'bearer',
      claims: {},
    },
  });
});

Deno.test('static credential authenticator accepts an API key', async () => {
  const authenticator = createStaticCredentialAuthenticator({
    credentials: {
      'api-secret': {
        subject: 'service:billing',
        scopes: ['orders:read'],
        roles: ['service'],
      },
    },
  });

  const result = await authenticator.authenticate(request({ 'x-api-key': 'api-secret' }));

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.principal.subject, 'service:billing');
    assertEquals(result.principal.scheme, 'api-key');
  }
});

Deno.test('static credential authenticator rejects missing credentials', async () => {
  const authenticator = createStaticCredentialAuthenticator({
    credentials: { secret: { subject: 'user:1' } },
  });

  assertEquals(await authenticator.authenticate(request()), {
    ok: false,
    reason: 'missing-credential',
  });
});

Deno.test('static credential authenticator rejects malformed bearer headers', async () => {
  const authenticator = createStaticCredentialAuthenticator({
    credentials: { secret: { subject: 'user:1' } },
  });

  assertEquals(await authenticator.authenticate(request({ authorization: 'Basic secret' })), {
    ok: false,
    reason: 'missing-credential',
  });
});

Deno.test('static credential authenticator rejects invalid credentials', async () => {
  const authenticator = createStaticCredentialAuthenticator({
    credentials: { secret: { subject: 'user:1' } },
  });

  assertEquals(await authenticator.authenticate(request({ authorization: 'Bearer wrong' })), {
    ok: false,
    reason: 'invalid-credential',
  });
});

Deno.test('trusted header authenticator reads subject, scopes, roles, and claims', () => {
  const authenticator = createTrustedHeaderAuthenticator({
    subjectHeader: 'x-authenticated-user',
    scopesHeader: 'x-authenticated-scopes',
    rolesHeader: 'x-authenticated-roles',
    claimsHeader: 'x-authenticated-claims',
  });

  const result = authenticator.authenticate(
    request({
      'x-authenticated-user': 'user:2',
      'x-authenticated-scopes': 'users:read, users:write',
      'x-authenticated-roles': 'admin operator',
      'x-authenticated-claims': '{"tenant":"alpha"}',
    }),
  );

  assertEquals(result, {
    ok: true,
    principal: {
      subject: 'user:2',
      scopes: ['users:read', 'users:write'],
      roles: ['admin', 'operator'],
      scheme: 'trusted-header',
      claims: { tenant: 'alpha' },
    },
  });
});

Deno.test('trusted header authenticator rejects a missing subject header', () => {
  const authenticator = createTrustedHeaderAuthenticator({
    subjectHeader: 'x-authenticated-user',
  });

  assertEquals(authenticator.authenticate(request()), {
    ok: false,
    reason: 'missing-identity-header',
  });
});
