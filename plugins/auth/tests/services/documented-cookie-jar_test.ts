import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import {
  proveDocumentedCookieJar,
  verifyCookieJarTutorial,
} from '../testing/documented-cookie-jar.ts';
import { initializeAuthService } from '../../services/src/init.ts';
import type { AuthPluginServiceContext } from '../../services/src/init.ts';
import { session } from '../../services/src/routers/v1-handlers.ts';

const recipePath = 'docs/site/identity-access/how-to/add-authentication.md';
const testKey = 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=';

function host(kv: MemoryKvAdapter, env: Record<string, string>): AuthPluginServiceContext {
  return {
    db: { getClient: () => Promise.resolve({}) },
    contracts: {},
    kv,
    logger: {},
    env: {
      PORT: '0',
      NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
      NETSCRIPT_AUTH_CLIENT_ID: 'client_test',
      NETSCRIPT_AUTH_CLIENT_SECRET: 'secret_test',
      NETSCRIPT_AUTH_KV_OAUTH_KEY: testKey,
      NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: 'https://issuer.example.test/oauth/authorize',
      NETSCRIPT_AUTH_TOKEN_ENDPOINT: 'https://issuer.example.test/oauth/token',
      NETSCRIPT_AUTH_REDIRECT_URI: 'http://localhost:8094/api/v1/auth/callback',
      NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS: 'true',
      NETSCRIPT_AUTH_ALLOW_INSECURE_HTTP_REQUESTS: 'true',
      ...env,
    },
    appsettings: { auth: { environment: { NETSCRIPT_AUTH_COOKIE_NAME: 'appsettings_cookie' } } },
  };
}

Deno.test('documented localhost curl cookie-jar flow works through the real service bootstrap', async () => {
  await proveDocumentedCookieJar(await Deno.readTextFile(recipePath));
});

Deno.test('tutorial cookie-only examples use the working localhost cookie policy', async () => {
  const recipe = await Deno.readTextFile(recipePath);
  const tutorial = await Deno.readTextFile('docs/site/tutorials/workspace/02-auth.md');
  verifyCookieJarTutorial(recipe, tutorial);
});

Deno.test('bootstrap threads one cookie policy with host, process and appsettings precedence', async () => {
  await using kv = new MemoryKvAdapter();
  const previous = Deno.env.get('NETSCRIPT_AUTH_COOKIE_NAME');
  try {
    for (
      const [processName, hostName, expected] of [
        [undefined, undefined, 'appsettings_cookie'],
        ['process_cookie', undefined, 'process_cookie'],
        ['process_cookie', 'host_cookie', 'host_cookie'],
      ] as const
    ) {
      if (processName === undefined) Deno.env.delete('NETSCRIPT_AUTH_COOKIE_NAME');
      else Deno.env.set('NETSCRIPT_AUTH_COOKIE_NAME', processName);
      const registry = await initializeAuthService(
        host(kv, hostName ? { NETSCRIPT_AUTH_COOKIE_NAME: hostName } : {}),
      );
      assertEquals(registry.cookieName, expected);
      const flow = registry.resolveBackend().interactive;
      assert(flow);
      const issued = await flow.signIn(new Request('http://localhost:8094/api/v1/auth/signin'));
      assertStringIncludes(issued.headers.getSetCookie()[0], `${expected}=txn_`);
      // The session-id convenience path uses the same cookie name as the backend.
      let requestedCookie: string | undefined;
      const backend = registry.resolveBackend();
      const observed = {
        ...backend,
        sessions: {
          ...backend.sessions,
          getSession: (input: Parameters<typeof backend.sessions.getSession>[0]) => {
            requestedCookie = input.request?.cookie(expected);
            return Promise.resolve(undefined);
          },
        },
      };
      await session({ sessionId: 'session_test' }, {
        registry: { ...registry, resolveBackend: () => observed },
        cookieName: registry.cookieName,
      });
      assertEquals(requestedCookie, 'session_test');
    }
  } finally {
    if (previous === undefined) Deno.env.delete('NETSCRIPT_AUTH_COOKIE_NAME');
    else Deno.env.set('NETSCRIPT_AUTH_COOKIE_NAME', previous);
  }
});
