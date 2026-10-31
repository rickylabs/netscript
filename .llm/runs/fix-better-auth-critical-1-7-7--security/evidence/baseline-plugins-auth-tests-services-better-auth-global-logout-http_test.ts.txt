/**
 * HTTP regression for #1384 on better-auth with its signed cookie cache enabled: after
 * `signout { everywhere: true }`, no cookie jar of the subject authenticates through the auth
 * service, including a sibling browser whose `session_data` cache cookie is still within maxAge.
 */

import { assert, assertEquals } from '@std/assert';
import { betterAuth } from 'npm:better-auth@^1.6.20';
import { memoryAdapter } from 'npm:better-auth@^1.6.20/adapters/memory';
import { createBetterAuthBackend } from '@netscript/auth-better-auth';
import { createAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';
import { serveAuthTestService } from '../testing/auth-service-fixture.ts';

function jar(headers: Headers): string {
  return headers.getSetCookie().map((cookie) => cookie.split(';')[0]).join('; ');
}

Deno.test('better-auth everywhere signout ends cached sibling sessions over HTTP', async () => {
  const db = { user: [], session: [], account: [], verification: [] };
  const auth = betterAuth({
    secret: crypto.randomUUID().repeat(2),
    baseURL: 'http://localhost:3000',
    database: memoryAdapter(db),
    emailAndPassword: { enabled: true },
    logger: { disabled: true },
    session: { cookieCache: { enabled: true, maxAge: 300 } },
  });
  const registry = createAuthBackendRegistry(
    new Map([[
      'better-auth',
      createBetterAuthBackend({ auth, sessionTokenSecret: 'test-secret' }),
    ]]),
    'better-auth',
  );
  const credentials = { email: 'alice@example.test', password: 'password-1234' };
  const caller = jar(
    (await auth.api.signUpEmail({ body: { ...credentials, name: 'Alice' }, returnHeaders: true }))
      .headers,
  );
  const sibling = jar(
    (await auth.api.signInEmail({ body: credentials, returnHeaders: true })).headers,
  );
  const other = jar(
    (await auth.api.signUpEmail({
      body: { email: 'bob@example.test', password: 'password-1234', name: 'Bob' },
      returnHeaders: true,
    })).headers,
  );
  assert(sibling.includes('session_data='), 'the sibling jar carries a signed cache cookie');

  await using service = await serveAuthTestService(registry);
  const me = async (cookie: string) => {
    const response = await fetch(`${service.baseUrl}/api/v1/auth/me`, { headers: { cookie } });
    assertEquals(response.status, 200);
    return (await response.json()).authenticated;
  };
  assertEquals(await me(sibling), true);

  const signout = await fetch(`${service.baseUrl}/api/v1/auth/signout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: caller },
    body: JSON.stringify({ everywhere: true }),
  });
  assertEquals(signout.status, 200);
  assertEquals((await signout.json()).signedOut, true);

  assertEquals(await me(caller), false);
  assertEquals(await me(sibling), false);
  assertEquals(await me(other), true);
  // The caller's jar cannot start another signout either: the guard rejects it.
  const again = await fetch(`${service.baseUrl}/api/v1/auth/signout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: sibling },
    body: JSON.stringify({}),
  });
  await again.body?.cancel();
  assertEquals(again.status, 401);
});
