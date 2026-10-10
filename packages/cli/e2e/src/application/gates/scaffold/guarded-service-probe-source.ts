/** Executable generated-service acceptance, sharing HttpGate's exact exchange primitive. */
export const GUARDED_SERVICE_PROBE_SOURCE: string = String.raw`
import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { createPluginService } from '@netscript/plugin/service';
import { createAuthServiceBackendRegistry } from '__AUTH_SOURCE__/backend-registry.ts';
import { signin, callback } from '__AUTH_SOURCE__/routers/v1-handlers.ts';
import { router } from '__AUTH_SOURCE__/router.ts';
import { currentAuthRequest, withAuthRequest } from '__AUTH_SOURCE__/request-context.ts';
import { httpExchangeInit, judgeHttpResponse, type HttpExchangeContract } from '__HTTP_CONTRACT__';

await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
let scope = 'guarded:access';
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
  const completed = await callback({ code: 'synthetic-code', state: redirect.searchParams.get('state') ?? undefined }, {
    registry,
    request: { url: 'https://app.example.test/api/v1/auth/callback?txn=' + redirect.searchParams.get('txn'), headers: new Headers({ 'x-forwarded-proto': 'https' }) },
  });
  assert(completed.sessionId);
  return completed.sessionId;
}
const permitted = await mintSession('guarded:access');
const insufficient = await mintSession('other:access');
const auth = await createPluginService(router, {
  name: 'auth', auth: { public: true, reason: 'Native session verification fixture' },
  middleware: [withAuthRequest],
  context: () => ({ registry, request: currentAuthRequest() }),
  traceContext: false,
}).serve({ port: 0 });
const discoveryKey = 'services__auth__http__0';
const previousEndpoint = Deno.env.get(discoveryKey);
const previousPort = Deno.env.get('PORT');
Deno.env.set(discoveryKey, 'http://127.0.0.1:' + auth.addr.port);
Deno.env.set('PORT', '0');
try {
  // This is the generated entrypoint, with only its returned listener exported for teardown.
  const { running } = await import('__SERVICE_MAIN__');
  try {
    const endpoint = 'http://127.0.0.1:' + running.addr.port;
    const exchange = async (path: string, contract: HttpExchangeContract) => {
      const init = httpExchangeInit(contract, AbortSignal.timeout(10_000));
      const response = await fetch(endpoint + path, {
        ...init,
        ...(contract.method === 'POST' ? { body: JSON.stringify({ json: { limit: 2, offset: 0 } }) } : {}),
      });
      const outcome = await judgeHttpResponse(contract, response);
      assertEquals(outcome.kind, 'matched', 'Generated service broke HTTP contract: ' + path + ' expected ' + contract.expectStatus + ', served ' + outcome.status);
    };
    const rest = '/api/v1/guarded/health/check';
    const rpc = '/api/rpc/v1/guarded/list';
    for (const [token, expectStatus] of [
      [undefined, 401], [insufficient, 403], [permitted, 200],
    ] as const) {
      const headers = { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) };
      await exchange(rest, { method: 'GET', headers, expectStatus });
      await exchange(rpc, { method: 'POST', headers, expectStatus });
      await exchange('/api/openapi.json', { method: 'GET', headers, expectStatus });
    }
    await exchange('/health', { method: 'GET', expectStatus: 200 });
    console.info('Generated guarded service PASS: REST/RPC/discovery anonymous401, insufficient403, permitted200; anonymous health200; no credentials emitted.');
  } finally {
    await running.stop();
  }
} finally {
  await auth.stop();
  if (previousEndpoint === undefined) Deno.env.delete(discoveryKey);
  else Deno.env.set(discoveryKey, previousEndpoint);
  if (previousPort === undefined) Deno.env.delete('PORT');
  else Deno.env.set('PORT', previousPort);
}
`;
