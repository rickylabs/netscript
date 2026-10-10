import { assert, assertEquals, assertStrictEquals } from '@std/assert';
import {
  type AuthenticateWithSessionCookieSuccessResponse,
  type RefreshSessionResponse,
  type User,
  WorkOS,
} from '@workos-inc/node';
import {
  type AuthnRequest,
  createWorkosAuthenticator,
  createWorkosBackend,
  type WorkosSessionClient,
} from '@netscript/auth-workos';

Deno.test('real WorkOS SDK client is accepted by both sealed-session factories', async () => {
  const workos = new WorkOS('sk_test_123', { clientId: 'client_123' });
  const cookiePassword = 'x'.repeat(32);
  const backend = createWorkosBackend({ workos, cookiePassword });
  const authenticator = createWorkosAuthenticator({ workos, cookiePassword });
  assertEquals(await backend.authenticate(request), {
    ok: false,
    reason: 'workos_session_cookie_missing',
  });
  assertEquals(await authenticator.authenticate(request), {
    ok: false,
    reason: 'workos_session_cookie_missing',
  });
});

const user: User = {
  object: 'user',
  id: 'user_123',
  email: 'ada@example.com',
  emailVerified: true,
  profilePictureUrl: null,
  name: 'Ada Lovelace',
  firstName: 'Ada',
  lastName: 'Lovelace',
  lastSignInAt: null,
  locale: 'en',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  externalId: 'external_123',
  metadata: { team: 'engineering' },
};
const authenticated: AuthenticateWithSessionCookieSuccessResponse = {
  authenticated: true,
  accessToken: `header.${btoa(JSON.stringify({ iat: 1767225600, exp: 1767312000 }))}.signature`,
  authenticationMethod: 'Password',
  sessionId: 'sess_before',
  organizationId: 'org_123',
  role: 'admin',
  roles: ['member'],
  permissions: ['users:read'],
  entitlements: ['billing'],
  featureFlags: ['beta'],
  user,
};
const refreshed: Extract<RefreshSessionResponse, { authenticated: true }> = {
  ...authenticated,
  sessionId: 'sess_after',
  role: 'editor',
  roles: ['member'],
  permissions: ['users:write'],
  sealedSession: 'rotated-session',
  user: { ...user, metadata: { team: 'platform' } },
};
const request: AuthnRequest = {
  header: () => undefined,
  headers: () => new Headers(),
  cookie: () => '',
  method: 'GET',
  path: '/private',
};

Deno.test('SDK authentication and refresh retain user and principal/session mapping fields', async () => {
  const workos: WorkosSessionClient = {
    userManagement: {
      loadSealedSession: () => ({
        authenticate: () => Promise.resolve(authenticated),
        refresh: (options) => {
          assertEquals(options, { cookiePassword: 'x'.repeat(32), organizationId: 'org_123' });
          return Promise.resolve(refreshed);
        },
      }),
    },
  };
  const backend = createWorkosBackend({ workos, cookiePassword: 'x'.repeat(32) });
  const credentialRequest: AuthnRequest = { ...request, cookie: () => 'sealed-session' };
  const result = await backend.authenticate(credentialRequest);
  assert(result.ok);
  assertEquals(result.principal.subject, user.id);
  assertEquals(result.principal.roles, ['admin', 'member']);
  assertEquals(result.principal.scopes, authenticated.permissions);
  assertStrictEquals(result.principal.claims.workosUser, user);
  const session = await backend.sessions.getSession({ token: 'sealed-session' });
  assert(session);
  assertEquals(session.id, authenticated.sessionId);
  assertEquals(session.userId, user.id);
  assertEquals(session.issuedAt, '2026-01-01T00:00:00.000Z');
  assertEquals(session.expiresAt, '2026-01-02T00:00:00.000Z');
  const mapped = backend.principalMapper.mapSessionToPrincipal(session).principal;
  assertEquals(mapped.subject, result.principal.subject);
  assertEquals(mapped.roles, result.principal.roles);
  assertEquals(mapped.scopes, result.principal.scopes);
  assertEquals(mapped.claims.sessionId, authenticated.sessionId);
  assertEquals(mapped.claims.organizationId, authenticated.organizationId);
  assertStrictEquals(mapped.claims.workosUser, user);

  const authenticator = createWorkosAuthenticator({
    workos,
    cookiePassword: 'x'.repeat(32),
    refresh: 'always',
  });
  const rotated = await authenticator.authenticate(credentialRequest);
  assert(rotated.ok);
  assertEquals(rotated.principal.subject, user.id);
  assertEquals(rotated.principal.roles, ['editor', 'member']);
  assertEquals(rotated.principal.scopes, refreshed.permissions);
  assertEquals(rotated.principal.claims.sessionId, refreshed.sessionId);
  assertEquals(rotated.principal.claims.organizationId, refreshed.organizationId);
  assertEquals(rotated.principal.claims.authenticationMethod, refreshed.authenticationMethod);
  assertEquals(rotated.principal.claims.entitlements, refreshed.entitlements);
  assertEquals(rotated.principal.claims.featureFlags, refreshed.featureFlags);
  assertStrictEquals(rotated.principal.claims.workosUser, refreshed.user);
  assertEquals(rotated.setCookies, [
    'wos-session=rotated-session; Path=/; HttpOnly; SameSite=Lax; Secure',
  ]);
});
