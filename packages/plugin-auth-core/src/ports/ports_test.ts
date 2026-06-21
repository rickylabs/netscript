import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import type { AuthBackendPort } from './mod.ts';
import {
  AuthBackendNotFoundError,
  createAuthBackendRegistry,
  createHmacSessionTokenCrypto,
} from './mod.ts';

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

Deno.test('AuthBackendPort can expose an optional typed interactive sub-port', async () => {
  const interactiveBackend: AuthBackendPort = {
    ...backend,
    interactive: {
      signIn(): Promise<Response> {
        return Promise.resolve(Response.redirect('https://issuer.example.test/authorize'));
      },
      handleCallback(): Promise<{
        readonly response: Response;
        readonly sessionId: string;
        readonly principal: { readonly subject: string };
      }> {
        return Promise.resolve({
          response: Response.redirect('https://app.example.test/dashboard'),
          sessionId: 'sess_1',
          principal: { subject: 'user_1' },
        });
      },
      getSessionId: () => Promise.resolve('sess_1'),
      signOut(): Promise<Response> {
        return Promise.resolve(new Response(null, { status: 204 }));
      },
    },
  };
  const registry = createAuthBackendRegistry(new Map([['default', interactiveBackend]]));

  const resolved = registry.resolveBackend();

  assertEquals(
    await resolved.interactive?.getSessionId(new Request('https://app.example.test')),
    'sess_1',
  );
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

Deno.test('createHmacSessionTokenCrypto round-trips a signed session id', async () => {
  const sessionCrypto = createHmacSessionTokenCrypto('x'.repeat(32));
  const token = await sessionCrypto.sealSessionToken({
    id: 'sess_1',
    userId: 'user_1',
    state: 'active',
    subject: 'user_1',
    scopes: [],
    roles: [],
    claims: {},
    issuedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-02T00:00:00.000Z',
  });

  assertEquals(await sessionCrypto.openSessionToken(token), 'sess_1');
});

Deno.test('createHmacSessionTokenCrypto binds the full payload without decorative entropy', async () => {
  const sessionCrypto = createHmacSessionTokenCrypto('x'.repeat(32));
  const token = await sessionCrypto.sealSessionToken({
    id: 'sess_1',
    userId: 'user_1',
    state: 'active',
    subject: 'user_1',
    scopes: [],
    roles: [],
    claims: {},
    issuedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-02T00:00:00.000Z',
  });
  const [payload] = token.split('.');

  assertEquals(decodeBase64UrlText(payload ?? ''), 'sess_1');
});

Deno.test('createHmacSessionTokenCrypto rejects same-length signature tampering', async () => {
  const sessionCrypto = createHmacSessionTokenCrypto('x'.repeat(32));
  const token = await sessionCrypto.sealSessionToken({
    id: 'sess_1',
    userId: 'user_1',
    state: 'active',
    subject: 'user_1',
    scopes: [],
    roles: [],
    claims: {},
    issuedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-02T00:00:00.000Z',
  });
  const [payload, signature] = token.split('.');
  const tamperedSignature = signature?.startsWith('A')
    ? `B${signature.slice(1)}`
    : `A${signature?.slice(1) ?? ''}`;

  await assertRejects(
    async () => {
      await sessionCrypto.openSessionToken(`${payload}.${tamperedSignature}`);
    },
    Error,
    'Invalid auth backend session token.',
  );
});

function decodeBase64UrlText(value: string): string {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(
    Math.ceil(value.length / 4) * 4,
    '=',
  );
  return atob(padded);
}
