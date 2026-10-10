import {
  createAuthServiceAuthenticator,
  REMOTE_SESSION_REJECTIONS,
} from '@netscript/plugin-auth-core/authenticator';
import { toAuthnRequest } from '../../services/src/routers/v1-helpers.ts';
import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { createServiceClient } from '../../../../packages/sdk/src/client/mod.ts';
import { createBearerSdkClientContribution } from '../../../../packages/plugin-auth-core/src/sdk/mod.ts';
import {
  authContract,
  SessionResponseSchema,
} from '../../../../packages/plugin-auth-core/src/contracts/v1/mod.ts';
import {
  createKvOAuthTestRegistry,
  mintTestSession,
  serveAuthTestService,
} from '../testing/auth-service-fixture.ts';
import { authTestUrl } from '../testing/auth-fixtures.ts';

Deno.test('native auth service verifies bearer sessions through the SDK and preserves cookies', async () => {
  await using kv = new MemoryKvAdapter();
  const registry = await createKvOAuthTestRegistry(kv);
  const sessionId = await mintTestSession(registry);
  const otherSessionId = await mintTestSession(registry);

  await using service = await serveAuthTestService(registry);
  const { serviceName } = service;
  const plain = createServiceClient({
    contract: authContract,
    serviceName,
    routerName: 'auth',
    propagateTraceContext: false,
  });
  const nativeSession = await plain.session({ sessionId });
  assertEquals(nativeSession.authenticated, true);
  // Exercise the browser cookie transport separately; SDK bearer calls remain typed.
  const cookieResponse = await fetch(
    `${service.baseUrl}/api/rpc/v1/auth/session`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `__Host-ns_session=${sessionId}` },
      body: JSON.stringify({ json: {} }),
    },
  );
  assertEquals(cookieResponse.status, 200);
  assertEquals((await cookieResponse.json()).json.authenticated, true);
  const bearer = createBearerSdkClientContribution<{ accessToken: string }>({
    context: { accessToken: 'required' },
    resolveCredential: ({ context }) => context.accessToken,
    responseCache: { mode: 'direct-only' },
  });
  const bearerClient = createServiceClient({
    contract: authContract,
    serviceName,
    routerName: 'auth',
    propagateTraceContext: false,
    contributions: [bearer] as const,
  });
  assertEquals(
    (await bearerClient.session(undefined, { context: { accessToken: sessionId } }))
      .authenticated,
    true,
  );
  assertEquals(
    (await bearerClient.session(undefined, { context: { accessToken: 'not-a-session' } }))
      .authenticated,
    false,
  );
  const httpSession = async (headers: HeadersInit, input: { sessionId?: string } = {}) => {
    const response = await fetch(
      `${service.baseUrl}/api/rpc/v1/auth/session`,
      {
        method: 'POST',
        headers: new Headers({
          'content-type': 'application/json',
          ...Object.fromEntries(new Headers(headers)),
        }),
        body: JSON.stringify({ json: input }),
      },
    );
    assertEquals(response.status, 200);
    return SessionResponseSchema.parse((await response.json()).json);
  };
  const competingHeaders = {
    authorization: `Bearer ${sessionId}`,
    cookie: `__Host-ns_session=${otherSessionId}`,
  };
  assertEquals((await httpSession(competingHeaders)).session?.id, sessionId);
  assertEquals(
    (await httpSession(competingHeaders, { sessionId: otherSessionId })).session?.id,
    otherSessionId,
  );
  for (const authorization of ['Bearer', 'Basic credential', 'Bearer a b', 'Bearer a,b']) {
    assertEquals(
      (await httpSession({
        authorization,
        cookie: `__Host-ns_session=${otherSessionId}`,
      })).session?.id,
      otherSessionId,
    );
  }
  assertEquals(
    (await httpSession({ authorization: `bearer ${sessionId}` })).session?.id,
    sessionId,
  );
  // Interleave cookie and bearer requests against one request-context bridge.
  const ids = await Promise.all(Array.from({ length: 12 }, async (_, index) => {
    const expected = index % 2 === 0 ? sessionId : otherSessionId;
    const observed = await httpSession(
      index % 3 === 0
        ? { cookie: `__Host-ns_session=${expected}` }
        : { authorization: `Bearer ${expected}` },
    );
    assertEquals(observed.session?.id, expected);
    return observed.session?.id;
  }));
  assertEquals(new Set(ids).size, 2);
  const authenticator = createAuthServiceAuthenticator({ serviceName, timeoutMs: 1000 });
  const request = toAuthnRequest({
    url: authTestUrl('/api/private'),
    headers: new Headers({ authorization: `Bearer ${sessionId}` }),
  });
  const verified = await authenticator.authenticate(request);
  assert(verified.ok);
  assertEquals(verified.principal.scheme, 'bearer');
  assertEquals(verified.principal.claims, nativeSession.session?.claims);
  assertEquals(await authenticator.authenticate(toAuthnRequest(undefined)), {
    ok: false,
    reason: REMOTE_SESSION_REJECTIONS.bearerMissing,
  });
  await registry.resolveBackend().sessions.revokeSession(sessionId);
  assertEquals(await authenticator.authenticate(request), {
    ok: false,
    reason: REMOTE_SESSION_REJECTIONS.notActive,
  });
  assertEquals(
    (await bearerClient.session(undefined, { context: { accessToken: sessionId } }))
      .authenticated,
    false,
  );
});
