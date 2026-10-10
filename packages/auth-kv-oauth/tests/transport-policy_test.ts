import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import type { AuthnRequest } from '@netscript/service/auth';
import * as oauth from '@panva/oauth4webapi';
import {
  buildCookieHeader,
  createKvOAuthBackend,
  createKvOAuthFlow,
  createKvOAuthStore,
  defineOAuthProvider,
  deriveHttps,
  KvOAuthError,
} from '../mod.ts';
import { discoveryRequestOptions, requestOptions } from '../src/flow.ts';

const provider = defineOAuthProvider({
  id: 'transport-test',
  clientId: 'client_test',
  authorizationEndpoint: 'https://issuer.example.test/authorize',
  tokenEndpoint: 'https://issuer.example.test/token',
  redirectUri: 'https://app.example.test/callback',
  clientAuthMethod: 'none',
});
const encryptionKey = new ArrayBuffer(32);
const tokenFetch = () =>
  Promise.resolve(
    Response.json({ access_token: 'access_test', token_type: 'Bearer', expires_in: 3600 }),
  );

function proxiedRequest(
  path = '/',
  headers: HeadersInit = { 'x-forwarded-proto': 'https' },
): Request {
  return new Request(`http://app.example.test${path}`, { headers });
}

Deno.test('#2026 untrusted spoofed protocol headers cannot satisfy either HTTPS gate', async () => {
  await using kv = new MemoryKvAdapter();
  const store = await createKvOAuthStore({ kv, encryptionKey });
  const flow = createKvOAuthFlow({ provider, store });
  for (
    const headers of [
      new Headers({ 'x-forwarded-proto': 'https' }),
      new Headers({ forwarded: 'for=192.0.2.1;proto=https' }),
    ]
  ) {
    const request = proxiedRequest('/', headers);
    assertFalse(deriveHttps(request));
    const cookieError = assertThrows(() => buildCookieHeader('test', request), KvOAuthError);
    assertEquals(cookieError.code, 'cookie_https_required');
    const signInError = await assertRejects(() => flow.signIn(request), KvOAuthError);
    const callbackError = await assertRejects(() => flow.handleCallback(request), KvOAuthError);
    assertEquals(signInError.code, 'flow_https_required');
    assertEquals(callbackError.code, 'flow_https_required');
    assertStringIncludes(signInError.message, 'flow gate');
    assertStringIncludes(cookieError.message, 'cookie gate');
  }
});

Deno.test('#2026 trusted TLS proxy completes signin callback and signout with Secure cookies', async () => {
  await using kv = new MemoryKvAdapter();
  const store = await createKvOAuthStore({ kv, encryptionKey });
  const backend = await createKvOAuthBackend({
    provider,
    store,
    trustProxyHeaders: true,
    fetch: tokenFetch,
  });
  for (
    const headers of [
      new Headers({ 'x-forwarded-proto': ' HTTPS , http' }),
      new Headers({ forwarded: 'for=192.0.2.1;proto="https", for=192.0.2.2;proto=http' }),
    ]
  ) {
    const signin = await backend.signIn(proxiedRequest('/signin', headers));
    assertEquals(signin.status, 302);
    assertStringIncludes(signin.headers.get('set-cookie')!, 'Secure');
    const redirect = new URL(signin.headers.get('location')!);
    const params = new URLSearchParams({
      txn: redirect.searchParams.get('txn')!,
      state: redirect.searchParams.get('state')!,
      code: 'code_test',
    });
    const callback = await backend.handleCallback(proxiedRequest(`/callback?${params}`, headers));
    assertStringIncludes(callback.response.headers.get('set-cookie')!, 'Secure');
    headers.set('cookie', `__Host-ns_session=${callback.sessionId}`);
    const signout = await backend.signOut(proxiedRequest('/signout', headers));
    assertStringIncludes(signout.headers.get('set-cookie')!, 'Secure');
    assertStringIncludes(signout.headers.get('set-cookie')!, 'Max-Age=0');
    assertEquals(await store.getSession(callback.sessionId), null);
  }
});

Deno.test('#2026 proxy trust preserves outbound HTTPS enforcement for discovery and tokens', async () => {
  await using kv = new MemoryKvAdapter();
  const store = await createKvOAuthStore({ kv, encryptionKey });
  let fetched = false;
  const insecureProvider = defineOAuthProvider({
    id: 'http-provider',
    clientId: 'client_test',
    issuer: 'http://issuer.example.test',
    redirectUri: provider.redirectUri,
    clientAuthMethod: 'none',
  });
  const flow = createKvOAuthFlow({
    provider: insecureProvider,
    store,
    trustProxyHeaders: true,
    fetch: () => {
      fetched = true;
      return tokenFetch();
    },
  });
  const error = await assertRejects(() => flow.signIn(proxiedRequest()), Error);
  // The inbound gate passed; oauth4webapi rejects the HTTP discovery URL before fetch.
  assertStringIncludes(error.message, 'HTTPS');
  assertFalse(error instanceof KvOAuthError);
  assertFalse(fetched);
  assertFalse(requestOptions({})[oauth.allowInsecureRequests]);
});

Deno.test('#2026 outbound relaxation never opens the inbound flow or cookie gates', async () => {
  await using kv = new MemoryKvAdapter();
  const store = await createKvOAuthStore({ kv, encryptionKey });
  const flow = createKvOAuthFlow({ provider, store, allowInsecureRequests: true });
  const error = await assertRejects(() => flow.signIn(proxiedRequest()), KvOAuthError);
  assertEquals(error.code, 'flow_https_required');
  const developmentFlow = createKvOAuthFlow({ provider, store, allowInsecureHttpRequests: true });
  const cookieError = await assertRejects(
    () => developmentFlow.signIn(proxiedRequest()),
    KvOAuthError,
  );
  assertEquals(cookieError.code, 'cookie_https_required');
  const inboundOnly = {
    allowInsecureHttpRequests: true,
    trustProxyHeaders: true,
    allowInsecureRequests: false,
  };
  assertFalse(requestOptions(inboundOnly)[oauth.allowInsecureRequests]);
  assertFalse(discoveryRequestOptions(inboundOnly)[oauth.allowInsecureRequests]);
  const development = createKvOAuthFlow({
    provider,
    store,
    allowInsecureHttpRequests: true,
    cookie: { allowInsecureDev: true },
  });
  assertEquals((await development.signIn(proxiedRequest('/', {}))).status, 302);
});

Deno.test('#2026 protocol policy handles direct TLS precedence and explicit cookie metadata', () => {
  const http = proxiedRequest();
  assertFalse(deriveHttps(http, undefined, false));
  assert(deriveHttps(http, undefined, true));
  assert(
    deriveHttps(
      new Request('https://app.example.test', { headers: { 'x-forwarded-proto': 'http' } }),
    ),
  );
  assertFalse(
    deriveHttps(
      proxiedRequest('/', { 'x-forwarded-proto': 'http', forwarded: 'proto=https' }),
      undefined,
      true,
    ),
  );
  assertFalse(
    deriveHttps(proxiedRequest('/', { forwarded: 'for=192.0.2.1,proto=https' }), undefined, true),
  );
  const authn: AuthnRequest = {
    method: 'GET',
    path: '/',
    header: (name) => http.headers.get(name) ?? undefined,
    headers: () => http.headers,
    cookie: () => undefined,
  };
  assertFalse(deriveHttps(authn));
  assert(deriveHttps(authn, undefined, true));
  assertStringIncludes(buildCookieHeader('session', authn, { trustProxyHeaders: true }), 'Secure');
  assertStringIncludes(buildCookieHeader('session', authn, { secure: true }), 'Secure');
});

Deno.test('#2026 backend refresh cookies use the same top-level proxy trust', async () => {
  await using kv = new MemoryKvAdapter();
  const store = await createKvOAuthStore({ kv, encryptionKey });
  const backend = await createKvOAuthBackend({
    provider,
    store,
    trustProxyHeaders: true,
    fetch: tokenFetch,
  });
  const session = await backend.sessions.createSession({
    userId: 'user',
    subject: 'user',
    expiresAt: new Date(Date.now() + 1000).toISOString(),
  });
  await store.putSession({ session, tokens: { accessToken: 'old', refreshToken: 'refresh' } });
  const headers = new Headers({
    cookie: `__Host-ns_session=${session.id}`,
    'x-forwarded-proto': 'https',
  });
  const result = await backend.authenticate({
    method: 'GET',
    path: '/',
    headers: () => headers,
    header: (name) => headers.get(name) ?? undefined,
    cookie: () => session.id,
  });
  assert(result.ok);
  assertStringIncludes(result.setCookies![0], 'Secure');
});

Deno.test('#2026 plain HTTP flow and cookie refusals expose distinct gate diagnostics', async () => {
  await using kv = new MemoryKvAdapter();
  const store = await createKvOAuthStore({ kv, encryptionKey });
  const request = proxiedRequest('/', {});
  const flow = createKvOAuthFlow({ provider, store });
  const flowError = await assertRejects(() => flow.signIn(request), KvOAuthError);
  const cookieError = assertThrows(() => buildCookieHeader('test', request), KvOAuthError);
  assertEquals(flowError.code, 'flow_https_required');
  assertEquals(cookieError.code, 'cookie_https_required');
  assertStringIncludes(flowError.message, 'flow gate');
  assertStringIncludes(cookieError.message, 'cookie gate');
});

Deno.test('#2026 trusted proxy does not permit an outbound HTTP token endpoint', async () => {
  await using kv = new MemoryKvAdapter();
  const store = await createKvOAuthStore({ kv, encryptionKey });
  let fetched = false;
  const flow = createKvOAuthFlow({
    provider: defineOAuthProvider({
      id: 'http-token-provider',
      clientId: 'client_test',
      clientAuthMethod: 'none',
      authorizationEndpoint: 'https://issuer.example.test/authorize',
      tokenEndpoint: 'http://issuer.example.test/token',
      redirectUri: provider.redirectUri,
    }),
    store,
    trustProxyHeaders: true,
    fetch: () => {
      fetched = true;
      return tokenFetch();
    },
  });
  const signin = await flow.signIn(proxiedRequest());
  const redirect = new URL(signin.headers.get('location')!);
  const params = new URLSearchParams({
    txn: redirect.searchParams.get('txn')!,
    state: redirect.searchParams.get('state')!,
    code: 'test',
  });
  const error = await assertRejects(
    () => flow.handleCallback(proxiedRequest(`/callback?${params}`)),
    Error,
  );
  assertStringIncludes(error.message, 'HTTPS');
  assertFalse(error instanceof KvOAuthError);
  assertFalse(fetched);
});
