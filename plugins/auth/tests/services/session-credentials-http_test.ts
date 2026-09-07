import {
  createAuthServiceAuthenticator,
  REMOTE_SESSION_REJECTIONS,
} from '@netscript/plugin-auth-core/authenticator';
import { toAuthnRequest } from '../../services/src/routers/v1-helpers.ts';
import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { createPluginService } from '../../../../packages/plugin/src/service/mod.ts';
import { createServiceClient } from '../../../../packages/sdk/src/client/mod.ts';
import { createBearerSdkClientContribution } from '../../../../packages/plugin-auth-core/src/sdk/mod.ts';
import { authContract } from '../../../../packages/plugin-auth-core/src/contracts/v1/mod.ts';
import { createAuthServiceBackendRegistry } from '../../services/src/backend-registry.ts';
import { callback, signin } from '../../services/src/routers/v1-handlers.ts';
import { router } from '../../services/src/router.ts';
import { currentAuthRequest, withAuthRequest } from '../../services/src/request-context.ts';
import { authTestUrl } from '../testing/auth-fixtures.ts';

Deno.test('native auth service verifies bearer sessions through the SDK and preserves cookies', async () => {
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
  const started = await signin({ redirectTo: '/d' }, {
    registry,
    request: {
      url: authTestUrl('/v1/auth/signin'),
      headers: new Headers({ 'x-forwarded-proto': 'https' }),
    },
  });
  assert(started.redirectUrl);
  const redirect = new URL(started.redirectUrl);
  const completed = await callback({
    code: 'c',
    state: redirect.searchParams.get('state') ?? undefined,
  }, {
    registry,
    request: {
      url: authTestUrl(`/v1/auth/callback?txn=${redirect.searchParams.get('txn')}`),
      headers: new Headers({ 'x-forwarded-proto': 'https' }),
    },
  });
  assert(completed.sessionId);
  const sessionId = completed.sessionId;

  const running = await createPluginService(router, {
    name: 'auth',
    version: '0.0.0',
    port: 0,
    middleware: [withAuthRequest],
    context: () => ({ registry, request: currentAuthRequest() }),
    traceContext: false,
  }).serve({ port: 0 });
  const serviceName = `auth-credentials-test-${crypto.randomUUID()}`;
  Deno.env.set(`services__${serviceName}__http__0`, `http://127.0.0.1:${running.addr.port}`);
  try {
    const plain = createServiceClient({
      contract: authContract,
      serviceName,
      routerName: 'auth',
      propagateTraceContext: false,
    });
    const nativeSession = await plain.session({ sessionId });
    assertEquals(nativeSession.authenticated, true);
    // Exercise the browser cookie transport separately; SDK bearer calls remain typed.
    const cookieResponse = await fetch(
      `http://127.0.0.1:${running.addr.port}/api/rpc/v1/auth/session`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: `__Host-ns_session=${sessionId}` },
        body: JSON.stringify({ json: {} }),
      },
    );
    assertEquals(cookieResponse.status, 200);
    assertEquals((await cookieResponse.json()).json.authenticated, true);
    const bearer = createBearerSdkClientContribution<{ accessToken: string }>({
      context: { accessToken: 'required' },
      resolveCredential: ({ context }) => context.accessToken,
      responseCache: { mode: 'direct-only' },
    });
    const bearerClient = createServiceClient({
      contract: authContract,
      serviceName,
      routerName: 'auth',
      propagateTraceContext: false,
      contributions: [bearer] as const,
    });
    assertEquals(
      (await bearerClient.session(undefined, { context: { accessToken: sessionId } }))
        .authenticated,
      true,
    );
    assertEquals(
      (await bearerClient.session(undefined, { context: { accessToken: 'not-a-session' } }))
        .authenticated,
      false,
    );
    const authenticator = createAuthServiceAuthenticator({ serviceName, timeoutMs: 1000 });
    const request = toAuthnRequest({
      url: authTestUrl('/api/private'),
      headers: new Headers({ authorization: `Bearer ${sessionId}` }),
    });
    const verified = await authenticator.authenticate(request);
    assert(verified.ok);
    assertEquals(verified.principal.scheme, 'bearer');
    assertEquals(verified.principal.claims, nativeSession.session?.claims);
    assertEquals(await authenticator.authenticate(toAuthnRequest(undefined)), {
      ok: false,
      reason: REMOTE_SESSION_REJECTIONS.bearerMissing,
    });
    await registry.resolveBackend().sessions.revokeSession(sessionId);
    assertEquals(await authenticator.authenticate(request), {
      ok: false,
      reason: REMOTE_SESSION_REJECTIONS.notActive,
    });
    assertEquals(
      (await bearerClient.session(undefined, { context: { accessToken: sessionId } }))
        .authenticated,
      false,
    );
  } finally {
    await running.stop();
    Deno.env.delete(`services__${serviceName}__http__0`);
  }
});
