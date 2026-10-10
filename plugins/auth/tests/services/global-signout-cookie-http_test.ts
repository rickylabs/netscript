/** Global logout must clear the caller's cookie even when an owned sibling is selected. */

import { assert, assertEquals, assertNotEquals, assertStringIncludes } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { toAuthnRequest } from '../../services/src/routers/v1-helpers.ts';
import {
  createKvOAuthTestRegistry,
  serveAuthTestService,
} from '../testing/auth-service-fixture.ts';

const transports = [
  { name: 'REST', path: '/api/v1/auth/signout', rpc: false },
  { name: 'namespaced RPC', path: '/api/rpc/v1/auth/signout', rpc: true },
  { name: 'flat RPC', path: '/api/rpc/v1/signout', rpc: true },
] as const;

for (const transport of transports) {
  Deno.test(`${transport.name}: everywhere with an owned sibling selector invalidates both sessions and clears the caller cookie`, async () => {
    await using kv = new MemoryKvAdapter();
    const registry = await createKvOAuthTestRegistry(kv);
    const backend = registry.resolveBackend();
    const create = (subject: string) =>
      backend.sessions.createSession({
        subject,
        userId: subject,
        expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      });
    const caller = await create('user-owner');
    const sibling = await create('user-owner');
    const foreign = await create('user-other');
    assert(backend.interactive);
    await using service = await serveAuthTestService(registry);
    const input = { everywhere: true, sessionId: sibling.id };
    const response = await fetch(`${service.baseUrl}${transport.path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-proto': 'https',
        cookie: `__Host-ns_session=${caller.id}`,
      },
      body: JSON.stringify(transport.rpc ? { json: input } : input),
    });
    const payload = await response.json();
    assertEquals(response.status, 200);
    const body = transport.rpc ? payload.json : payload;
    assertEquals(body.signedOut, true);
    assertEquals(body.sessionId, sibling.id);
    assertNotEquals((await backend.sessions.getSession({ sessionId: caller.id }))?.state, 'active');
    assertEquals((await backend.sessions.getSession({ sessionId: sibling.id }))?.state, 'revoked');
    assertEquals((await backend.sessions.getSession({ sessionId: foreign.id }))?.state, 'active');
    for (const session of [caller, sibling]) {
      const auth = await backend.authenticate(toAuthnRequest({
        url: 'https://app.example.test/api/v1/auth/me',
        headers: new Headers({ cookie: `__Host-ns_session=${session.id}` }),
      }));
      assertEquals(auth.ok, false);
    }
    const expected = await backend.interactive.signOut(
      new Request('https://app.example.test/api/v1/auth/signout', {
        headers: { cookie: `__Host-ns_session=${caller.id}` },
      }),
      { revoke: false },
    );
    assert(expected.headers.getSetCookie().length > 0);
    assertEquals(response.headers.getSetCookie(), expected.headers.getSetCookie());
    assertStringIncludes(response.headers.getSetCookie()[0], '__Host-ns_session=');
    assertStringIncludes(response.headers.getSetCookie()[0], 'Max-Age=0');
  });

  Deno.test(`${transport.name}: global logout preserves a foreign cookie and refuses foreign or unknown selectors`, async () => {
    await using kv = new MemoryKvAdapter();
    const registry = await createKvOAuthTestRegistry(kv);
    const backend = registry.resolveBackend();
    const create = (subject: string) =>
      backend.sessions.createSession({
        subject,
        userId: subject,
        expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      });
    const caller = await create('user-owner');
    const sibling = await create('user-owner');
    const foreign = await create('user-other');
    await using service = await serveAuthTestService(registry);
    const call = async (sessionId: string) => {
      const input = { everywhere: true, sessionId };
      const response = await fetch(`${service.baseUrl}${transport.path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-proto': 'https',
          authorization: `Bearer ${caller.id}`,
          cookie: `__Host-ns_session=${foreign.id}`,
        },
        body: JSON.stringify(transport.rpc ? { json: input } : input),
      });
      return { response, payload: await response.json() };
    };
    const refused = await call(foreign.id);
    const unknown = await call('sess_unknown');
    assertEquals(refused.response.status, 401);
    assertEquals(unknown.response.status, 401);
    assertEquals(refused.payload, unknown.payload);
    assertEquals(refused.response.headers.getSetCookie(), []);
    assertEquals(unknown.response.headers.getSetCookie(), []);
    for (const session of [caller, sibling, foreign]) {
      assertEquals((await backend.sessions.getSession({ sessionId: session.id }))?.state, 'active');
    }
    const accepted = await call(sibling.id);
    assertEquals(accepted.response.status, 200);
    assertEquals(accepted.response.headers.getSetCookie(), []);
    assertEquals((await backend.sessions.getSession({ sessionId: caller.id }))?.state, 'revoked');
    assertEquals((await backend.sessions.getSession({ sessionId: sibling.id }))?.state, 'revoked');
    assertEquals((await backend.sessions.getSession({ sessionId: foreign.id }))?.state, 'active');
  });
}
