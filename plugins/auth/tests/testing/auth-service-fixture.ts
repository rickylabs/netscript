/** Shared in-process auth service fixture for HTTP-boundary tests. */

import { assert } from '@std/assert';
import type { MemoryKvAdapter } from '@netscript/kv';
import type { Principal } from '@netscript/plugin-auth-core/domain';
import { createPluginService } from '../../../../packages/plugin/src/service/mod.ts';
import { createAuthServiceBackendRegistry } from '../../services/src/backend-registry.ts';
import { callback, signin } from '../../services/src/routers/v1-handlers.ts';
import { router } from '../../services/src/router.ts';
import { currentAuthRequest, withAuthRequest } from '../../services/src/request-context.ts';
import { createAuthServiceGuard } from '../../services/src/auth-guard.ts';
import { authTestUrl } from './auth-fixtures.ts';

/** Backend registry type returned by the auth service composition root. */
export type AuthTestRegistry = Awaited<ReturnType<typeof createAuthServiceBackendRegistry>>;

/** A running in-process auth service bound to a discoverable service name. */
export interface AuthTestService extends AsyncDisposable {
  /** Origin of the listener, e.g. `http://127.0.0.1:1234`. */
  readonly baseUrl: string;
  /** Service name whose `services__<name>__http__0` variable points at {@link baseUrl}. */
  readonly serviceName: string;
}

/** Create a kv-oauth registry whose synthetic provider always grants a token. */
export async function createKvOAuthTestRegistry(kv: MemoryKvAdapter): Promise<AuthTestRegistry> {
  // Synthetic provider configuration mirrors the native in-memory test fixture.
  return await createAuthServiceBackendRegistry({
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
}

/** Run signin + callback against the registry and return the new session id. */
export async function mintTestSession(registry: AuthTestRegistry): Promise<string> {
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
  return completed.sessionId;
}

/** Serve the real auth router (RPC + OpenAPI) on an ephemeral port, as `main.ts` wires it. */
export async function serveAuthTestService(registry: AuthTestRegistry): Promise<AuthTestService> {
  const running = await createPluginService(router, {
    auth: createAuthServiceGuard(registry),
    name: 'auth',
    version: '0.0.0',
    port: 0,
    openApi: { title: 'Auth API', description: 'Auth service test fixture' },
    middleware: [withAuthRequest],
    context: () => ({ registry, request: currentAuthRequest() }),
    traceContext: false,
  }).serve({ port: 0 });
  const baseUrl = `http://127.0.0.1:${running.addr.port}`;
  const serviceName = `auth-test-${crypto.randomUUID()}`;
  Deno.env.set(`services__${serviceName}__http__0`, baseUrl);
  return {
    baseUrl,
    serviceName,
    async [Symbol.asyncDispose]() {
      await running.stop();
      Deno.env.delete(`services__${serviceName}__http__0`);
    },
  };
}

/** Resolve the principal the service guard would authenticate for `sessionId`. */
export async function principalForSession(
  registry: AuthTestRegistry,
  sessionId: string,
): Promise<Principal> {
  const backend = registry.resolveBackend();
  const authSession = await backend.sessions.getSession({ sessionId });
  assert(authSession, `fixture session ${sessionId} must exist`);
  return backend.principalMapper.mapSessionToPrincipal(authSession).principal;
}
