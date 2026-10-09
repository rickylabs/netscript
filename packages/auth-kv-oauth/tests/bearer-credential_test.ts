/**
 * `authenticate` port conformance for bearer session credentials (#2120).
 *
 * The backend must resolve a request credential exactly as
 * `sessions.getSession({ token: readBearerCredential(request), request })` does.
 */

import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import {
  type AuthnRequest,
  createKvOAuthBackend,
  createKvOAuthStore,
  defineOAuthProvider,
  type KvOAuthBackend,
  type KvOAuthStore,
  parseCookieHeader,
} from '../mod.ts';
import { readBearerCredential } from '@netscript/plugin-auth-core/authenticator';

const testKey = new ArrayBuffer(32);
new Uint8Array(testKey).fill(7);

function authnRequest(init: HeadersInit): AuthnRequest {
  const headers = new Headers(init);
  headers.set('x-forwarded-proto', 'https');
  return {
    method: 'GET',
    path: '/rpc',
    header: (name) => headers.get(name) ?? undefined,
    headers: () => headers,
    cookie: (name) => parseCookieHeader(headers.get('cookie') ?? undefined).get(name),
  };
}

async function createBackend(
  fetch?: typeof globalThis.fetch,
): Promise<{ backend: KvOAuthBackend; store: KvOAuthStore }> {
  const store = await createKvOAuthStore({ kv: new MemoryKvAdapter(), encryptionKey: testKey });
  const backend = await createKvOAuthBackend({
    provider: defineOAuthProvider({
      id: 'stub',
      displayName: 'Stub',
      clientId: 'client_test',
      clientSecret: 'secret_test',
      authorizationEndpoint: 'https://issuer.example.test/oauth/authorize',
      tokenEndpoint: 'https://issuer.example.test/oauth/token',
      redirectUri: 'https://app.example.test/auth/callback',
    }),
    store,
    allowInsecureRequests: true,
    fetch,
  });
  return { backend, store };
}

async function createSession(backend: KvOAuthBackend, subject: string, ttlMs = 3_600_000) {
  return await backend.sessions.createSession({
    userId: subject,
    providerId: 'stub',
    subject,
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  });
}

async function authenticatedSubject(
  backend: KvOAuthBackend,
  headers: HeadersInit,
): Promise<string | undefined> {
  const result = await backend.authenticate(authnRequest(headers));
  return result.ok ? result.principal.subject : undefined;
}

async function sessionSubject(
  backend: KvOAuthBackend,
  headers: HeadersInit,
): Promise<string | undefined> {
  const request = authnRequest(headers);
  const session = await backend.sessions.getSession({
    token: readBearerCredential(request),
    request,
  });
  return session?.subject;
}

Deno.test('kv-oauth authenticate resolves credentials exactly like sessions.getSession', async () => {
  const { backend } = await createBackend();
  const bearerOwner = await createSession(backend, 'bearer_owner');
  const cookieOwner = await createSession(backend, 'cookie_owner');
  const cookie = `__Host-ns_session=${cookieOwner.id}`;
  const cases: readonly [string, HeadersInit, string | undefined][] = [
    ['cookie', { cookie }, 'cookie_owner'],
    ['bearer', { authorization: `Bearer ${bearerOwner.id}` }, 'bearer_owner'],
    ['lowercase scheme', { authorization: `bearer ${bearerOwner.id}` }, 'bearer_owner'],
    ['bearer beats cookie', { authorization: `Bearer ${bearerOwner.id}`, cookie }, 'bearer_owner'],
    ['invalid bearer beats cookie', { authorization: 'Bearer not-a-session', cookie }, undefined],
    ['malformed header falls back', { authorization: 'Bearer a b', cookie }, 'cookie_owner'],
    ['non-bearer scheme falls back', { authorization: 'Basic credential', cookie }, 'cookie_owner'],
    ['no credential', {}, undefined],
  ];
  for (const [name, headers, expected] of cases) {
    assertEquals(await sessionSubject(backend, headers), expected, name);
    assertEquals(await authenticatedSubject(backend, headers), expected, name);
  }
  assertEquals(await backend.authenticate(authnRequest({})), {
    ok: false,
    reason: 'kv_oauth_session_missing',
  });
});

Deno.test('kv-oauth refresh-on-read re-issues a cookie only for a cookie-borne session', async () => {
  const { backend, store } = await createBackend(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          access_token: 'access_rotated',
          refresh_token: 'refresh_rotated',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
        { headers: { 'content-type': 'application/json' } },
      ),
    )
  );
  const nearExpiry = async (subject: string) => {
    const session = await createSession(backend, subject, 1000);
    await store.putSession({
      session,
      tokens: { accessToken: 'access_test', refreshToken: 'refresh_test' },
    });
    return session.id;
  };

  const bearerId = await nearExpiry('bearer_owner');
  const viaBearer = await backend.authenticate(
    authnRequest({ authorization: `Bearer ${bearerId}` }),
  );
  assert(viaBearer.ok);
  assertEquals(viaBearer.setCookies, undefined);
  assert((await store.getSession(bearerId))?.session.refreshedAt, 'bearer read still refreshes');

  const cookieId = await nearExpiry('cookie_owner');
  const viaCookie = await backend.authenticate(
    authnRequest({ cookie: `__Host-ns_session=${cookieId}` }),
  );
  assert(viaCookie.ok);
  assertEquals(viaCookie.setCookies?.length, 1);
});
