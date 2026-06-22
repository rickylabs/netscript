import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  AuthBackendOperationUnsupportedError,
  type BetterAuthInstance,
  createBetterAuthAuthenticator,
  createBetterAuthBackend,
  createNetscriptBetterAuth,
  type NetscriptBetterAuthOptions,
} from '../mod.ts';
import type { AuthnRequest } from '@netscript/service/auth';
import type { BetterAuthOptions } from 'better-auth';
import {
  type BetterAuthSessionPayload,
  configureNetscriptBetterAuthOptions,
} from '../src/better-auth.ts';

const passthroughPlugin = {
  id: 'netscript-test-plugin',
} satisfies NonNullable<BetterAuthOptions['plugins']>[number];

const pluginPassthroughAccepted = {
  prisma: {},
  provider: 'sqlite',
  plugins: [passthroughPlugin],
} satisfies NetscriptBetterAuthOptions;
void pluginPassthroughAccepted;

const databaseOverrideRejected = {
  prisma: {},
  provider: 'sqlite',
  betterAuthOptions: {
    // @ts-expect-error NetScript owns better-auth database configuration.
    database: 'consumer-owned-database',
  },
} satisfies NetscriptBetterAuthOptions;
void databaseOverrideRejected;

Deno.test('createBetterAuthAuthenticator maps getSession to Principal', async () => {
  const auth = authInstance({
    response: {
      session: {
        id: 'sess_123',
        activeOrganizationId: 'org_123',
        activeOrganizationRole: 'owner',
        activeOrganizationPermissions: ['users:read'],
        metadata: { theme: 'dark' },
      },
      user: {
        id: 'user_123',
        role: 'admin',
        roles: ['member'],
        email: 'ada@example.com',
      },
    },
  });

  const result = await createBetterAuthAuthenticator({ auth }).authenticate(request());

  assert(result.ok);
  assertEquals(result.principal, {
    subject: 'user_123',
    scopes: ['users:read'],
    roles: ['admin', 'owner', 'member'],
    scheme: 'custom',
    claims: {
      organizationId: 'org_123',
      sessionId: 'sess_123',
      activeOrganizationId: 'org_123',
      session: {
        id: 'sess_123',
        activeOrganizationId: 'org_123',
        activeOrganizationRole: 'owner',
        activeOrganizationPermissions: ['users:read'],
        metadata: { theme: 'dark' },
      },
      user: {
        id: 'user_123',
        role: 'admin',
        roles: ['member'],
        email: 'ada@example.com',
      },
    },
  });
});

Deno.test('createBetterAuthAuthenticator rejects missing sessions', async () => {
  const result = await createBetterAuthAuthenticator({
    auth: authInstance({ response: null }),
  }).authenticate(request());

  assertEquals(result, { ok: false, reason: 'better_auth_session_missing' });
});

Deno.test('createBetterAuthAuthenticator emits refreshed cookies from better-auth headers', async () => {
  const headers = new Headers();
  headers.append('set-cookie', 'better-auth.session_token=rotated; Path=/; HttpOnly');
  headers.set('x-auth-refresh', '1');

  const result = await createBetterAuthAuthenticator({
    auth: authInstance({
      headers,
      response: {
        session: { id: 'sess_123', activeOrganizationId: 'org_123' },
        user: { id: 'user_123' },
      },
    }),
  }).authenticate(request());

  assert(result.ok);
  assertEquals(result.setCookies, ['better-auth.session_token=rotated; Path=/; HttpOnly']);
  assertEquals(result.responseHeaders, { 'x-auth-refresh': '1' });
});

Deno.test('createNetscriptBetterAuth wraps better-auth prismaAdapter over a consumer Prisma client', () => {
  const auth = createNetscriptBetterAuth({
    prisma: {},
    provider: 'sqlite',
    secret: 'x'.repeat(32),
    advanced: { disableCSRFCheck: true },
  });

  assertEquals(typeof auth.handler, 'function');
  assertEquals(typeof auth.api.getSession, 'function');
});

Deno.test('configureNetscriptBetterAuthOptions forwards dedicated plugins', () => {
  const configured = configureNetscriptBetterAuthOptions({
    prisma: {},
    provider: 'sqlite',
    plugins: [passthroughPlugin],
  });

  assertEquals(configured.plugins, [passthroughPlugin]);
});

Deno.test('configureNetscriptBetterAuthOptions forwards escape-hatch options under NetScript database', () => {
  const configured = configureNetscriptBetterAuthOptions({
    prisma: {},
    provider: 'sqlite',
    secret: 'explicit-secret',
    baseURL: 'http://explicit.example.test',
    betterAuthOptions: {
      appName: 'NetScript Test Auth',
      baseURL: 'http://escape.example.test',
      secret: 'escape-secret',
      telemetry: { enabled: false },
    },
  });

  assertEquals(configured.appName, 'NetScript Test Auth');
  assertEquals(configured.baseURL, 'http://explicit.example.test');
  assertEquals(configured.secret, 'explicit-secret');
  assertEquals(configured.telemetry, { enabled: false });
  assert(configured.database);
});

Deno.test('createBetterAuthBackend exposes AuthBackendPort provider and session ports', async () => {
  const backend = createBetterAuthBackend({
    auth: authInstance({
      response: {
        session: {
          id: 'sess_123',
          userId: 'user_123',
          providerId: 'github',
          activeOrganizationId: 'org_123',
          activeOrganizationPermissions: ['users:read'],
          createdAt: '2026-01-01T00:00:00.000Z',
          expiresAt: '2026-01-02T00:00:00.000Z',
        },
        user: { id: 'user_123', roles: ['member'] },
      },
    }),
    sessionTokenSecret: 'x'.repeat(32),
    providers: [{ id: 'github', displayName: 'GitHub' }],
  });

  assertEquals(backend.name, 'better-auth');
  assertEquals(await backend.providers.listProviders(), [{
    id: 'github',
    displayName: 'GitHub',
    kind: 'oauth',
    capabilities: ['signin', 'callback', 'refresh', 'signout', 'session'],
  }]);
  assertEquals((await backend.providers.getProvider('github'))?.displayName, 'GitHub');

  const authn = await backend.authenticate(request());
  assert(authn.ok);
  assertEquals(authn.principal.subject, 'user_123');

  const session = await backend.sessions.getSession({ request: request() });
  assert(session);
  assertEquals(session.id, 'sess_123');
  assertEquals(session.userId, 'user_123');
  assertEquals(session.providerId, 'github');
  assertEquals(session.scopes, ['users:read']);

  const mapping = backend.principalMapper.mapSessionToPrincipal(session);
  assertEquals(mapping.principal.subject, 'user_123');
  assertEquals(mapping.principal.claims.sessionId, 'sess_123');

  const token = await backend.crypto.sealSessionToken(session);
  assertEquals(await backend.crypto.openSessionToken(token), 'sess_123');
});

Deno.test('createBetterAuthBackend throws typed errors for unsupported managed-session operations', async () => {
  const backend = createBetterAuthBackend({
    auth: authInstance({ response: null }),
    sessionTokenSecret: 'x'.repeat(32),
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
    assertEquals(error.backendName, 'better-auth');
    assertEquals(error.operation, operation);
    assert(error.reason.length > 0);
  }
});

type UnsupportedOperationCase = Readonly<{
  operation: string;
  run(): unknown;
}>;

function authInstance(
  result: {
    readonly headers?: Headers;
    readonly response: BetterAuthSessionPayload | null;
  },
): BetterAuthInstance {
  return {
    handler: () => Promise.resolve(new Response(null)),
    api: {
      getSession: () =>
        Promise.resolve({
          headers: result.headers,
          response: result.response,
        }),
    },
  };
}

function request(): AuthnRequest {
  const headers = new Headers({ cookie: 'better-auth.session_token=token' });
  return {
    header: (name: string) => headers.get(name) ?? undefined,
    headers: () => headers,
    cookie: () => undefined,
    method: 'GET',
    path: '/private',
  };
}
