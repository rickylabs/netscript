import { assert, assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@^1';
import {
  AuthBackendNotFoundError,
  type AuthBackendPort,
  createAuthBackendRegistry,
} from '@netscript/plugin-auth-core/ports';
import { buildAuthSession } from '@netscript/plugin-auth-core/testing';
import type { AuthnRequest, AuthnResult } from '@netscript/service/auth';
import {
  createInMemoryKvOAuthRegistry,
  resolveActiveBackendName,
} from '../../services/src/backend-registry.ts';
import { callback, me, session, signin, signout } from '../../services/src/routers/v1-handlers.ts';
import { AuthServiceHandlerError } from '../../services/src/routers/v1-types.ts';
import { authTestUrl } from '../testing/auth-fixtures.ts';

Deno.test('kv-oauth handlers complete signin callback session me signout round-trip', async () => {
  const registry = await createInMemoryKvOAuthRegistry({
    fetch: () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: 'access_test',
            refresh_token: 'refresh_test',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'profile email',
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
      ),
  });

  const started = await signin({ redirectTo: '/dashboard' }, {
    registry,
    request: {
      url: authTestUrl('/v1/auth/signin'),
      headers: new Headers({ 'x-forwarded-proto': 'https' }),
    },
  });
  assertEquals(started.started, true);
  assert(started.redirectUrl);
  const redirect = new URL(started.redirectUrl!);

  const completed = await callback({
    code: 'code_test',
    state: redirect.searchParams.get('state') ?? undefined,
  }, {
    registry,
    request: {
      url: authTestUrl(`/v1/auth/callback?txn=${redirect.searchParams.get('txn')}`),
      headers: new Headers({ 'x-forwarded-proto': 'https' }),
    },
  });
  assertEquals(completed.completed, true);
  assert(completed.sessionId);
  assertEquals(completed.subject, completed.sessionId);

  const activeSession = await session({ sessionId: completed.sessionId }, { registry });
  assertEquals(activeSession.authenticated, true);
  assertEquals(activeSession.session?.id, completed.sessionId);

  const currentUser = await me({
    registry,
    request: {
      url: authTestUrl('/v1/auth/me'),
      headers: new Headers({ cookie: `__Host-ns_session=${completed.sessionId}` }),
    },
  });
  assertEquals(currentUser.authenticated, true);
  assertEquals(currentUser.session?.id, completed.sessionId);
  assertEquals(currentUser.user?.id, completed.sessionId);

  const signedOut = await signout({ sessionId: completed.sessionId }, { registry });
  assertEquals(signedOut.signedOut, true);
  assertEquals(signedOut.sessionId, completed.sessionId);

  const afterSignout = await session({ sessionId: completed.sessionId }, { registry });
  assertEquals(afterSignout.authenticated, false);
});

Deno.test('backend selection reads NETSCRIPT_AUTH_BACKEND and reports unknown names as backend errors', () => {
  assertEquals(resolveActiveBackendName({ NETSCRIPT_AUTH_BACKEND: 'kv-oauth' }), 'kv-oauth');
  assertEquals(resolveActiveBackendName({ NETSCRIPT_AUTH_BACKEND: 'workos' }), 'workos');
  assertEquals(resolveActiveBackendName({ NETSCRIPT_AUTH_BACKEND: 'better-auth' }), 'better-auth');

  assertThrows(
    () => {
      const registry = createAuthBackendRegistry(
        new Map([['kv-oauth', fakeBackend()]]),
        'kv-oauth',
      );
      registry.resolveBackend('missing');
    },
    AuthBackendNotFoundError,
  );
});

Deno.test('unsupported interactive backend operation maps to typed auth service error', async () => {
  const registry = createAuthBackendRegistry(
    new Map([['workos', fakeBackend('workos')]]),
    'workos',
  );
  await assertRejects(
    () => signin({}, { registry }),
    AuthServiceHandlerError,
    'interactive signin',
  );
});

function fakeBackend(name = 'kv-oauth'): AuthBackendPort {
  const stored = new Map<string, ReturnType<typeof buildAuthSession>>();
  return {
    name,
    providers: {
      listProviders:
        () => [{ id: name, displayName: name, kind: 'custom', capabilities: ['session'] }],
      getProvider: (providerId) =>
        providerId === name
          ? { id: name, displayName: name, kind: 'custom', capabilities: ['session'] }
          : undefined,
    },
    sessions: {
      getSession: ({ sessionId }) => sessionId ? stored.get(sessionId) : undefined,
      createSession: (input) => {
        const authSession = buildAuthSession({
          id: `sess_${stored.size + 1}`,
          userId: input.userId,
          providerId: input.providerId,
          subject: input.subject,
          scopes: input.scopes,
          roles: input.roles,
          claims: input.claims,
          expiresAt: input.expiresAt,
        });
        stored.set(authSession.id, authSession);
        return authSession;
      },
      refreshSession: (sessionId) => stored.get(sessionId) ?? buildAuthSession({ id: sessionId }),
      revokeSession: (sessionId) => {
        const current = stored.get(sessionId) ?? buildAuthSession({ id: sessionId });
        const revoked = {
          ...current,
          state: 'revoked' as const,
          revokedAt: new Date().toISOString(),
        };
        stored.set(sessionId, revoked);
        return revoked;
      },
    },
    crypto: {
      sealSessionToken: (authSession) => `sealed:${authSession.id}`,
      openSessionToken: (token) => token.replace(/^sealed:/, ''),
    },
    principalMapper: {
      mapSessionToPrincipal: (authSession) => ({
        session: authSession,
        principal: {
          subject: authSession.subject,
          scopes: authSession.scopes,
          roles: authSession.roles,
          scheme: 'custom',
          claims: { ...authSession.claims, sessionId: authSession.id },
        },
      }),
    },
    authenticate(request: AuthnRequest): AuthnResult {
      const sessionId = request.cookie('__Host-ns_session');
      const current = sessionId ? stored.get(sessionId) : undefined;
      if (!current) {
        return { ok: false, reason: 'missing' };
      }
      return {
        ok: true,
        principal: {
          subject: current.subject,
          scopes: current.scopes,
          roles: current.roles,
          scheme: 'custom',
          claims: { sessionId: current.id },
        },
      };
    },
  };
}
