/** Executable generated-service acceptance, sharing HttpGate's exact exchange primitive. */
export const GUARDED_SERVICE_PROBE_SOURCE: string = String.raw`
import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { createPluginService } from '@netscript/plugin/service';
import { createAuthServiceBackendRegistry } from '__AUTH_SOURCE__/backend-registry.ts';
import { signin } from '__AUTH_SOURCE__/routers/v1-handlers.ts';
import { router } from '__AUTH_SOURCE__/router.ts';
import { currentAuthRequest, withAuthRequest } from '__AUTH_SOURCE__/request-context.ts';
import { httpExchangeInit, judgeHttpResponse, type HttpExchangeContract } from '__HTTP_CONTRACT__';

await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
let scope = 'guarded:read';
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
    NETSCRIPT_AUTH_USERINFO_ENDPOINT: 'https://issuer.example.test/oauth/userinfo',
    NETSCRIPT_AUTH_SUBJECT_SOURCE: 'userinfo',
    NETSCRIPT_AUTH_SUBJECT_CLAIM: 'id',
  },
  fetch: (input) => Promise.resolve(
    String(input instanceof Request ? input.url : input).endsWith('/oauth/userinfo')
      ? Response.json({ id: 4242 })
      : Response.json({
        access_token: 'access_test', refresh_token: 'refresh_test', token_type: 'Bearer',
        expires_in: 3600, scope,
      }),
  ),
});
async function mintSession(scopes: string): Promise<string> {
  scope = scopes;
  const started = await signin({ redirectTo: '/' }, {
    registry,
    request: { url: 'https://app.example.test/api/v1/auth/signin', headers: new Headers({ 'x-forwarded-proto': 'https' }) },
  });
  assert(started.redirectUrl);
  const redirect = new URL(started.redirectUrl);
  const flow = registry.resolveBackend().interactive;
  assert(flow);
  const params = new URLSearchParams({ code: 'synthetic-code', state: redirect.searchParams.get('state')!, txn: redirect.searchParams.get('txn')! });
  const completed = await flow.handleCallback(new Request('https://app.example.test/api/v1/auth/callback?' + params));
  assert(completed.sessionId);
  return completed.sessionId;
}
const permitted = await mintSession('guarded:read');
const insufficient = await mintSession('other:read');
const auth = await createPluginService(router, {
  name: 'auth', auth: { public: true, reason: 'Native session verification fixture' },
  middleware: [withAuthRequest],
  context: () => ({ registry, request: currentAuthRequest() }),
  traceContext: false,
}).serve({ port: 0 });
const discoveryKey = 'services__auth__http__0';
const previousEndpoint = Deno.env.get(discoveryKey);
const previousPort = Deno.env.get('PORT');
const serviceKey = 'services__guarded__http__0';
const previousService = Deno.env.get(serviceKey);
Deno.env.set(discoveryKey, 'http://127.0.0.1:' + auth.addr.port);
Deno.env.set('PORT', '0');
try {
  // This is the generated entrypoint, with only its returned listener exported for teardown.
  const { running } = await import('__SERVICE_MAIN__');
  try {
    const endpoint = 'http://127.0.0.1:' + running.addr.port;
    Deno.env.set(serviceKey, endpoint);
    const appRoute = await import('__APP_SESSION_ROUTE__');
    for (const [token, expectStatus] of [[undefined, 401], [permitted, 200], [undefined, 401]] as const) {
      const req = new Request('https://app.example.test/examples/guarded/session', {
        headers: token ? { cookie: '__Host-ns_session=' + token } : {},
      });
      const response = await appRoute.handler.GET({ req });
      assertEquals(response.status, expectStatus, 'Generated app session route');
      assertEquals(response.headers.get('cache-control'), 'no-store');
      assertEquals(await response.json(), { authenticated: expectStatus === 200 });
    }
    console.info('Generated app guarded call PASS: SDK bearer contribution; request-scoped cookie; anonymous401, authenticated200, anonymous401; no credentials emitted.');
    const exchange = async (path: string, contract: HttpExchangeContract) => {
      const init = httpExchangeInit(contract, AbortSignal.timeout(10_000));
      const response = await fetch(endpoint + path, {
        ...init,
        ...(contract.method === 'POST' ? { body: JSON.stringify({ json: { limit: 2, offset: 0 } }) } : {}),
      });
      const outcome = await judgeHttpResponse(contract, response);
      assertEquals(outcome.kind, 'matched', 'Generated service broke HTTP contract: ' + path + ' expected ' + contract.expectStatus + ', served ' + outcome.status);
    };
    // Discovery and the generated demo contract remain public under the BFF posture.
    await exchange('/api/openapi.json', { method: 'GET', expectStatus: 200 });
    await exchange('/api/docs', { method: 'GET', expectStatus: 200 });
    await exchange('/api/v1/guarded/health/check', { method: 'GET', expectStatus: 200 });
    await exchange('/api/rpc/v1/guarded/list', { method: 'POST', headers: { 'content-type': 'application/json' }, expectStatus: 200 });
    for (const [token, expectStatus] of [
      [undefined, 401], [insufficient, 403], [permitted, 200],
    ] as const) {
      const headers = token ? { authorization: 'Bearer ' + token } : {};
      await exchange('/api/guarded/private', { method: 'GET', headers, expectStatus });
      await exchange('/api/rpc/v1/guarded/protected', { method: 'GET', headers, expectStatus });
    }
    await exchange('/health', { method: 'GET', expectStatus: 200 });
    console.info('Generated guarded service PASS: discovery/demo public200; protected REST/RPC anonymous401, denied403, permitted200; anonymous health200; no credentials emitted.');
  } finally {
    await running.stop();
  }
} finally {
  await auth.stop();
  if (previousEndpoint === undefined) Deno.env.delete(discoveryKey);
  else Deno.env.set(discoveryKey, previousEndpoint);
  if (previousService === undefined) Deno.env.delete(serviceKey);
  else Deno.env.set(serviceKey, previousService);
  if (previousPort === undefined) Deno.env.delete('PORT');
  else Deno.env.set('PORT', previousPort);
}
`;
