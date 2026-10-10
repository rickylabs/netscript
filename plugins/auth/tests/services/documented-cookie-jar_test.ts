import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import createAuthService from '../../services/src/main.ts';
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
      ...env,
    },
    appsettings: { auth: { environment: { NETSCRIPT_AUTH_COOKIE_NAME: 'appsettings_cookie' } } },
  };
}

Deno.test('documented localhost curl cookie-jar flow works through the real service bootstrap', async () => {
  await using kv = new MemoryKvAdapter();
  const provider = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen: () => {} },
    (request) =>
      new URL(request.url).pathname === '/oauth/userinfo'
        ? Response.json({ id: 4242 })
        : Response.json({
          access_token: 'access_test',
          refresh_token: 'refresh_test',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'profile email',
        }),
  );
  const scratch = await Deno.makeTempDir({ prefix: 'auth-cookie-jar-' });
  const previous = Deno.env.get('NETSCRIPT_AUTH_COOKIE_NAME');
  Deno.env.set('NETSCRIPT_AUTH_COOKIE_NAME', 'process_cookie');
  let running: Awaited<ReturnType<typeof createAuthService>> | undefined;
  try {
    const recipe = await Deno.readTextFile(recipePath);
    const localPolicy = recipe.match(
      /```sh\n(export NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS=true\nexport NETSCRIPT_AUTH_COOKIE_NAME=\w+)\n```/,
    );
    assert(localPolicy, 'The recipe must provide a working local cookie policy before startup.');
    const env = Object.fromEntries(
      localPolicy[1].split('\n').map((line) => {
        const [name, value] = line.slice('export '.length).split('=');
        return [name, value];
      }),
    );
    assertEquals(env.NETSCRIPT_AUTH_COOKIE_NAME, 'ns_session_dev');
    running = await createAuthService(host(kv, {
      ...env,
      NETSCRIPT_AUTH_TOKEN_ENDPOINT: `http://127.0.0.1:${provider.addr.port}/oauth/token`,
      NETSCRIPT_AUTH_USERINFO_ENDPOINT: `http://127.0.0.1:${provider.addr.port}/oauth/userinfo`,
      NETSCRIPT_AUTH_SUBJECT_SOURCE: 'userinfo',
      NETSCRIPT_AUTH_SUBJECT_CLAIM: 'id',
    }));
    const origin = `http://localhost:${running.addr.port}`;
    const block = recipe.match(/```sh\n(# Save the transaction cookie[\s\S]*?)\n```/);
    assert(block, 'The documented round trip must contain the cookie-jar commands.');
    const steps = block[1].replace(/\\\n[ \t]*/g, ' ').split('\n')
      .filter((line) => line.startsWith('curl '));
    assertEquals(steps.length, 5);
    let state = '';
    for (const [index, command] of steps.entries()) {
      const script = command.replaceAll('http://localhost:8094', origin)
        .replace('PROVIDER_CODE', 'code_test').replace('PROVIDER_STATE', state);
      const result = await new Deno.Command('sh', {
        args: ['-c', script],
        cwd: scratch,
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      assertEquals(result.code, 0, `documented curl step ${index + 1}`);
      const body = JSON.parse(new TextDecoder().decode(result.stdout));
      const jar = await Deno.readTextFile(`${scratch}/cookies.txt`);
      if (index === 0) {
        assertEquals(body.started, true);
        state = new URL(body.redirectUrl).searchParams.get('state')!;
        assertStringIncludes(jar, '\tns_session_dev\ttxn_');
        assert(!jar.includes('__Host-ns_session'));
        assert(!jar.includes('process_cookie'));
        assert(!jar.includes('appsettings_cookie'));
      } else if (index === 1) {
        assertEquals(body.completed, true);
        assertEquals(body.subject, 'default:4242');
        assert(body.subject !== body.sessionId);
        assertStringIncludes(jar, '\tns_session_dev\tsess_');
        // Main's bearer parity must coexist with the recipe's custom cookie policy.
        for (const route of ['session', 'me']) {
          const bearer = await fetch(`${origin}/api/v1/auth/${route}`, {
            headers: { authorization: `Bearer ${body.sessionId}` },
          });
          assertEquals(bearer.status, 200);
          const resolved = await bearer.json();
          assertEquals(resolved.authenticated, true);
          assertEquals(resolved.session.id, body.sessionId);
          assertEquals(resolved.session.subject, 'default:4242');
        }
      } else if (index === 2 || index === 3) {
        assertEquals(body.authenticated, true);
        assertEquals(body.session.subject, 'default:4242');
      } else {
        assertEquals(body.signedOut, true);
        assert(!jar.includes('\tns_session_dev\t'));
      }
    }
    const after = await fetch(`${origin}/api/v1/auth/session`);
    assertEquals((await after.json()).authenticated, false);
  } finally {
    await running?.stop();
    await provider.shutdown();
    await Deno.remove(scratch, { recursive: true });
    if (previous === undefined) Deno.env.delete('NETSCRIPT_AUTH_COOKIE_NAME');
    else Deno.env.set('NETSCRIPT_AUTH_COOKIE_NAME', previous);
  }
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
