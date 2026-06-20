import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import type { AuthnRequest } from '@netscript/service/auth';
import {
  buildCookieHeader,
  clearCookieHeader,
  createKvOAuthBackend,
  createKvOAuthCrypto,
  createKvOAuthFlow,
  createKvOAuthStore,
  defineOAuthProvider,
  KvOAuthError,
  parseCookieHeader,
  providers,
} from '../mod.ts';

const testKey = new Uint8Array(32).fill(7).buffer;

function provider(): ReturnType<typeof defineOAuthProvider> {
  return defineOAuthProvider({
    id: 'stub',
    displayName: 'Stub',
    clientId: 'client_test',
    clientSecret: 'secret_test',
    authorizationEndpoint: 'https://issuer.example.test/oauth/authorize',
    tokenEndpoint: 'https://issuer.example.test/oauth/token',
    userInfoEndpoint: 'https://issuer.example.test/me',
    redirectUri: 'https://app.example.test/auth/callback',
    scopes: ['profile', 'email', 'offline_access'],
  });
}

function request(url = 'https://app.example.test/', cookie?: string): Request {
  return new Request(url, {
    headers: cookie ? { cookie, 'x-forwarded-proto': 'https' } : { 'x-forwarded-proto': 'https' },
  });
}

function authnRequest(cookie?: string): AuthnRequest {
  const headers = new Headers(
    cookie ? { cookie, 'x-forwarded-proto': 'https' } : { 'x-forwarded-proto': 'https' },
  );
  return {
    method: 'GET',
    path: '/rpc',
    header: (name) => headers.get(name) ?? undefined,
    headers: () => headers,
    cookie: (name) => parseCookieHeader(headers.get('cookie') ?? undefined).get(name),
  };
}

Deno.test('provider presets normalize descriptors and enforce client auth shape', () => {
  const google = providers.google({
    clientId: 'client_test',
    clientSecret: 'secret_test',
    redirectUri: 'https://app.example.test/auth/callback',
  });

  assertEquals(google.kind, 'oidc');
  assertEquals(google.scopes, ['openid', 'profile', 'email']);
  assertThrows(
    () =>
      defineOAuthProvider({
        id: 'bad',
        clientId: 'client_test',
        redirectUri: 'https://app.example.test/auth/callback',
        authorizationEndpoint: 'https://issuer.example.test/oauth/authorize',
        tokenEndpoint: 'https://issuer.example.test/oauth/token',
        clientAuthMethod: 'client_secret_basic',
      }),
    KvOAuthError,
  );
});

Deno.test('crypto seals and opens token payloads with a key id prefix', async () => {
  const cryptoPort = await createKvOAuthCrypto(testKey, 'active');
  const sealed = await cryptoPort.seal({ accessToken: 'access_test' });
  assertStringIncludes(sealed, 'active.');
  assertEquals(await cryptoPort.open(sealed), { accessToken: 'access_test' });
});

Deno.test('cookies use __Host, HttpOnly, Secure and proxy-derived HTTPS', () => {
  const header = buildCookieHeader('sess_test', request());
  assertStringIncludes(header, '__Host-ns_session=sess_test');
  assertStringIncludes(header, 'HttpOnly');
  assertStringIncludes(header, 'Secure');
  assertStringIncludes(header, 'SameSite=Lax');
  assertStringIncludes(clearCookieHeader(request()), 'Max-Age=0');
});

Deno.test('KV store round-trips sessions, consumes txns once, and CAS-rotates', async () => {
  const store = await createKvOAuthStore({ kv: new MemoryKvAdapter(), encryptionKey: testKey });
  const txn = await store.putTxn({
    providerId: 'stub',
    state: 'state_test',
    codeVerifier: 'verifier_test',
    returnTo: 'https://app.example.test/',
  });
  assertEquals((await store.takeTxn(txn.id))?.state, 'state_test');
  assertEquals(await store.takeTxn(txn.id), null);

  const record = await store.putSession({
    session: {
      id: 'sess_test',
      userId: 'user_test',
      providerId: 'stub',
      state: 'active',
      subject: 'user_test',
      scopes: ['email'],
      roles: ['user'],
      claims: {},
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    },
    tokens: { accessToken: 'access_test', refreshToken: 'refresh_test' },
  });
  assertEquals((await store.openTokens(record.tokens)).refreshToken, 'refresh_test');
  assertEquals((await store.getSession('sess_test'))?.session.subject, 'user_test');
  assert(
    await store.rotateSession('sess_test', {
      ...record,
      session: { ...record.session, roles: ['admin'] },
    }),
  );
  assertEquals((await store.getSession('sess_test'))?.session.roles, ['admin']);
});

Deno.test('flow rejects open redirects before creating an authorization redirect', async () => {
  const store = await createKvOAuthStore({ kv: new MemoryKvAdapter(), encryptionKey: testKey });
  const flow = createKvOAuthFlow({
    provider: provider(),
    store,
    allowInsecureRequests: true,
    allowedReturnTo: ['https://app.example.test/'],
  });
  await assertRejects(
    () =>
      flow.signIn(
        request('https://app.example.test/auth/signin?returnTo=https://evil.example.test/'),
      ),
    KvOAuthError,
    'Return URL',
  );
});

Deno.test('flow performs sign-in and callback with single-use state', async () => {
  const store = await createKvOAuthStore({ kv: new MemoryKvAdapter(), encryptionKey: testKey });
  const flow = createKvOAuthFlow({
    provider: provider(),
    store,
    allowInsecureRequests: true,
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

  const signIn = await flow.signIn(
    request('https://app.example.test/auth/signin?returnTo=/dashboard'),
  );
  const location = new URL(signIn.headers.get('location')!);
  const txnCookie = signIn.headers.get('set-cookie')!;
  assertEquals(location.searchParams.get('code_challenge_method'), 'S256');

  await assertRejects(
    () =>
      flow.handleCallback(
        request(
          `https://app.example.test/auth/callback?txn=${
            location.searchParams.get('txn')
          }&state=wrong&code=code_test`,
          txnCookie,
        ),
      ),
  );

  const secondSignIn = await flow.signIn(
    request('https://app.example.test/auth/signin?returnTo=/dashboard'),
  );
  const secondLocation = new URL(secondSignIn.headers.get('location')!);
  const secondTxnCookie = secondSignIn.headers.get('set-cookie')!;

  const callback = await flow.handleCallback(
    request(
      `https://app.example.test/auth/callback?txn=${secondLocation.searchParams.get('txn')}&state=${
        secondLocation.searchParams.get('state')
      }&code=code_test`,
      secondTxnCookie,
    ),
  );
  assertEquals(callback.response.status, 302);
  assertEquals(new URL(callback.response.headers.get('location')!).pathname, '/dashboard');
  assertExists(await store.getSession(callback.sessionId));

  await assertRejects(
    () =>
      flow.handleCallback(
        request(
          `https://app.example.test/auth/callback?txn=${location.searchParams.get('txn')}&state=${
            location.searchParams.get('state')
          }&code=code_test`,
          txnCookie,
        ),
      ),
    KvOAuthError,
    'already used',
  );
});

Deno.test('backend implements providers, sessions, crypto, principal mapping, and authenticate', async () => {
  const store = await createKvOAuthStore({ kv: new MemoryKvAdapter(), encryptionKey: testKey });
  const backend = await createKvOAuthBackend({
    provider: provider(),
    store,
    allowInsecureRequests: true,
  });
  assertEquals(backend.name, 'kv-oauth');
  assertEquals((await backend.providers.listProviders())[0]?.id, 'stub');
  assertEquals(
    (await backend.providers.getProvider('stub'))?.capabilities.includes('refresh'),
    true,
  );

  const session = await backend.sessions.createSession({
    userId: 'user_test',
    providerId: 'stub',
    subject: 'user_test',
    scopes: ['email'],
    roles: ['user'],
    claims: { email: 'test@example.test' },
    expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
  });
  const sealed = await backend.crypto.sealSessionToken(session);
  assertEquals(await backend.crypto.openSessionToken(sealed), session.id);
  assertEquals(backend.principalMapper.mapSessionToPrincipal(session).principal.scheme, 'custom');

  const result = await backend.authenticate(authnRequest(`__Host-ns_session=${session.id}`));
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.principal.subject, 'user_test');
  }

  const missing = await backend.authenticate(authnRequest());
  assertEquals(missing, { ok: false, reason: 'kv_oauth_session_missing' });
});

Deno.test('backend refreshes near-expiry sessions and detects refresh-token reuse', async () => {
  const store = await createKvOAuthStore({ kv: new MemoryKvAdapter(), encryptionKey: testKey });
  const backend = await createKvOAuthBackend({
    provider: provider(),
    store,
    allowInsecureRequests: true,
    fetch: () =>
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
      ),
  });
  const session = await backend.sessions.createSession({
    userId: 'user_test',
    providerId: 'stub',
    subject: 'user_test',
    expiresAt: new Date(Date.now() + 1000).toISOString(),
  });
  await store.putSession({
    session,
    tokens: {
      accessToken: 'access_test',
      refreshToken: 'refresh_test',
      expiresAt: session.expiresAt,
    },
  });
  const refreshed = await backend.authenticate(authnRequest(`__Host-ns_session=${session.id}`));
  assertEquals(refreshed.ok, true);
  if (refreshed.ok) {
    assertEquals(refreshed.setCookies?.length, 1);
  }

  const record = await store.getSession(session.id);
  assertExists(record);
  const compromised = {
    ...record,
    tokens: await store.sealTokens({ accessToken: 'access_test', refreshToken: 'stolen_refresh' }),
    session: { ...record.session, expiresAt: new Date(Date.now() + 1000).toISOString() },
  };
  await store.rotateSession(session.id, compromised);
  const rejected = await backend.authenticate(authnRequest(`__Host-ns_session=${session.id}`));
  assertEquals(rejected, { ok: false, reason: 'kv_oauth_refresh_failed' });
  assertEquals(await store.getSession(session.id), null);
});
