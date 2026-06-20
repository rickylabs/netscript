import { assertEquals } from '@std/assert';
import { createWorkosAuthenticator, type WorkosSessionClient } from '../mod.ts';
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
