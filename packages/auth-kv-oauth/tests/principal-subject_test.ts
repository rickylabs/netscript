import { assert, assertEquals, assertExists, assertRejects, assertThrows } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import {
  createKvOAuthFlow,
  createKvOAuthStore,
  defaultPrincipal,
  defineOAuthProvider,
  KvOAuthError,
  type KvOAuthFetch,
  type KvOAuthFlow,
  type NormalizePrincipalContext,
  type OAuthProviderConfig,
  presetProviderKind,
  presetSubjectSource,
  providers,
  resolvePrincipalSubject,
} from '../mod.ts';

const testKey = new ArrayBuffer(32);
new Uint8Array(testKey).fill(7);

const GITHUB_USERINFO = 'https://api.github.com/user';

type RecordedRequest = Readonly<{ url: string; method: string; headers: Headers }>;

/** Fake provider transport: userinfo answers with `userInfo()`, anything else is the token endpoint. */
function providerFetch(
  userInfo: () => Response,
  tokenResponse: Record<string, unknown> = {},
): { fetch: KvOAuthFetch; requests: RecordedRequest[] } {
  const requests: RecordedRequest[] = [];
  const fetch: KvOAuthFetch = (url, init) => {
    requests.push({ url, method: init.method, headers: new Headers(init.headers) });
    if (url === GITHUB_USERINFO || url.endsWith('/userinfo')) {
      return Promise.resolve(userInfo());
    }
    return Promise.resolve(Response.json({
      access_token: 'access_test',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'read:user user:email',
      ...tokenResponse,
    }));
  };
  return { fetch, requests };
}

function github(): OAuthProviderConfig {
  return providers.github({
    clientId: 'client_test',
    clientSecret: 'secret_test',
    redirectUri: 'https://app.example.test/auth/callback',
  });
}

async function flowFor(
  provider: OAuthProviderConfig,
  fetch: KvOAuthFetch,
  normalizePrincipal?: Parameters<typeof createKvOAuthFlow>[0]['normalizePrincipal'],
) {
  const store = await createKvOAuthStore({ kv: new MemoryKvAdapter(), encryptionKey: testKey });
  const flow = createKvOAuthFlow({
    provider,
    store,
    fetch,
    allowInsecureRequests: true,
    normalizePrincipal,
  });
  return { flow, store };
}

/** Runs one full sign-in + callback and returns the callback result. */
async function signInOnce(flow: KvOAuthFlow) {
  const started = await flow.signIn(
    new Request('https://app.example.test/auth/signin', {
      headers: { 'x-forwarded-proto': 'https' },
    }),
  );
  const location = new URL(started.headers.get('location') ?? '');
  const cookie = started.headers.get('set-cookie') ?? '';
  return await flow.handleCallback(
    new Request(
      `https://app.example.test/auth/callback?txn=${location.searchParams.get('txn')}&state=${
        location.searchParams.get('state')
      }&code=code_test`,
      { headers: { cookie, 'x-forwarded-proto': 'https' } },
    ),
  );
}

Deno.test('github sign-ins for the same user yield the same provider-namespaced subject', async () => {
  let login = 'octocat';
  const { fetch } = providerFetch(() => Response.json({ id: 583231, login }));
  const { flow, store } = await flowFor(github(), fetch);

  const first = await signInOnce(flow);
  login = 'octocat-renamed';
  const second = await signInOnce(flow);

  assert(first.sessionId !== second.sessionId);
  assertEquals(first.principal.subject, 'github:583231');
  assertEquals(second.principal.subject, first.principal.subject);
  assertEquals((await store.getSession(second.sessionId))?.session.subject, 'github:583231');
});

Deno.test('userinfo is requested through the injected fetch with bearer and User-Agent headers', async () => {
  const { fetch, requests } = providerFetch(() => Response.json({ id: 42 }));
  const { flow } = await flowFor(github(), fetch);

  await signInOnce(flow);

  const userInfo = requests.filter((entry) => entry.url === GITHUB_USERINFO);
  assertEquals(userInfo.length, 1);
  assertEquals(userInfo[0].method, 'GET');
  assertEquals(userInfo[0].headers.get('authorization'), 'Bearer access_test');
  assertEquals(userInfo[0].headers.get('user-agent'), 'netscript-auth-kv-oauth');
  assert(userInfo[0].headers.get('accept')?.includes('application/json'));
});

Deno.test('sign-in is refused when the configured userinfo subject is missing', async () => {
  const { fetch } = providerFetch(() => Response.json({ login: 'octocat' }));
  const { flow } = await flowFor(github(), fetch);

  const error = await assertRejects(() => signInOnce(flow), KvOAuthError);
  assertEquals(error.code, 'subject_missing');
});

Deno.test('sign-in is refused when the userinfo request fails', async () => {
  const { fetch } = providerFetch(() => new Response('bad credentials', { status: 403 }));
  const { flow } = await flowFor(github(), fetch);

  const error = await assertRejects(() => signInOnce(flow), KvOAuthError);
  assertEquals(error.code, 'userinfo_failed');
});

Deno.test('sign-in is refused when the userinfo response exceeds the size bound', async () => {
  const { fetch } = providerFetch(() =>
    new Response(JSON.stringify({ id: 1, padding: 'x'.repeat(70 * 1024) }))
  );
  const { flow } = await flowFor(github(), fetch);

  const error = await assertRejects(() => signInOnce(flow), KvOAuthError);
  assertEquals(error.code, 'userinfo_failed');
});

Deno.test('a custom mapper composes with defaultPrincipal and keeps its defaults', async () => {
  const { fetch } = providerFetch(() => Response.json({ id: 7 }));
  let seen: NormalizePrincipalContext | undefined;
  const { flow } = await flowFor(github(), fetch, async (context) => {
    seen = context;
    const principal = await defaultPrincipal(context);
    return { ...principal, roles: [...principal.roles, 'member'] };
  });

  const result = await signInOnce(flow);

  assertExists(seen);
  assertEquals(seen.fetch, fetch);
  assertEquals(result.principal.subject, 'github:7');
  assertEquals(result.principal.roles, ['user', 'member']);
  assertEquals(result.principal.scheme, 'custom');
  assertEquals(result.principal.scopes, ['read:user', 'user:email']);
  assertEquals(result.principal.claims.sessionId, result.sessionId);
  assertEquals(result.principal.claims.providerId, 'github');
});

Deno.test('OIDC providers keep the ID-token sub as subject without a userinfo request', async () => {
  const issuer = 'https://idp.example.test';
  const provider = defineOAuthProvider({
    id: 'idp',
    kind: 'oidc',
    clientId: 'client_test',
    clientSecret: 'secret_test',
    authorizationEndpoint: `${issuer}/authorize`,
    tokenEndpoint: `${issuer}/token`,
    userInfoEndpoint: `${issuer}/userinfo`,
    redirectUri: 'https://app.example.test/auth/callback',
    subject: presetSubjectSource('google'),
  });
  let nonce = '';
  const requests: string[] = [];
  const fetch: KvOAuthFetch = (url) => {
    requests.push(url);
    const now = Math.floor(Date.now() / 1000);
    return Promise.resolve(Response.json({
      access_token: 'access_test',
      token_type: 'Bearer',
      expires_in: 3600,
      id_token: unsignedJwt({
        iss: issuer,
        aud: 'client_test',
        sub: 'oidc-user-1',
        iat: now,
        exp: now + 300,
        nonce,
      }),
    }));
  };
  const { flow } = await flowFor(provider, fetch);
  const started = await flow.signIn(
    new Request('https://app.example.test/auth/signin', {
      headers: { 'x-forwarded-proto': 'https' },
    }),
  );
  const location = new URL(started.headers.get('location') ?? '');
  nonce = location.searchParams.get('nonce') ?? '';
  const result = await flow.handleCallback(
    new Request(
      `https://app.example.test/auth/callback?txn=${location.searchParams.get('txn')}&state=${
        location.searchParams.get('state')
      }&code=code_test`,
      { headers: { 'x-forwarded-proto': 'https' } },
    ),
  );

  assertEquals(result.principal.subject, 'oidc-user-1');
  assertEquals(requests, [`${issuer}/token`]);
});

Deno.test('a provider defined without subject requires the ID-token sub, never the session id', async () => {
  const unconfigured = defineOAuthProvider({
    id: 'custom',
    clientId: 'client_test',
    clientSecret: 'secret_test',
    authorizationEndpoint: 'https://issuer.example.test/authorize',
    tokenEndpoint: 'https://issuer.example.test/token',
    redirectUri: 'https://app.example.test/auth/callback',
  });
  assertEquals(unconfigured.subject, { source: 'id_token', claim: 'sub' });

  const context = { tokenSet: { accessToken: 'access_test' }, claims: {} };
  assertEquals(
    await resolvePrincipalSubject({
      ...context,
      provider: unconfigured,
      claims: { sub: 'oidc-user-1' },
    }),
    'oidc-user-1',
  );
  // A hand-built config that omits `subject` gets the same strict default.
  const handBuilt: OAuthProviderConfig = { ...unconfigured, subject: undefined };
  for (const provider of [unconfigured, handBuilt]) {
    const error = await assertRejects(
      () => resolvePrincipalSubject({ ...context, provider }),
      KvOAuthError,
    );
    assertEquals(error.code, 'subject_missing');
  }

  // Full callback: a plain OAuth token response (no ID token) refuses sign-in and writes no session.
  const { fetch } = providerFetch(() => Response.json({ id: 1 }));
  const { flow } = await flowFor(unconfigured, fetch);
  const error = await assertRejects(() => signInOnce(flow), KvOAuthError);
  assertEquals(error.code, 'subject_missing');
});

Deno.test('userinfo subjects support dot paths and refuse non-scalar identifiers', async () => {
  const twitter = providers.twitter({
    clientId: 'client_test',
    redirectUri: 'https://app.example.test/auth/callback',
  });
  const context = {
    provider: twitter,
    tokenSet: { accessToken: 'access_test' },
    claims: {},
  };
  assertEquals(
    await resolvePrincipalSubject({
      ...context,
      fetch: () => Promise.resolve(Response.json({ data: { id: '1234' } })),
    }),
    'twitter:1234',
  );
  const error = await assertRejects(
    () =>
      resolvePrincipalSubject({
        ...context,
        fetch: () => Promise.resolve(Response.json({ data: { id: { nested: true } } })),
      }),
    KvOAuthError,
  );
  assertEquals(error.code, 'subject_missing');
});

Deno.test('provider definitions validate the subject source and presets supply defaults', () => {
  assertEquals(github().subject, {
    source: 'userinfo',
    claim: 'id',
    headers: { 'user-agent': 'netscript-auth-kv-oauth' },
  });
  assertEquals(presetSubjectSource('google'), { source: 'id_token', claim: 'sub' });
  assertEquals(presetSubjectSource('toString'), undefined);
  const base = {
    id: 'custom',
    clientId: 'client_test',
    authorizationEndpoint: 'https://issuer.example.test/authorize',
    tokenEndpoint: 'https://issuer.example.test/token',
    redirectUri: 'https://app.example.test/auth/callback',
  };
  assertThrows(
    () => defineOAuthProvider({ ...base, subject: { source: 'userinfo', claim: 'id' } }),
    KvOAuthError,
    'no userInfoEndpoint',
  );
  assertThrows(
    () => defineOAuthProvider({ ...base, subject: { source: 'id_token', claim: ' ' } }),
    KvOAuthError,
    'requires a claim name',
  );
});

function unsignedJwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(payload)}.c2lnbmF0dXJl`;
}

Deno.test('preset protocol kinds distinguish OAuth, OIDC and custom providers', () => {
  for (const id of ['github', 'discord', 'spotify', 'facebook', 'twitter']) {
    assertEquals(presetProviderKind(id), 'oauth');
  }
  for (
    const id of [
      'google',
      'gitlab',
      'slack',
      'auth0',
      'okta',
      'aws-cognito',
      'azure-ad',
      'logto',
      'clerk',
    ]
  ) {
    assertEquals(presetProviderKind(id), 'oidc');
  }
  assertEquals(presetProviderKind('custom'), undefined);
  assertEquals(presetProviderKind('toString'), undefined);
});
