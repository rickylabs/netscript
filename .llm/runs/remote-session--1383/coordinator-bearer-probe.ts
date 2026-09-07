import { MemoryKvAdapter } from '@netscript/kv';
import { createAuthServiceBackendRegistry } from '../../../plugins/auth/services/src/backend-registry.ts';
import {
  callback,
  session,
  signin,
} from '../../../plugins/auth/services/src/routers/v1-handlers.ts';
import { authTestUrl } from '../../../plugins/auth/tests/testing/auth-fixtures.ts';
await using kv = new MemoryKvAdapter();
// Synthetic provider configuration mirrors the native in-memory test fixture.
const registry = await createAuthServiceBackendRegistry({
  kv,
  env: {
    NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
    NETSCRIPT_AUTH_CLIENT_ID: 'client_test',
    NETSCRIPT_AUTH_CLIENT_SECRET: 'secret_test',
    NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: 'https://issuer.example.test/oauth/authorize',
    NETSCRIPT_AUTH_TOKEN_ENDPOINT: 'https://issuer.example.test/oauth/token',
    NETSCRIPT_AUTH_REDIRECT_URI: 'https://app.example.test/api/v1/auth/callback',
    NETSCRIPT_AUTH_KV_OAUTH_KEY: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
    NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS: 'true',
  },
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
if (!started.redirectUrl) throw new Error('fixture sign-in failed');
const redirect = new URL(started.redirectUrl);
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
if (!completed.sessionId) throw new Error('fixture callback failed');
const direct = await session({ sessionId: completed.sessionId }, { registry });
const bearer = await session(undefined, {
  registry,
  request: {
    url: authTestUrl('/v1/auth/session'),
    headers: new Headers({ authorization: `Bearer ${completed.sessionId}` }),
  },
});
const cookie = await session(undefined, {
  registry,
  request: {
    url: authTestUrl('/v1/auth/session'),
    headers: new Headers({ cookie: `__Host-ns_session=${completed.sessionId}` }),
  },
});
console.log(JSON.stringify({
  source: '3330d6f9c9c4fcbf123b434c7cf8733648c44d87',
  scope: 'native KV-OAuth in-memory handler fixture, not HTTP or live identity provider',
  directAuthenticated: direct.authenticated,
  bearerAuthenticated: bearer.authenticated,
  cookieAuthenticated: cookie.authenticated,
  defectReproduced: direct.authenticated && cookie.authenticated && !bearer.authenticated,
}));
