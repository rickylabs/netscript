import { assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { createWorkosBackend, createWorkosRevocationStore } from '@netscript/auth-workos';
import { createAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';
import { serveAuthTestService } from '../testing/auth-service-fixture.ts';
import {
  cutoff,
  sessionClient,
} from '../../../../packages/auth-workos/tests/testing/revocation-fixture.ts';

for (const path of ['/api/v1/auth/signout', '/api/rpc/v1/auth/signout', '/api/rpc/v1/signout']) {
  Deno.test(`WorkOS everywhere signout ends both subject sessions over ${path}`, async () => {
    await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
    const revocations = createWorkosRevocationStore(kv);
    const backend = createWorkosBackend({
      workos: sessionClient(),
      cookiePassword: 'x'.repeat(32),
      cookie: { name: '__Host-ns_session' },
      revocations,
      now: () => new Date(cutoff),
    });
    const registry = createAuthBackendRegistry(new Map([['workos', backend]]), 'workos');
    await using service = await serveAuthTestService(registry);
    const me = async (token: string) => {
      const response = await fetch(`${service.baseUrl}/api/v1/auth/me`, {
        headers: { cookie: `__Host-ns_session=${token}` },
      });
      assertEquals(response.status, 200);
      return (await response.json()).authenticated;
    };
    for (const token of ['alice:a', 'alice:b', 'bob:c']) assertEquals(await me(token), true);
    const rpc = path.includes('/rpc/');
    const response = await fetch(`${service.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: '__Host-ns_session=alice:a' },
      body: JSON.stringify(rpc ? { json: { everywhere: true } } : { everywhere: true }),
    });
    const body = await response.json();
    assertEquals(response.status, 200);
    assertEquals((rpc ? body.json : body).signedOut, true);
    assertEquals(await me('alice:a'), false);
    assertEquals(await me('alice:b'), false);
    assertEquals(await me('bob:c'), true);
    const again = await fetch(`${service.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: '__Host-ns_session=alice:b' },
      body: JSON.stringify(rpc ? { json: {} } : {}),
    });
    await again.body?.cancel();
    assertEquals(again.status, 401);
  });
}
