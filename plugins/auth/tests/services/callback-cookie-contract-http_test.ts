import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvOAuthError } from '@netscript/auth-kv-oauth';
import { createAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';
import {
  createKvOAuthTestRegistry,
  serveAuthTestService,
} from '../testing/auth-service-fixture.ts';

for (const projection of ['rest', 'rpc'] as const) {
  Deno.test(`${projection}: callback omits credential and session resolves from its cookie alone`, async () => {
    await using kv = new MemoryKvAdapter();
    const registry = await createKvOAuthTestRegistry(kv);
    const backend = registry.resolveBackend();
    const flow = backend.interactive;
    assert(flow);
    // Start at the backend so callback proof is independent of signin header delivery.
    const started = await flow.signIn(new Request('https://app.example.test/signin'));
    const redirect = new URL(started.headers.get('location')!);
    const input = { code: 'code_test', state: redirect.searchParams.get('state')! };
    let errorCode: string | undefined;
    let emitted: string[] = [];
    const observed = createAuthBackendRegistry(
      new Map([[backend.name, {
        ...backend,
        interactive: {
          ...flow,
          handleCallback: async (request: Request) => {
            try {
              const result = await flow.handleCallback(request);
              emitted = result.response.headers.getSetCookie();
              return result;
            } catch (error) {
              if (error instanceof KvOAuthError) errorCode = error.code;
              throw error;
            }
          },
        },
      }]]),
      backend.name,
    );
    await using service = await serveAuthTestService(observed);
    const prefix = `${service.baseUrl}/api/${projection === 'rpc' ? 'rpc/' : ''}v1/auth`;
    const callback = async (cookie?: string) => {
      const response = await fetch(`${prefix}/callback`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-proto': 'https',
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(projection === 'rpc' ? { json: input } : input),
      });
      const body = await response.json();
      return { response, body: projection === 'rpc' && response.ok ? body.json : body };
    };
    const missing = await callback();
    assertEquals(missing.response.status, 502);
    assertEquals(errorCode, 'oauth_cookie_missing');
    assertEquals(missing.response.headers.getSetCookie(), []);
    const completed = await callback(started.headers.getSetCookie()[0].split(';')[0]);
    assertEquals(completed.response.status, 200);
    assertEquals(completed.body.completed, true);
    assertEquals(Object.hasOwn(completed.body, 'sessionId'), false);
    assertEquals(completed.response.headers.getSetCookie(), emitted);
    const cookie = emitted[0].split(';')[0];
    for (
      const attribute of ['__Host-ns_session=', 'Path=/', 'Secure', 'HttpOnly', 'SameSite=Lax']
    ) {
      assertStringIncludes(emitted[0], attribute);
    }
    const session = async (credential?: string) => {
      // REST GET has no query/body; RPC carries only an empty input. Neither sends Authorization.
      const response = await fetch(`${prefix}/session`, {
        method: projection === 'rest' ? 'GET' : 'POST',
        headers: {
          'content-type': 'application/json',
          ...(credential ? { cookie: credential } : {}),
        },
        ...(projection === 'rpc' ? { body: JSON.stringify({ json: {} }) } : {}),
      });
      assertEquals(response.status, 200);
      const body = await response.json();
      return projection === 'rpc' ? body.json : body;
    };
    const active = await session(cookie);
    assertEquals(active.authenticated, true);
    assertEquals(active.session.id, cookie.slice(cookie.indexOf('=') + 1));
    for (const invalid of [undefined, `${cookie}tampered`, '__Host-ns_session=unknown']) {
      assertEquals((await session(invalid)).authenticated, false);
    }
  });
}
