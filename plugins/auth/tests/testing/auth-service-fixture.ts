/** Shared in-process auth service fixture for HTTP-boundary tests. */

import { assert } from '@std/assert';
import type { MemoryKvAdapter } from '@netscript/kv';
import type { ResolvedAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';
import type { AuthTelemetry } from '@netscript/plugin-auth-core/telemetry';
import type { CallbackInput, CallbackResponse } from '@netscript/plugin-auth-core/contracts/v1';
import type { AuthServiceContext } from '../../services/src/routers/v1-types.ts';
import { createPluginService } from '../../../../packages/plugin/src/service/mod.ts';
import { createAuthServiceBackendRegistry } from '../../services/src/backend-registry.ts';
import { callback, signin } from '../../services/src/routers/v1-handlers.ts';
import { router } from '../../services/src/router.ts';
import { currentAuthRequest, withAuthRequest } from '../../services/src/request-context.ts';
import {
  AUTH_TEST_USERINFO_SUBJECT_ENV,
  authTestUrl,
  syntheticProviderFetch,
} from './auth-fixtures.ts';

/** Backend registry type returned by the auth service composition root. */
export type AuthTestRegistry = ResolvedAuthBackendRegistry;

/** A running in-process auth service bound to a discoverable service name. */
export interface AuthTestService extends AsyncDisposable {
  /** Origin of the listener, e.g. `http://127.0.0.1:1234`. */
  readonly baseUrl: string;
  /** Service name whose `services__<name>__http__0` variable points at {@link baseUrl}. */
  readonly serviceName: string;
}

/** Create a kv-oauth registry whose synthetic provider grants a token and a stable userinfo id. */
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
      ...AUTH_TEST_USERINFO_SUBJECT_ENV,
    },
    fetch: syntheticProviderFetch(),
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
  const completed = await completeTestCallback({
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

/** Capture the callback's actual cookie through the same middleware used by HTTP projections. */
export async function completeTestCallback(
  input: CallbackInput,
  context: AuthServiceContext,
): Promise<Readonly<{ output: CallbackResponse; cookie: string; sessionId: string }>> {
  const http = {
    req: { raw: new Request(context.request?.url ?? authTestUrl('/v1/auth/callback')) },
    res: new Response(),
  };
  let output: CallbackResponse = { completed: false };
  await withAuthRequest(http, async () => {
    output = await callback(input, context);
  });
  const cookie = http.res.headers.getSetCookie()[0]?.split(';')[0];
  assert(cookie, 'Successful callback must issue a session cookie');
  const sessionId = cookie.slice(cookie.indexOf('=') + 1);
  assert(sessionId);
  return { output, cookie, sessionId };
}

/** Serve the real auth router (RPC + OpenAPI) on an ephemeral port, as `main.ts` wires it. */
export async function serveAuthTestService(
  registry: AuthTestRegistry,
  telemetry?: AuthTelemetry,
): Promise<AuthTestService> {
  const running = await createPluginService(router, {
    auth: { public: true, reason: 'Fixture for existing public service behavior' },
    name: 'auth',
    version: '0.0.0',
    port: 0,
    openApi: { title: 'Auth API', description: 'Auth service test fixture' },
    middleware: [withAuthRequest],
    context: () => ({ registry, telemetry, request: currentAuthRequest() }),
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
