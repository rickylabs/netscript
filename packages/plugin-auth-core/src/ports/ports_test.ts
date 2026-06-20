import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import type { AuthBackendPort } from './mod.ts';
import { AuthBackendNotFoundError, createAuthBackendRegistry } from './mod.ts';

const backend: AuthBackendPort = {
  name: 'default',
  providers: {
    listProviders: () => [],
    getProvider: () => undefined,
  },
  sessions: {
    getSession: () => undefined,
    createSession: (input) => ({
      id: 'sess_1',
      userId: input.userId,
      providerId: input.providerId,
      state: 'active',
      subject: input.subject,
      scopes: input.scopes ?? [],
      roles: input.roles ?? [],
      claims: input.claims ?? {},
      issuedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: input.expiresAt,
    }),
    refreshSession: () => Promise.reject(new Error('not implemented')),
    revokeSession: () => Promise.reject(new Error('not implemented')),
  },
  crypto: {
    sealSessionToken: () => 'sealed',
    openSessionToken: () => 'sess_1',
  },
  principalMapper: {
    mapSessionToPrincipal: (session) => ({
      session,
      principal: {
        subject: session.subject,
        scopes: session.scopes,
        roles: session.roles,
        scheme: 'custom',
        claims: session.claims,
      },
    }),
  },
  authenticate: () => ({ ok: false, reason: 'missing session' }),
};

Deno.test('createAuthBackendRegistry resolves the default backend', () => {
  const registry = createAuthBackendRegistry(new Map([['default', backend]]));

  assertEquals(registry.default, backend);
  assertEquals(registry.resolveBackend(), backend);
});

Deno.test('createAuthBackendRegistry resolves named backends from the map seam', () => {
  const registry = createAuthBackendRegistry(new Map([['workos', backend]]), 'workos');

  assertEquals(registry.backends instanceof Map, true);
  assertEquals(registry.resolveBackend('workos'), backend);
});

Deno.test('createAuthBackendRegistry throws for missing backends', () => {
  const registry = createAuthBackendRegistry(new Map([['default', backend]]));

  const error = assertThrows(
    () => registry.resolveBackend('missing'),
    AuthBackendNotFoundError,
  );
  assertEquals(error.availableBackends, ['default']);
});

Deno.test('AuthBackendPort remains contract-only for async backends', async () => {
  await assertRejects(() => Promise.resolve(backend.sessions.refreshSession('sess_1')));
});
