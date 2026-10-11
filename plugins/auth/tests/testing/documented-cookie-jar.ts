import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import createAuthService, { type PluginServiceContext } from '@netscript/plugin-auth/services';

const testKey = 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=';

/** Execute the docs' cookie-jar recipe using the consumer's public auth bootstrap. */
export async function proveDocumentedCookieJar(recipe: string): Promise<void> {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  let issuedCode = '';
  const provider = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen: () => {} },
    async (request) => {
      const url = new URL(request.url);
      if (url.pathname === '/oauth/authorize') {
        issuedCode = crypto.randomUUID();
        const callback = new URL(url.searchParams.get('redirect_uri')!);
        callback.searchParams.set('code', issuedCode);
        callback.searchParams.set('state', url.searchParams.get('state')!);
        return Response.redirect(callback, 302);
      }
      if (url.pathname === '/oauth/userinfo') return Response.json({ id: 4242 });
      assertEquals(url.pathname, '/oauth/token');
      const input = new URLSearchParams(await request.text());
      assertEquals(input.get('code'), issuedCode);
      return Response.json({
        access_token: 'access_test',
        refresh_token: 'refresh_test',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'profile email',
      });
    },
  );
  const scratch = await Deno.makeTempDir({ prefix: 'auth-cookie-jar-' });
  const previous = Deno.env.get('NETSCRIPT_AUTH_COOKIE_NAME');
  Deno.env.set('NETSCRIPT_AUTH_COOKIE_NAME', 'process_cookie');
  let running: Awaited<ReturnType<typeof createAuthService>> | undefined;
  try {
    const localPolicy = recipe.match(
      /```sh\n(export NETSCRIPT_AUTH_ALLOW_INSECURE_HTTP_REQUESTS=true\nexport NETSCRIPT_AUTH_COOKIE_NAME=\w+)\n```/,
    );
    assert(localPolicy, 'The recipe must provide a working local cookie policy before startup.');
    const env = Object.fromEntries(
      localPolicy[1].split('\n').map((line) => {
        const [name, value] = line.slice('export '.length).split('=');
        return [name, value];
      }),
    );
    assertEquals(env.NETSCRIPT_AUTH_COOKIE_NAME, 'ns_session_dev');
    running = await createAuthService(
      {
        db: { getClient: () => Promise.resolve({}) },
        contracts: {},
        kv,
        logger: {},
        appsettings: {
          auth: { environment: { NETSCRIPT_AUTH_COOKIE_NAME: 'appsettings_cookie' } },
        },
        env: {
          PORT: '0',
          NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
          NETSCRIPT_AUTH_CLIENT_ID: 'client_test',
          NETSCRIPT_AUTH_CLIENT_SECRET: 'secret_test',
          NETSCRIPT_AUTH_KV_OAUTH_KEY: testKey,
          NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS: 'true',
          NETSCRIPT_AUTH_REDIRECT_URI: 'http://localhost:8094/api/v1/auth/callback',
          NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT:
            `http://127.0.0.1:${provider.addr.port}/oauth/authorize`,
          ...env,
          NETSCRIPT_AUTH_TOKEN_ENDPOINT: `http://127.0.0.1:${provider.addr.port}/oauth/token`,
          NETSCRIPT_AUTH_USERINFO_ENDPOINT: `http://127.0.0.1:${provider.addr.port}/oauth/userinfo`,
          NETSCRIPT_AUTH_SUBJECT_SOURCE: 'userinfo',
          NETSCRIPT_AUTH_SUBJECT_CLAIM: 'id',
        },
      } satisfies PluginServiceContext,
    );
    const origin = `http://localhost:${running.addr.port}`;
    const block = recipe.match(/```sh\n(# Save the transaction cookie[\s\S]*?)\n```/);
    assert(block, 'The documented round trip must contain the cookie-jar commands.');
    const steps = block[1].replace(/\\\n[ \t]*/g, ' ').split('\n')
      .filter((line) => line.startsWith('curl '));
    assertEquals(steps.length, 5);
    let state = '';
    let code = '';
    let sessionCookie = '';
    for (const [index, command] of steps.entries()) {
      const script = command.replace('curl ', 'curl --silent --show-error --max-time 10 ')
        .replaceAll('http://localhost:8094', origin)
        .replace('PROVIDER_CODE', code).replace('PROVIDER_STATE', state);
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
        const authorized = await fetch(body.redirectUrl, {
          redirect: 'manual',
          signal: AbortSignal.timeout(10_000),
        });
        assertEquals(authorized.status, 302);
        const callback = new URL(authorized.headers.get('location')!);
        await authorized.body?.cancel();
        state = callback.searchParams.get('state')!;
        code = callback.searchParams.get('code')!;
        const missing = await fetch(`${origin}/api/v1/auth/callback`, {
          signal: AbortSignal.timeout(10_000),
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });
        assertEquals(missing.status, 502);
        assertStringIncludes(await missing.text(), 'OAuth transaction cookie is missing.');
        assertStringIncludes(jar, '\tns_session_dev\ttxn_');
        assert(!jar.includes('__Host-ns_session'));
        assert(!jar.includes('process_cookie'));
        assert(!jar.includes('appsettings_cookie'));
      } else if (index === 1) {
        assertEquals(body.completed, true);
        assertEquals(body.subject, 'default:4242');
        assertEquals(Object.hasOwn(body, 'sessionId'), false);
        assertStringIncludes(jar, '\tns_session_dev\tsess_');
        const sessionId = jar.split('\n').find((line) => line.includes('\tns_session_dev\t'))!
          .split('\t').at(-1)!;
        sessionCookie = `ns_session_dev=${sessionId}`;
        // Main's bearer parity must coexist with the recipe's custom cookie policy.
        for (const route of ['session', 'me']) {
          const bearer = await fetch(`${origin}/api/v1/auth/${route}`, {
            headers: { authorization: `Bearer ${sessionId}` },
            signal: AbortSignal.timeout(10_000),
          });
          assertEquals(bearer.status, 200);
          const resolved = await bearer.json();
          assertEquals(resolved.authenticated, true);
          assertEquals(resolved.session.id, sessionId);
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
    for (const cookie of [sessionCookie, 'ns_session_dev=unknown-session', '']) {
      const after = await fetch(`${origin}/api/v1/auth/session`, {
        headers: { cookie },
        signal: AbortSignal.timeout(10_000),
      });
      assertEquals((await after.json()).authenticated, false);
    }
  } finally {
    await running?.stop();
    await provider.shutdown();
    await Deno.remove(scratch, { recursive: true });
    if (previous === undefined) Deno.env.delete('NETSCRIPT_AUTH_COOKIE_NAME');
    else Deno.env.set('NETSCRIPT_AUTH_COOKIE_NAME', previous);
  }
}

/** Verify the tutorial uses the same HTTP cookie policy and cookie-only session reads. */
export function verifyCookieJarTutorial(recipe: string, tutorial: string): void {
  assert(
    tutorial.includes('export NETSCRIPT_AUTH_ALLOW_INSECURE_HTTP_REQUESTS=true'),
    'Tutorial must enable HTTP cookie issuance, not only insecure OAuth requests.',
  );
  assertStringIncludes(tutorial, 'export NETSCRIPT_AUTH_COOKIE_NAME=ns_session_dev');
  const sessionCommands = tutorial.split('\n').filter((line) =>
    line.startsWith('curl ') && /\/auth\/(session|me)/.test(line) && line.includes('cookies.txt')
  );
  assertEquals(sessionCommands.length, 2);
  for (const command of sessionCommands) {
    assertStringIncludes(recipe, command);
    assert(!/sessionId|[?]| -d |[Aa]uthorization/.test(command));
  }
}
