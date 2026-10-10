// Regression for #2120: on kv-oauth, `me` must resolve a bearer session credential exactly as
// `/session` does — cookie, bearer, and competing cookie+bearer — over OpenAPI REST and RPC.
import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { createServiceClient } from '../../../../packages/sdk/src/client/mod.ts';
import { createBearerSdkClientContribution } from '../../../../packages/plugin-auth-core/src/sdk/mod.ts';
import {
  authContract,
  type MeResponse,
  MeResponseSchema,
  type SessionResponse,
  SessionResponseSchema,
} from '../../../../packages/plugin-auth-core/src/contracts/v1/mod.ts';
import {
  createKvOAuthTestRegistry,
  mintTestSession,
  serveAuthTestService,
} from '../testing/auth-service-fixture.ts';

const SIGNED_OUT = { authenticated: false } as const;

Deno.test('auth me resolves bearer credentials like /session on kv-oauth (#2120)', async (t) => {
  await using kv = new MemoryKvAdapter();
  const registry = await createKvOAuthTestRegistry(kv);
  const sessionId = await mintTestSession(registry);
  const otherSessionId = await mintTestSession(registry);
  await using service = await serveAuthTestService(registry);

  const restMe = async (headers: HeadersInit): Promise<MeResponse> => {
    const response = await fetch(`${service.baseUrl}/api/v1/auth/me`, { headers });
    assertEquals(response.status, 200);
    return MeResponseSchema.parse(await response.json());
  };
  const restSession = async (headers: HeadersInit): Promise<SessionResponse> => {
    const response = await fetch(`${service.baseUrl}/api/v1/auth/session`, { headers });
    assertEquals(response.status, 200);
    return SessionResponseSchema.parse(await response.json());
  };
  const cookie = (id: string) => ({ cookie: `__Host-ns_session=${id}` });
  const bearer = (id: string) => ({ authorization: `Bearer ${id}` });

  const cookieMe = await restMe(cookie(sessionId));
  assertEquals(cookieMe.authenticated, true);
  assertEquals(cookieMe.session?.id, sessionId);
  assert(cookieMe.user?.id);

  await t.step('REST GET /me with a valid bearer matches the cookie path', async () => {
    const bearerMe = await restMe(bearer(sessionId));
    assertEquals(bearerMe.authenticated, true);
    assertEquals(bearerMe.user, cookieMe.user);
    assertEquals(bearerMe.session?.id, cookieMe.session?.id);
    assertEquals(bearerMe.session?.subject, cookieMe.session?.subject);
    assertEquals((await restSession(bearer(sessionId))).session?.id, bearerMe.session?.id);
  });

  await t.step('competing cookie and bearer: me follows the /session precedence', async () => {
    const competing = { ...bearer(sessionId), ...cookie(otherSessionId) };
    const expected = (await restSession(competing)).session?.id;
    assertEquals(expected, sessionId);
    assertEquals((await restMe(competing)).session?.id, expected);
    // A malformed authorization header is not a bearer credential: both fall back to the cookie.
    for (const authorization of ['Bearer', 'Basic credential', 'Bearer a b', 'Bearer a,b']) {
      const headers = { authorization, ...cookie(otherSessionId) };
      assertEquals((await restSession(headers)).session?.id, otherSessionId, authorization);
      assertEquals((await restMe(headers)).session?.id, otherSessionId, authorization);
    }
  });

  await t.step('an invalid bearer is signed out on me exactly as on /session', async () => {
    for (
      const headers of [bearer('not-a-session'), {
        ...bearer('not-a-session'),
        ...cookie(sessionId),
      }]
    ) {
      assertEquals(await restSession(headers), SIGNED_OUT);
      assertEquals(await restMe(headers), SIGNED_OUT);
    }
  });

  await t.step('the typed SDK bearer client me() matches the cookie path over RPC', async () => {
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
    const rpcMe = await bearerClient.me(undefined, { context: { accessToken: sessionId } });
    assertEquals(rpcMe.authenticated, true);
    assertEquals(rpcMe.user, cookieMe.user);
    assertEquals(rpcMe.session?.id, sessionId);
    const rpcSession = await bearerClient.session(undefined, {
      context: { accessToken: sessionId },
    });
    assertEquals(rpcSession.session?.id, rpcMe.session?.id);
    assertEquals(
      await bearerClient.me(undefined, { context: { accessToken: 'not-a-session' } }),
      SIGNED_OUT,
    );
  });

  await t.step('a revoked bearer session is signed out on me and /session', async () => {
    await registry.resolveBackend().sessions.revokeSession(sessionId);
    assertEquals(await restSession(bearer(sessionId)), SIGNED_OUT);
    assertEquals(await restMe(bearer(sessionId)), SIGNED_OUT);
  });
});
