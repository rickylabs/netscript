import { assert, assertEquals } from '@std/assert';
import {
  type BetterAuthInstance,
  createBetterAuthAuthenticator,
  createNetscriptBetterAuth,
} from '../mod.ts';
import type { AuthnRequest } from '@netscript/service/auth';
import type { BetterAuthSessionPayload } from '../src/better-auth.ts';

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
