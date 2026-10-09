import { assert, assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@^1';
import { createInMemoryKvOAuthRegistry } from '../../services/src/backend-registry.ts';
import { resolveKvOAuthSubjectSource } from '../../services/src/kv-oauth-subject.ts';
import { callback, signin } from '../../services/src/routers/v1-handlers.ts';
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
  return await callback({
    code: 'code_test',
    state: redirect.searchParams.get('state') ?? undefined,
  }, {
    registry,
    request: {
      url: authTestUrl(`/v1/auth/callback?txn=${redirect.searchParams.get('txn')}`),
      headers: new Headers({ 'x-forwarded-proto': 'https' }),
    },
  });
}

Deno.test('subject source resolves from env, then the named preset, then the ID-token sub', () => {
  assertEquals(resolveKvOAuthSubjectSource({}, true), undefined);
  assertEquals(resolveKvOAuthSubjectSource({}, false), { source: 'id_token', claim: 'sub' });
  assertEquals(resolveKvOAuthSubjectSource({ NETSCRIPT_AUTH_PROVIDER_ID: 'github' }, false), {
    source: 'userinfo',
    claim: 'id',
    headers: { 'user-agent': 'netscript-auth-kv-oauth' },
  });
  assertEquals(
    resolveKvOAuthSubjectSource({
      NETSCRIPT_AUTH_PROVIDER_ID: 'github',
      NETSCRIPT_AUTH_SUBJECT_SOURCE: 'id_token',
    }, false),
    { source: 'id_token', claim: 'sub' },
  );
  assertEquals(
    resolveKvOAuthSubjectSource({
      NETSCRIPT_AUTH_SUBJECT_SOURCE: 'userinfo',
      NETSCRIPT_AUTH_SUBJECT_CLAIM: 'user_id',
    }, false),
    { source: 'userinfo', claim: 'user_id', headers: undefined },
  );
  assertThrows(
    () => resolveKvOAuthSubjectSource({ NETSCRIPT_AUTH_SUBJECT_SOURCE: 'session' }, false),
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
