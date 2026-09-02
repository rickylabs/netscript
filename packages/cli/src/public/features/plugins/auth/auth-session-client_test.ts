import { assertEquals, assertFalse, assertRejects } from '@std/assert';

import { FetchAuthSessionHttp } from './auth-session-client.ts';
import type { AuthSessionClientContext } from './auth-types.ts';

Deno.test('auth session adapter routes caller context through typed bearer preparation', async () => {
  const requests: Request[] = [];
  const credential = crypto.randomUUID();
  const context: AuthSessionClientContext = {
    auth: { getAccessToken: () => credential },
  };
  const client = new FetchAuthSessionHttp((input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    if (request.method === 'POST') {
      return Promise.resolve(Response.json({ signedOut: true, sessionId: 'session-1' }));
    }
    return Promise.resolve(
      Response.json([{ id: 'session-1', state: 'active', userId: 'user-1' }]),
    );
  });

  assertEquals(
    (await client.list('https://streams.test/auth/sessions?projection=active', { context }))[0].id,
    'session-1',
  );
  assertEquals(
    await client.revoke('https://auth.test/api/v1/auth/', 'session-1', { context }),
    'session-1',
  );
  await client.list('https://streams.test/auth/sessions');

  assertEquals(requests[0].url, 'https://streams.test/auth/sessions?projection=active');
  assertEquals(requests[0].headers.get('accept'), 'application/json');
  assertEquals(requests[0].headers.get('authorization'), `Bearer ${credential}`);
  assertEquals(requests[1].url, 'https://auth.test/api/v1/auth/signout');
  assertEquals(requests[1].headers.get('content-type'), 'application/json');
  assertEquals(requests[1].headers.get('authorization'), `Bearer ${credential}`);
  assertEquals(await requests[1].json(), { sessionId: 'session-1' });
  assertFalse(requests[2].headers.has('authorization'));
});

Deno.test('auth session adapter preserves bearer cleartext guard without disclosure', async () => {
  const credential = crypto.randomUUID();
  const client = new FetchAuthSessionHttp(() => {
    throw new Error('fetch must not run when credential preparation fails');
  });
  const error = await assertRejects(
    () =>
      client.list('http://streams.test/auth/sessions', {
        context: { auth: { getAccessToken: () => credential } },
      }),
    Error,
    'Bearer credentials require secure transport',
  );
  assertFalse(String(error).includes(credential));
});

Deno.test('auth session adapter uses only the browser-safe public bearer surface', async () => {
  const source = await Deno.readTextFile(new URL('./auth-session-client.ts', import.meta.url));
  for (
    const forbidden of [
      '/internal/',
      '@netscript/service',
      '@netscript/plugin-auth-core/server',
      '@netscript/plugin-auth-core/services',
    ]
  ) {
    assertFalse(source.includes(forbidden));
  }
});
