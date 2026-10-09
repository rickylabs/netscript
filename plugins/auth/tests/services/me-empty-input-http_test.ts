// Regression for #1999 (and duplicate #2025): `me` with no input must reach the handler over
// both the OpenAPI GET adapter and RPC, for browsers (cookie) and service identities (bearer).
import { assert, assertEquals, assertFalse } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { createServiceClient } from '../../../../packages/sdk/src/client/mod.ts';
import { createBearerSdkClientContribution } from '../../../../packages/plugin-auth-core/src/sdk/mod.ts';
import {
  authContract,
  MeResponseSchema,
  SessionResponseSchema,
} from '../../../../packages/plugin-auth-core/src/contracts/v1/mod.ts';
import {
  createKvOAuthTestRegistry,
  mintTestSession,
  serveAuthTestService,
} from '../testing/auth-service-fixture.ts';

const SIGNED_OUT = { authenticated: false } as const;

async function readJson(response: Response): Promise<unknown> {
  return await response.json();
}

Deno.test('auth me accepts an empty request over OpenAPI and RPC (#1999)', async (t) => {
  await using kv = new MemoryKvAdapter();
  const registry = await createKvOAuthTestRegistry(kv);
  const sessionId = await mintTestSession(registry);
  await using service = await serveAuthTestService(registry);
  const rest = (path: string, headers?: HeadersInit) =>
    fetch(`${service.baseUrl}/api/v1/auth${path}`, { headers });
  const rpc = (path: string, body?: string) =>
    fetch(`${service.baseUrl}/api/rpc/v1/auth${path}`, {
      method: 'POST',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body,
    });

  await t.step('OpenAPI GET /me without credentials reaches the handler', async () => {
    for (const path of ['/me', '/me?', '/me?unused=1']) {
      const response = await rest(path);
      assertEquals(response.status, 200, path);
      assertEquals(await readJson(response), SIGNED_OUT, path);
    }
    const invalidBearer = await rest('/me', { authorization: 'Bearer not-a-session' });
    assertEquals(invalidBearer.status, 200);
    assertEquals(await readJson(invalidBearer), SIGNED_OUT);
  });

  await t.step('RPC me without arguments or body returns signed-out', async () => {
    const client = createServiceClient({
      contract: authContract,
      serviceName: service.serviceName,
      routerName: 'auth',
      propagateTraceContext: false,
    });
    assertEquals(await client.me(), SIGNED_OUT);
    for (const body of [undefined, '{}', JSON.stringify({ json: {} })]) {
      const response = await rpc('/me', body);
      assertEquals(response.status, 200, String(body));
      assertEquals(await readJson(response), { json: SIGNED_OUT }, String(body));
    }
  });

  await t.step(
    'signed-out is a typed response body, distinct from a malformed request',
    async () => {
      const response = await rest('/me');
      const body = MeResponseSchema.parse(await readJson(response));
      assertEquals(body, SIGNED_OUT);
      assertFalse('code' in body, 'signed-out must not carry an error code');
    },
  );

  await t.step('a malformed input 400 names the offending input', async () => {
    const response = await rpc('/me', JSON.stringify({ json: 'not-an-object' }));
    assertEquals(response.status, 400);
    const { json: error } = await readJson(response) as {
      json: { code: string; data: { issues: { expected: string; message: string }[] } };
    };
    assertEquals(error.code, 'BAD_REQUEST');
    const [issue] = error.data.issues;
    assertEquals(issue.expected, 'object');
    assert(issue.message.includes('received string'), issue.message);
    assertFalse(JSON.stringify(error).includes('expected undefined'));
  });

  await t.step('authenticated me, /session and unknown paths are unchanged', async () => {
    const cookie = { cookie: `__Host-ns_session=${sessionId}` };
    const response = await rest('/me', cookie);
    assertEquals(response.status, 200);
    const body = MeResponseSchema.parse(await readJson(response));
    assertEquals(body.authenticated, true);
    assertEquals(body.session?.id, sessionId);
    assert(body.user?.id);

    const anonymousSession = await rest('/session');
    assertEquals(anonymousSession.status, 200);
    assertEquals(await readJson(anonymousSession), SIGNED_OUT);
    const session = await rest('/session', cookie);
    assertEquals(session.status, 200);
    assertEquals(SessionResponseSchema.parse(await readJson(session)).session?.id, sessionId);
    const unknown = await rest('/does-not-exist');
    assertEquals(unknown.status, 404);
    await unknown.body?.cancel();
  });

  await t.step(
    'a bearer client with an invalid bearer credential reaches me as signed-out',
    async () => {
      const bearerClient = createServiceClient({
        contract: authContract,
        serviceName: service.serviceName,
        routerName: 'auth',
        propagateTraceContext: false,
        contributions: [
          createBearerSdkClientContribution<{ accessToken: string }>({
            context: { accessToken: 'required' },
            resolveCredential: ({ context }) => context.accessToken,
            responseCache: { mode: 'direct-only' },
          }),
        ] as const,
      });
      assertEquals(
        await bearerClient.me(undefined, { context: { accessToken: 'not-a-session' } }),
        SIGNED_OUT,
      );
    },
  );
});
