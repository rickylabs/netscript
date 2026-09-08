/**
 * Executable consumer source, type-checked inside the CLI-generated workspace.
 * Native auth fixture precedent: plugins/auth/tests/services/session-credentials-http_test.ts.
 * @module
 */
export const GUARDED_PLUGIN_PROBE_SOURCE: string = String.raw`
import { assert, assertEquals, assertRejects } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { createPluginService } from '@netscript/plugin/service';
import { createServiceClient } from '@netscript/sdk/client';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';
import { guardedFixtureContractDefinition } from '@netscript/plugin-guarded-fixture-core/contracts/v1';
import { guardedFixtureService } from '@netscript/plugin-guarded-fixture/services';
import { createAuthServiceBackendRegistry } from '__AUTH_SOURCE__/backend-registry.ts';
import { signin, callback } from '__AUTH_SOURCE__/routers/v1-handlers.ts';
import { router } from '__AUTH_SOURCE__/router.ts';
import { currentAuthRequest, withAuthRequest } from '__AUTH_SOURCE__/request-context.ts';

await using kv = new MemoryKvAdapter();
let scope = 'guarded-fixture:read';
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
  fetch: () => Promise.resolve(new Response(JSON.stringify({
    access_token: 'access_test', refresh_token: 'refresh_test', token_type: 'Bearer',
    expires_in: 3600, scope,
  }), { headers: { 'content-type': 'application/json' } })),
});
async function mintSession(scopes: string): Promise<string> {
  scope = scopes;
  const started = await signin({ redirectTo: '/' }, {
    registry,
    request: { url: 'https://app.example.test/api/v1/auth/signin', headers: new Headers({ 'x-forwarded-proto': 'https' }) },
  });
  assert(started.redirectUrl);
  const redirect = new URL(started.redirectUrl);
  const completed = await callback({ code: 'synthetic-code', state: redirect.searchParams.get('state') ?? undefined }, {
    registry,
    request: { url: 'https://app.example.test/api/v1/auth/callback?txn=' + redirect.searchParams.get('txn'), headers: new Headers({ 'x-forwarded-proto': 'https' }) },
  });
  assert(completed.sessionId);
  return completed.sessionId;
}
const reader = await mintSession('guarded-fixture:read');
const writer = await mintSession('guarded-fixture:write');
const auth = await createPluginService(router, {
  name: 'auth', auth: { public: true, reason: 'Native session discovery fixture' },
  middleware: [withAuthRequest],
  context: () => ({ registry, request: currentAuthRequest() }),
  traceContext: false,
}).serve({ port: 0 });
const previousAuthEndpoint = Deno.env.get('services__auth__http__0');
Deno.env.set('services__auth__http__0', 'http://127.0.0.1:' + auth.addr.port);
const requests: { method: string; path: string }[] = [];
let authStopped = false;
try {
  const running = await guardedFixtureService.use(async (context, next) => {
    requests.push({ method: context.req.method, path: new URL(context.req.url).pathname });
    await next();
  }).serve({ port: 0 });
  const discoveryKey = 'services__guarded-fixture__http__0';
  const previousEndpoint = Deno.env.get(discoveryKey);
  const endpoint = 'http://127.0.0.1:' + running.addr.port;
  Deno.env.set(discoveryKey, endpoint);
  try {
    const bearer = createBearerSdkClientContribution<{ accessToken: string }>({
      context: { accessToken: 'required' },
      resolveCredential: ({ context }) => context.accessToken,
      responseCache: { mode: 'direct-only' },
    });
    const client = createServiceClient({
      contract: guardedFixtureContractDefinition,
      serviceName: 'guarded-fixture', routerName: 'guarded-fixture',
      propagateTraceContext: false, contributions: [bearer] as const,
    });
    const read = (accessToken: string) => client.listGuardedFixtures(undefined, { context: { accessToken } });
    const rest = async (token: string | undefined, expected: number) => {
      const response = await fetch(endpoint + '/api/v1/guarded-fixture/guarded-fixture', {
        headers: token === undefined ? {} : { authorization: 'Bearer ' + token },
      });
      assertEquals(response.status, expected);
      const body = await response.text();
      if (expected === 200) assertEquals(JSON.parse(body), []);
    };
    const deniedRpc = async (token: string, expected: number) => {
      const error = await assertRejects(() => read(token));
      assert(error instanceof Error);
      assert('status' in error);
      assertEquals(error.status, expected);
    };
    await rest(undefined, 401);
    await deniedRpc('invalid-session', 401);
    await rest(writer, 403);
    await deniedRpc(writer, 403);
    await rest(reader, 200);
    const beforeRead = requests.length;
    assertEquals(await read(reader), []);
    const sdkRequest = requests.slice(beforeRead).find((request) => request.path === '/api/rpc/v1/guarded-fixture/listGuardedFixtures');
    assert(sdkRequest, 'Native SDK must call the actual RPC procedure');
    assertEquals(sdkRequest.method, 'POST');
    const health = await fetch(endpoint + '/health');
    assertEquals(health.status, 200);
    await health.arrayBuffer();
    await registry.resolveBackend().sessions.revokeSession(reader);
    await rest(reader, 401);
    await deniedRpc(reader, 401);
    await auth.stop();
    authStopped = true;
    await rest(writer, 503);
    await deniedRpc(writer, 503);
    console.info('Generated guarded plugin PASS: native session REST/RPC read200, denied401/403, revoked401, verifier503, public health200; no credentials emitted.');
  } finally {
    await running.stop();
    if (previousEndpoint === undefined) Deno.env.delete(discoveryKey);
    else Deno.env.set(discoveryKey, previousEndpoint);
  }
} finally {
  if (!authStopped) await auth.stop();
  if (previousAuthEndpoint === undefined) Deno.env.delete('services__auth__http__0');
  else Deno.env.set('services__auth__http__0', previousAuthEndpoint);
}
`;
