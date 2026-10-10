import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import {
  createKvOAuthBackend,
  createKvOAuthStore,
  defineOAuthProvider,
} from '@netscript/auth-kv-oauth';
import { createAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';
import { KvOAuthError } from '@netscript/auth-kv-oauth/errors';
import { authContract } from '@netscript/plugin-auth-core/contracts/v1';
import { createAuthServiceBackendRegistry } from '../../services/src/backend-registry.ts';
import { callback, signin } from '../../services/src/routers/v1-handlers.ts';
import { providerFailure, toAuthnRequest } from '../../services/src/routers/v1-helpers.ts';
import { AuthServiceHandlerError } from '../../services/src/routers/v1-types.ts';
import { serveAuthTestService } from '../testing/auth-service-fixture.ts';

const env = {
  NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
  NETSCRIPT_AUTH_CLIENT_ID: 'client_test',
  NETSCRIPT_AUTH_CLIENT_SECRET: 'secret_test',
  NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: 'https://issuer.example.test/authorize',
  NETSCRIPT_AUTH_TOKEN_ENDPOINT: 'https://issuer.example.test/token',
  NETSCRIPT_AUTH_USERINFO_ENDPOINT: 'https://issuer.example.test/userinfo',
  NETSCRIPT_AUTH_SUBJECT_SOURCE: 'userinfo',
  NETSCRIPT_AUTH_SUBJECT_CLAIM: 'id',
  NETSCRIPT_AUTH_REDIRECT_URI: 'https://app.example.test/api/v1/auth/callback',
  NETSCRIPT_AUTH_KV_OAUTH_KEY: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
};
const request = {
  url: 'http://app.example.test/signin',
  headers: new Headers({ 'x-forwarded-proto': 'https' }),
};
const tokenFetch: typeof fetch = (input) =>
  Promise.resolve(
    String(input) === env.NETSCRIPT_AUTH_USERINFO_ENDPOINT
      ? Response.json({ id: 'transport-user' })
      : Response.json({ access_token: 'access_test', token_type: 'Bearer', expires_in: 3600 }),
  );

Deno.test('#2026 plugin proxy env opt-in drives both signin and callback without outbound relaxation', async () => {
  await using kv = new MemoryKvAdapter();
  const registry = await createAuthServiceBackendRegistry({
    kv,
    env: { ...env, NETSCRIPT_AUTH_TRUST_PROXY_HEADERS: 'true' },
    fetch: tokenFetch,
  });
  const started = await signin({}, { registry, request });
  assert(started.redirectUrl);
  const redirect = new URL(started.redirectUrl);
  const result = await callback({ code: 'test', state: redirect.searchParams.get('state')! }, {
    registry,
    request: {
      ...request,
      url: `http://app.example.test/callback?txn=${redirect.searchParams.get('txn')}`,
    },
  });
  assertEquals(result.completed, true);
});

Deno.test('#2026 plugin outbound opt-in does not bypass inbound transport refusal', async () => {
  await using kv = new MemoryKvAdapter();
  const registry = await createAuthServiceBackendRegistry({
    kv,
    env: { ...env, NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS: 'true' },
  });
  const error = await assertRejects(
    () => signin({}, { registry, request }),
    AuthServiceHandlerError,
  );
  assertEquals(error.code, 'AUTH_TRANSPORT_ERROR');
  assertEquals(error.status, 400);
});

Deno.test('#2026 missing or partial provider config never implicitly enables HTTP', async () => {
  for (
    const partial of [{}, { NETSCRIPT_AUTH_CLIENT_ID: 'client_test' }, {
      NETSCRIPT_AUTH_REDIRECT_URI: 'https://app.example.test/callback',
    }]
  ) {
    await using kv = new MemoryKvAdapter();
    const registry = await createAuthServiceBackendRegistry({
      kv,
      env: {
        NETSCRIPT_AUTH_KV_OAUTH_KEY: env.NETSCRIPT_AUTH_KV_OAUTH_KEY,
        PORT: '8094',
        ...partial,
      },
    });
    const error = await assertRejects(
      () => signin({}, { registry, request }),
      AuthServiceHandlerError,
    );
    assertEquals(error.code, 'AUTH_TRANSPORT_ERROR');
    assertEquals(error.status, 400);
  }
});

Deno.test('#2026 plugin inbound development opt-in opens both inbound gates explicitly', async () => {
  await using kv = new MemoryKvAdapter();
  const registry = await createAuthServiceBackendRegistry({
    kv,
    env: { ...env, NETSCRIPT_AUTH_ALLOW_INSECURE_HTTP_REQUESTS: 'true' },
  });
  assertEquals(
    (await signin({}, { registry, request: { ...request, headers: new Headers() } })).started,
    true,
  );
});

Deno.test('#2026 backend transport and configuration refusals have declared non-502 errors', () => {
  for (const code of ['flow_https_required', 'cookie_https_required'] as const) {
    const error = providerFailure(new KvOAuthError(code, 'HTTPS refused'), 'kv-oauth');
    assertEquals(error.code, 'AUTH_TRANSPORT_ERROR');
    assertEquals(error.status, 400);
    assertEquals(error.data, { providerId: 'kv-oauth', reason: 'HTTPS refused' });
  }
  const config = providerFailure(new KvOAuthError('configuration_error', 'Cookie config refused'));
  assertEquals(config.code, 'AUTH_CONFIGURATION_ERROR');
  assertEquals(config.status, 400);
  const upstream = providerFailure(new KvOAuthError('token_exchange_failed', 'Upstream refused'));
  assertEquals(upstream.code, 'AUTH_PROVIDER_ERROR');
  assertEquals(upstream.status, 502);
  const errors = authContract.signin['~orpc'].errorMap;
  assert(errors.AUTH_TRANSPORT_ERROR);
  assert(errors.AUTH_CONFIGURATION_ERROR);
  assertEquals(errors.AUTH_TRANSPORT_ERROR.status, 400);
  assertEquals(errors.AUTH_CONFIGURATION_ERROR.status, 400);
});

Deno.test('#2026 actual HTTP auth boundary emits 400 for untrusted flow refusals', async () => {
  await using kv = new MemoryKvAdapter();
  const registry = await createAuthServiceBackendRegistry({ kv, env });
  await using service = await serveAuthTestService(registry);
  for (const path of ['signin', 'callback']) {
    const response = await fetch(`${service.baseUrl}/api/v1/auth/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-proto': 'https' },
      body: '{}',
    });
    assertEquals(response.status, 400);
    const body = await response.json();
    assertEquals(body.code, 'AUTH_TRANSPORT_ERROR');
    assertStringIncludes(body.message, 'flow gate');
  }
});

Deno.test('#2026 HTTP cookie and configuration gates retain distinct reasons and return 400', async () => {
  await using kv = new MemoryKvAdapter();
  const store = await createKvOAuthStore({ kv, encryptionKey: new ArrayBuffer(32) });
  for (const cookie of [{}, { path: '/auth' }]) {
    const backend = await createKvOAuthBackend({
      provider: defineOAuthProvider({
        id: 'test',
        clientId: 'client_test',
        clientAuthMethod: 'none',
        authorizationEndpoint: env.NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT,
        tokenEndpoint: env.NETSCRIPT_AUTH_TOKEN_ENDPOINT,
        redirectUri: env.NETSCRIPT_AUTH_REDIRECT_URI,
      }),
      store,
      allowInsecureHttpRequests: true,
      cookie,
    });
    const registry = createAuthBackendRegistry(new Map([['kv-oauth', backend]]), 'kv-oauth');
    await using service = await serveAuthTestService(registry);
    const response = await fetch(`${service.baseUrl}/api/v1/auth/signin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assertEquals(response.status, 400);
    const body = await response.json();
    assertEquals(body.code, cookie.path ? 'AUTH_CONFIGURATION_ERROR' : 'AUTH_TRANSPORT_ERROR');
    assertStringIncludes(body.message, cookie.path ? 'Path=/' : 'cookie gate');
  }
});

Deno.test('#2026 plugin direct TLS signin and near-expiry refresh honor the secure cookie env', async () => {
  await using kv = new MemoryKvAdapter();
  let tokenRequests = 0;
  const registry = await createAuthServiceBackendRegistry({
    kv,
    env: { ...env, NETSCRIPT_AUTH_COOKIE_SECURE: 'true' },
    fetch: (input) => {
      if (String(input) === env.NETSCRIPT_AUTH_USERINFO_ENDPOINT) {
        return Promise.resolve(Response.json({ id: 'transport-user' }));
      }
      tokenRequests++;
      return Promise.resolve(Response.json({
        access_token: 'access_test',
        refresh_token: 'refresh_test',
        token_type: 'Bearer',
        expires_in: 60,
      }));
    },
  });
  const backend = registry.resolveBackend();
  assert(backend.interactive);
  const started = await backend.interactive.signIn(new Request('https://app.example.test/signin'));
  assertEquals(started.status, 302);
  assertStringIncludes(started.headers.get('set-cookie')!, 'Secure');
  const redirect = new URL(started.headers.get('location')!);
  const params = new URLSearchParams({
    txn: redirect.searchParams.get('txn')!,
    state: redirect.searchParams.get('state')!,
    code: 'code_test',
  });
  const completed = await backend.interactive.handleCallback(
    new Request(`https://app.example.test/callback?${params}`),
  );
  const result = await backend.authenticate(toAuthnRequest({
    url: 'https://app.example.test/session',
    headers: new Headers({ cookie: `__Host-ns_session=${completed.sessionId}` }),
  }));
  assert(result.ok);
  assertStringIncludes(result.setCookies![0], 'Secure');
  assertEquals(tokenRequests, 2);
});

Deno.test('#2026 missing captured service request is an INTERNAL server invariant', async () => {
  await using kv = new MemoryKvAdapter();
  const registry = await createAuthServiceBackendRegistry({ kv, env });
  for (const handler of [signin, callback]) {
    const error = await assertRejects(() => handler({}, { registry }), AuthServiceHandlerError);
    assertEquals(error.code, 'INTERNAL');
    assertEquals(error.status, 500);
    assertEquals(error.data, {});
    assertEquals(providerFailure(error), error);
  }
  const internal = authContract.signin['~orpc'].errorMap.INTERNAL;
  assert(internal);
  assertEquals(internal.status, 500);
});
