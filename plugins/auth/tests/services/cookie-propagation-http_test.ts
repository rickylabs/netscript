import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { createAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';
import type { InteractiveFlowPort } from '@netscript/plugin-auth-core/ports';
import { KvOAuthError } from '@netscript/auth-kv-oauth';
import {
  createKvOAuthTestRegistry,
  serveAuthTestService,
} from '../testing/auth-service-fixture.ts';

for (const projection of ['rest', 'rpc'] as const) {
  Deno.test(`${projection}: backend cookies survive signin, callback, session and signout`, async () => {
    await using kv = new MemoryKvAdapter();
    const original = await createKvOAuthTestRegistry(kv);
    const backend = original.resolveBackend();
    assert(backend.interactive);
    const flow = backend.interactive;
    const emitted = new Map<string, string[]>();
    let callbackError: string | undefined;
    const remember = (operation: string, response: Response) => {
      // Multiple cookies, including an Expires comma, must remain separate and verbatim.
      response.headers.append(
        'set-cookie',
        `__Host-extra=${operation}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 2037 00:00:00 GMT`,
      );
      emitted.set(operation, response.headers.getSetCookie());
      return response;
    };
    const interactive: InteractiveFlowPort = {
      getSessionId: (request) => flow.getSessionId(request),
      signIn: async (request, options) => remember('signin', await flow.signIn(request, options)),
      handleCallback: async (request) => {
        try {
          const result = await flow.handleCallback(request);
          remember('callback', result.response);
          return result;
        } catch (error) {
          if (error instanceof KvOAuthError) callbackError = error.code;
          throw error;
        }
      },
      signOut: async (request, options) =>
        remember('signout', await flow.signOut(request, options)),
    };
    const registry = createAuthBackendRegistry(
      new Map([[backend.name, { ...backend, interactive }]]),
      backend.name,
    );
    await using service = await serveAuthTestService(registry);
    const call = async (route: string, input?: Record<string, string>, cookie?: string) => {
      const get = projection === 'rest' && (route === 'session' || route === 'me');
      const response = await fetch(
        `${service.baseUrl}/api/${projection === 'rpc' ? 'rpc/' : ''}v1/auth/${route}`,
        {
          method: get ? 'GET' : 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-proto': 'https',
            ...(cookie ? { cookie } : {}),
          },
          body: get
            ? undefined
            : JSON.stringify(projection === 'rpc' ? { json: input ?? {} } : input ?? {}),
        },
      );
      const payload = await response.json();
      return { response, body: projection === 'rpc' && response.ok ? payload.json : payload };
    };
    const started = await call('signin', { redirectTo: '/dashboard' });
    assertEquals(started.response.status, 200);
    assertEquals(started.response.headers.getSetCookie(), emitted.get('signin'));
    const txnCookie = started.response.headers.getSetCookie()[0];
    for (
      const attribute of ['__Host-ns_session=', 'Path=/', 'Secure', 'HttpOnly', 'SameSite=Lax']
    ) {
      assertStringIncludes(txnCookie, attribute);
    }
    const redirect = new URL(started.body.redirectUrl);
    const input = { code: 'code_test', state: redirect.searchParams.get('state')! };
    const missing = await call('callback', input);
    assertEquals(missing.response.status, 502);
    assertEquals(callbackError, 'oauth_cookie_missing');
    assertStringIncludes(JSON.stringify(missing.body), 'OAuth transaction cookie is missing');
    const completed = await call('callback', input, txnCookie.split(';')[0]);
    assertEquals(completed.response.status, 200);
    assertEquals(completed.response.headers.getSetCookie(), emitted.get('callback'));
    const sessionCookie = completed.response.headers.getSetCookie()[0];
    for (
      const attribute of ['__Host-ns_session=', 'Path=/', 'Secure', 'HttpOnly', 'SameSite=Lax']
    ) {
      assertStringIncludes(sessionCookie, attribute);
    }
    const credential = sessionCookie.split(';')[0];
    // No sessionId in body, query, or Authorization; only the emitted cookie.
    const session = await call('session', undefined, credential);
    assertEquals(session.body.authenticated, true);
    assertEquals(session.body.session.id, completed.body.sessionId);
    assertEquals(session.response.headers.getSetCookie(), []);
    const me = await call('me', undefined, credential);
    assertEquals(me.body.authenticated, true);
    assertEquals((await call('session')).body.authenticated, false);
    assertEquals(
      (await call('session', undefined, `${credential}tampered`)).body.authenticated,
      false,
    );
    assertEquals(
      (await call('session', undefined, '__Host-ns_session=unknown')).body.authenticated,
      false,
    );
    const ended = await call('signout', {}, credential);
    assertEquals(ended.response.status, 200);
    assertEquals(ended.response.headers.getSetCookie(), emitted.get('signout'));
    assertStringIncludes(ended.response.headers.getSetCookie()[0], 'Max-Age=0');
    assertStringIncludes(ended.response.headers.getSetCookie()[0], 'Expires=Thu, 01 Jan 1970');
    assertEquals((await call('session', undefined, credential)).body.authenticated, false);

    // Explicit txn input must survive contract parsing without an incoming cookie.
    const explicitStart = await call('signin');
    const explicitRedirect = new URL(explicitStart.body.redirectUrl);
    const explicit = await call('callback', {
      code: 'code_test',
      state: explicitRedirect.searchParams.get('state')!,
      txn: explicitRedirect.searchParams.get('txn')!,
    });
    assertEquals(explicit.response.status, 200);
    assertEquals(explicit.body.completed, true);
    assertEquals(explicit.response.headers.getSetCookie(), emitted.get('callback'));

    // Interleaving must not mix response bags between requests.
    const concurrent = await Promise.all(Array.from({ length: 6 }, async () => {
      const result = await call('signin');
      const txn = new URL(result.body.redirectUrl).searchParams.get('txn');
      assertStringIncludes(result.response.headers.getSetCookie()[0], `=${txn};`);
      assertEquals(result.response.headers.getSetCookie().length, 2);
      return txn;
    }));
    assertEquals(new Set(concurrent).size, 6);
  });
}

for (const projection of ['rest', 'rpc'] as const) {
  Deno.test(`${projection}: explicit callback txn works without a Cookie header`, async () => {
    await using kv = new MemoryKvAdapter();
    const registry = await createKvOAuthTestRegistry(kv);
    await using service = await serveAuthTestService(registry);
    const call = async (route: string, input: Record<string, string>) => {
      const response = await fetch(
        `${service.baseUrl}/api/${projection === 'rpc' ? 'rpc/' : ''}v1/auth/${route}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-proto': 'https' },
          body: JSON.stringify(projection === 'rpc' ? { json: input } : input),
        },
      );
      const payload = await response.json();
      return {
        status: response.status,
        body: projection === 'rpc' && response.ok ? payload.json : payload,
      };
    };
    const started = await call('signin', {});
    const redirect = new URL(started.body.redirectUrl);
    const completed = await call('callback', {
      code: 'code_test',
      state: redirect.searchParams.get('state')!,
      txn: redirect.searchParams.get('txn')!,
    });
    assertEquals(completed.status, 200);
    assertEquals(completed.body.completed, true);
  });
}

for (const projection of ['rest', 'rpc'] as const) {
  for (const operation of ['callback', 'signout'] as const) {
    Deno.test(`${projection}: ${operation} independently emits the backend session cookie`, async () => {
      await using kv = new MemoryKvAdapter();
      const registry = await createKvOAuthTestRegistry(kv);
      const backend = registry.resolveBackend();
      assert(backend.interactive);
      const request = new Request('https://app.example.test/api/v1/auth/signin');
      // Start at the backend, so this negative control does not depend on signin propagation.
      const started = await backend.interactive.signIn(request);
      const redirect = new URL(started.headers.get('location')!);
      const input = { code: 'code_test', state: redirect.searchParams.get('state')! };
      let expected: string[] = [];
      const flow = backend.interactive;
      const interactive: InteractiveFlowPort = {
        ...flow,
        handleCallback: async (request) => {
          const result = await flow.handleCallback(request);
          expected = result.response.headers.getSetCookie();
          return result;
        },
        signOut: async (request, options) => {
          const response = await flow.signOut(request, options);
          expected = response.headers.getSetCookie();
          return response;
        },
      };
      const observed = createAuthBackendRegistry(
        new Map([[backend.name, { ...backend, interactive }]]),
        backend.name,
      );
      await using service = await serveAuthTestService(observed);
      let cookie = started.headers.getSetCookie()[0].split(';')[0];
      if (operation === 'signout') {
        const result = await flow.handleCallback(
          new Request(
            `https://app.example.test/api/v1/auth/callback?${new URLSearchParams(input)}`,
            { headers: { cookie } },
          ),
        );
        cookie = result.response.headers.getSetCookie()[0].split(';')[0];
      }
      const response = await fetch(
        `${service.baseUrl}/api/${projection === 'rpc' ? 'rpc/' : ''}v1/auth/${operation}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-proto': 'https', cookie },
          body: JSON.stringify(
            projection === 'rpc'
              ? { json: operation === 'callback' ? input : {} }
              : operation === 'callback'
              ? input
              : {},
          ),
        },
      );
      await response.json();
      assertEquals(response.status, 200);
      assert(expected.length > 0);
      assertEquals(response.headers.getSetCookie(), expected);
    });
  }
}
