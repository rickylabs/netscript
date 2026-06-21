import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  AuthBackendOperationUnsupportedError,
  createWorkosAuthenticator,
  createWorkosBackend,
  type WorkosSessionClient,
} from '../mod.ts';
import type { AuthnRequest } from '@netscript/service/auth';
import type {
  WorkosSessionAuthenticationResult,
  WorkosSessionRefreshResult,
} from '../src/workos-authenticator.ts';

Deno.test('createWorkosAuthenticator maps an authenticated WorkOS session to Principal', async () => {
  const authenticator = createWorkosAuthenticator({
    workos: workosClient({
      authenticated: true,
      accessToken: 'access-token',
      authenticationMethod: 'Password',
      sessionId: 'sess_123',
      organizationId: 'org_123',
      role: 'admin',
      roles: ['member', 'admin'],
      permissions: ['users:read'],
      entitlements: ['billing'],
      featureFlags: ['beta'],
      user: { id: 'user_123', email: 'ada@example.com' },
    }),
    cookiePassword: 'x'.repeat(32),
  });

  const result = await authenticator.authenticate(requestWithCookie('sealed'));

  assertEquals(result, {
    ok: true,
    principal: {
      subject: 'user_123',
      scopes: ['users:read'],
      roles: ['admin', 'member'],
      scheme: 'custom',
      claims: {
        organizationId: 'org_123',
        sessionId: 'sess_123',
        authenticationMethod: 'Password',
        entitlements: ['billing'],
        featureFlags: ['beta'],
        impersonator: undefined,
        workosUser: { id: 'user_123', email: 'ada@example.com' },
      },
    },
  });
});

Deno.test('createWorkosAuthenticator rejects missing and invalid sealed sessions', async () => {
  const authenticator = createWorkosAuthenticator({
    workos: workosClient({ authenticated: false, reason: 'invalid_jwt' }),
    cookiePassword: 'x'.repeat(32),
  });

  assertEquals(await authenticator.authenticate(requestWithCookie(undefined)), {
    ok: false,
    reason: 'workos_session_cookie_missing',
  });
  assertEquals(await authenticator.authenticate(requestWithCookie('sealed')), {
    ok: false,
    reason: 'workos_invalid_jwt',
  });
});

Deno.test('createWorkosAuthenticator emits Set-Cookie when WorkOS refresh returns a sealed session', async () => {
  const authenticator = createWorkosAuthenticator({
    workos: workosClient(
      {
        authenticated: true,
        accessToken: 'access-token',
        sessionId: 'sess_before',
        organizationId: 'org_123',
        permissions: [],
        user: { id: 'user_123' },
      },
      {
        authenticated: true,
        sessionId: 'sess_after',
        organizationId: 'org_123',
        permissions: ['users:read'],
        user: { id: 'user_123' },
        sealedSession: 'rotated session',
      },
    ),
    cookiePassword: 'x'.repeat(32),
    refresh: 'always',
    cookie: {
      name: 'wos-session',
      path: '/auth',
      sameSite: 'Strict',
      secure: true,
      maxAge: 3600,
    },
  });

  const result = await authenticator.authenticate(requestWithCookie('sealed'));

  assertEquals(result, {
    ok: true,
    principal: {
      subject: 'user_123',
      scopes: ['users:read'],
      roles: [],
      scheme: 'custom',
      claims: {
        organizationId: 'org_123',
        sessionId: 'sess_after',
        authenticationMethod: undefined,
        entitlements: [],
        featureFlags: [],
        impersonator: undefined,
        workosUser: { id: 'user_123' },
      },
    },
    setCookies: [
      'wos-session=rotated%20session; Path=/auth; HttpOnly; SameSite=Strict; Max-Age=3600; Secure',
    ],
  });
});

Deno.test('createWorkosBackend exposes AuthBackendPort provider and session ports', async () => {
  const backend = createWorkosBackend({
    workos: workosClient({
      authenticated: true,
      accessToken: workosAccessToken({ iat: 1767225600, exp: 1767312000 }),
      authenticationMethod: 'Password',
      sessionId: 'sess_123',
      organizationId: 'org_123',
      role: 'admin',
      permissions: ['users:read'],
      user: { id: 'user_123', email: 'ada@example.com' },
    }),
    cookiePassword: 'x'.repeat(32),
    providers: [{
      id: 'workos-sso',
      displayName: 'WorkOS SSO',
      kind: 'saml',
      capabilities: ['signin', 'callback', 'session'],
    }],
  });

  assertEquals(backend.name, 'workos');
  assertEquals(await backend.providers.listProviders(), [{
    id: 'workos-sso',
    displayName: 'WorkOS SSO',
    kind: 'saml',
    capabilities: ['signin', 'callback', 'session'],
  }]);
  assertEquals((await backend.providers.getProvider('workos-sso'))?.displayName, 'WorkOS SSO');

  const authn = await backend.authenticate(requestWithCookie('sealed'));
  assert(authn.ok);
  assertEquals(authn.principal.subject, 'user_123');

  const session = await backend.sessions.getSession({ token: 'sealed' });
  assert(session);
  assertEquals(session.id, 'sess_123');
  assertEquals(session.userId, 'user_123');
  assertEquals(session.scopes, ['users:read']);
  assertEquals(session.issuedAt, '2026-01-01T00:00:00.000Z');

  const mapping = backend.principalMapper.mapSessionToPrincipal(session);
  assertEquals(mapping.principal.subject, 'user_123');
  assertEquals(mapping.principal.claims.sessionId, 'sess_123');

  const token = await backend.crypto.sealSessionToken(session);
  assertEquals(await backend.crypto.openSessionToken(token), 'sess_123');
});

Deno.test('createWorkosBackend throws typed errors for unsupported managed-session operations', async () => {
  const backend = createWorkosBackend({
    workos: workosClient({ authenticated: false, reason: 'invalid_jwt' }),
    cookiePassword: 'x'.repeat(32),
  });

  const unsupportedCases: readonly UnsupportedOperationCase[] = [
    {
      operation: 'sessions.createSession',
      run: () =>
        backend.sessions.createSession({
          userId: 'user_123',
          subject: 'user_123',
          expiresAt: '2026-01-02T00:00:00.000Z',
        }),
    },
    {
      operation: 'sessions.refreshSession',
      run: () => backend.sessions.refreshSession('sess_123'),
    },
    {
      operation: 'sessions.revokeSession',
      run: () => backend.sessions.revokeSession('sess_123'),
    },
  ];

  for (const { operation, run } of unsupportedCases) {
    const error = await assertRejects(async () => {
      await run();
    }, AuthBackendOperationUnsupportedError);
    assertEquals(error.name, 'AuthBackendOperationUnsupportedError');
    assertEquals(error.backendName, 'workos');
    assertEquals(error.operation, operation);
    assert(error.reason.length > 0);
  }
});

type UnsupportedOperationCase = Readonly<{
  operation: string;
  run(): unknown;
}>;

function workosClient(
  authenticationResult: WorkosSessionAuthenticationResult,
  refreshResult: WorkosSessionRefreshResult = authenticationResult,
): WorkosSessionClient {
  return {
    userManagement: {
      loadSealedSession: () => ({
        authenticate: () => Promise.resolve(authenticationResult),
        refresh: () => Promise.resolve(refreshResult),
      }),
    },
  };
}

function requestWithCookie(value: string | undefined): AuthnRequest {
  return {
    header: (name: string) =>
      name.toLowerCase() === 'cookie' && value ? `wos-session=${value}` : undefined,
    headers: () => new Headers(value ? { cookie: `wos-session=${value}` } : {}),
    cookie: (name: string) => (name === 'wos-session' ? value : undefined),
    method: 'GET',
    path: '/private',
  };
}

function workosAccessToken(claims: Record<string, unknown>): string {
  return `header.${base64Url(JSON.stringify(claims))}.signature`;
}

function base64Url(value: string): string {
  return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
