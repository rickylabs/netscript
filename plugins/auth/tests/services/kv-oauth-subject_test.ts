import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import {
  createAuthServiceBackendRegistry,
  createInMemoryKvOAuthRegistry,
} from '../../services/src/backend-registry.ts';
import { resolveKvOAuthSubjectSource } from '../../services/src/kv-oauth-subject.ts';
import { signin } from '../../services/src/routers/v1-handlers.ts';
import { completeTestCallback } from '../testing/auth-service-fixture.ts';
import { AuthServiceHandlerError } from '../../services/src/routers/v1-types.ts';
import type { ResolvedAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';
import {
  AUTH_TEST_PROVIDER_USER_ID,
  AUTH_TEST_USERINFO_ENDPOINT,
  authTestUrl,
  syntheticProviderFetch,
} from '../testing/auth-fixtures.ts';

async function completeSignIn(registry: ResolvedAuthBackendRegistry) {
  const started = await signin({ redirectTo: '/dashboard' }, {
    registry,
    request: {
      url: authTestUrl('/v1/auth/signin'),
      headers: new Headers({ 'x-forwarded-proto': 'https' }),
    },
  });
  assert(started.redirectUrl);
  const redirect = new URL(started.redirectUrl);
  const completed = await completeTestCallback({
    code: 'code_test',
    state: redirect.searchParams.get('state') ?? undefined,
  }, {
    registry,
    request: {
      url: authTestUrl(`/v1/auth/callback?txn=${redirect.searchParams.get('txn')}`),
      headers: new Headers({ 'x-forwarded-proto': 'https' }),
    },
  });
  return { ...completed.output, sessionId: completed.sessionId };
}

Deno.test('subject source resolves from env, then the named preset, then the ID-token sub', () => {
  assertEquals(resolveKvOAuthSubjectSource({}), { source: 'id_token', claim: 'sub' });
  assertEquals(resolveKvOAuthSubjectSource({ NETSCRIPT_AUTH_PROVIDER_ID: 'github' }), {
    source: 'userinfo',
    claim: 'id',
    headers: { 'user-agent': 'netscript-auth-kv-oauth' },
  });
  assertEquals(
    resolveKvOAuthSubjectSource({
      NETSCRIPT_AUTH_PROVIDER_ID: 'github',
      NETSCRIPT_AUTH_SUBJECT_SOURCE: 'id_token',
    }),
    { source: 'id_token', claim: 'sub' },
  );
  assertEquals(
    resolveKvOAuthSubjectSource({
      NETSCRIPT_AUTH_SUBJECT_SOURCE: 'userinfo',
      NETSCRIPT_AUTH_SUBJECT_CLAIM: 'user_id',
    }),
    { source: 'userinfo', claim: 'user_id', headers: undefined },
  );
  assertThrows(
    () => resolveKvOAuthSubjectSource({ NETSCRIPT_AUTH_SUBJECT_SOURCE: 'session' }),
    Error,
    'NETSCRIPT_AUTH_SUBJECT_SOURCE must be one of id_token, userinfo',
  );
});

Deno.test('github preset id gives repeat sign-ins the same subject through the plugin', async () => {
  const requests: Request[] = [];
  const providerFetch = syntheticProviderFetch();
  const registry = await createInMemoryKvOAuthRegistry({
    env: {
      NETSCRIPT_AUTH_PROVIDER_ID: 'github',
      NETSCRIPT_AUTH_USERINFO_ENDPOINT: AUTH_TEST_USERINFO_ENDPOINT,
    },
    fetch: (input, init) => {
      requests.push(new Request(input, init));
      return providerFetch(input, init);
    },
  });

  const first = await completeSignIn(registry);
  const second = await completeSignIn(registry);

  assert(first.sessionId !== second.sessionId);
  assertEquals(first.subject, `github:${AUTH_TEST_PROVIDER_USER_ID}`);
  assertEquals(second.subject, first.subject);
  const userInfo = requests.filter((request) => request.url === AUTH_TEST_USERINFO_ENDPOINT);
  assertEquals(userInfo.length, 2);
  assertEquals(userInfo[0].headers.get('user-agent'), 'netscript-auth-kv-oauth');
  assertEquals(userInfo[0].headers.get('authorization'), 'Bearer access_test');
});

Deno.test('a configured provider without a stable subject refuses sign-in', async () => {
  const registry = await createInMemoryKvOAuthRegistry({ fetch: syntheticProviderFetch() });

  const error = await assertRejects(() => completeSignIn(registry), AuthServiceHandlerError);
  assertEquals(error.code, 'AUTH_PROVIDER_ERROR');
  assert(error.message.includes('no stable subject'));
});

const KV_KEY = 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=';
// Only builds the local-default redirect URI; nothing listens on it.
const SYNTHETIC_PORT = '43210';

Deno.test('a partially configured provider honours explicit subject settings', async () => {
  // Redirect URI is left to its local default, so the registry's local-defaults transport applies;
  // the explicit userinfo subject must still be used, and refuse when the id is missing.
  const env = {
    NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
    NETSCRIPT_AUTH_CLIENT_ID: 'client_test',
    NETSCRIPT_AUTH_CLIENT_SECRET: 'secret_test',
    NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: 'https://issuer.example.test/oauth/authorize',
    NETSCRIPT_AUTH_TOKEN_ENDPOINT: 'https://issuer.example.test/oauth/token',
    NETSCRIPT_AUTH_USERINFO_ENDPOINT: AUTH_TEST_USERINFO_ENDPOINT,
    NETSCRIPT_AUTH_SUBJECT_SOURCE: 'userinfo',
    NETSCRIPT_AUTH_SUBJECT_CLAIM: 'id',
    NETSCRIPT_AUTH_KV_OAUTH_KEY: KV_KEY,
    PORT: SYNTHETIC_PORT,
  };
  const stable = await createAuthServiceBackendRegistry({
    kv: new MemoryKvAdapter(),
    env,
    fetch: syntheticProviderFetch(),
  });
  const completed = await completeSignIn(stable);
  assertEquals(completed.subject, `default:${AUTH_TEST_PROVIDER_USER_ID}`);
  assert(completed.subject !== completed.sessionId);

  const missingId = await createAuthServiceBackendRegistry({
    kv: new MemoryKvAdapter(),
    env,
    fetch: (input, init) =>
      String(input) === AUTH_TEST_USERINFO_ENDPOINT
        ? Promise.resolve(Response.json({ login: 'renamable' }))
        : syntheticProviderFetch()(input, init),
  });
  const error = await assertRejects(() => completeSignIn(missingId), AuthServiceHandlerError);
  assertEquals(error.code, 'AUTH_PROVIDER_ERROR');
  assert(error.message.includes('no stable subject'));
});

Deno.test('the local-defaults stub never issues a session-id subject', async () => {
  const env = {
    NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
    NETSCRIPT_AUTH_KV_OAUTH_KEY: KV_KEY,
    PORT: SYNTHETIC_PORT,
    // This subject-only test deliberately exercises the stub's HTTP token endpoint.
    NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS: 'true',
  };
  // Even if the stub's placeholder token endpoint answered, the subject is still required.
  const registry = await createAuthServiceBackendRegistry({
    kv: new MemoryKvAdapter(),
    env,
    fetch: syntheticProviderFetch(),
  });
  const error = await assertRejects(() => completeSignIn(registry), AuthServiceHandlerError);
  assert(error.message.includes('no stable subject'));

  await assertRejects(
    () =>
      createAuthServiceBackendRegistry({
        kv: new MemoryKvAdapter(),
        env: { ...env, NETSCRIPT_AUTH_SUBJECT_SOURCE: 'session' },
      }),
    Error,
    'NETSCRIPT_AUTH_SUBJECT_SOURCE must be one of id_token, userinfo',
  );
});

for (const providerId of ['github', 'discord', 'spotify', 'facebook', 'twitter']) {
  Deno.test(`${providerId} runtime preset ignores a stale issuer and resolves userinfo`, async () => {
    const requests: string[] = [];
    const tokenEndpoint = 'https://github.com/login/oauth/access_token';
    const userInfoEndpoint = 'https://api.github.com/user';
    const registry = await createAuthServiceBackendRegistry({
      kv: new MemoryKvAdapter(),
      env: {
        NETSCRIPT_AUTH_PROVIDER_ID: providerId,
        NETSCRIPT_AUTH_TRUST_PROXY_HEADERS: 'true',
        NETSCRIPT_AUTH_CLIENT_ID: 'client_test',
        NETSCRIPT_AUTH_CLIENT_SECRET: 'secret_test',
        NETSCRIPT_AUTH_REDIRECT_URI: authTestUrl('/v1/auth/callback'),
        NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: 'https://github.com/login/oauth/authorize',
        NETSCRIPT_AUTH_TOKEN_ENDPOINT: tokenEndpoint,
        NETSCRIPT_AUTH_USERINFO_ENDPOINT: userInfoEndpoint,
        NETSCRIPT_AUTH_ISSUER: 'https://github.com',
        NETSCRIPT_AUTH_KV_OAUTH_KEY: KV_KEY,
      },
      fetch: (input) => {
        const url = input instanceof Request ? input.url : String(input);
        requests.push(url);
        if (url === userInfoEndpoint) {
          return Promise.resolve(Response.json({ id: 583231, data: { id: 583231 } }));
        }
        if (url === tokenEndpoint) {
          return Promise.resolve(
            Response.json({ access_token: 'access_test', token_type: 'Bearer' }),
          );
        }
        throw new Error(`Unexpected provider request: ${url}`);
      },
    });
    const completed = await completeSignIn(registry);
    assertEquals(completed.subject, `${providerId}:583231`);
    assertEquals(requests, [tokenEndpoint, userInfoEndpoint]);
  });
}
