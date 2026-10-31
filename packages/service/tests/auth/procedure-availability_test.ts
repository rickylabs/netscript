import { assertEquals, assertStrictEquals, assertThrows } from '@std/assert';
import { assertType, type IsExact } from '@std/testing/types';
import { implement, os } from '@orpc/server';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import {
  createContractAuthorizer,
  createService,
  PROCEDURE_ERROR_CODES,
  type ProcedureErrorCode,
} from '../../mod.ts';
import {
  createStaticCredentialAuthenticator,
  PROCEDURE_ERROR_CODES as AUTH_PROCEDURE_ERROR_CODES,
  type ProcedureErrorCode as AuthProcedureErrorCode,
} from '../../src/auth/mod.ts';

const authenticator = createStaticCredentialAuthenticator({
  credentials: {
    reader: { subject: 'user:reader', scopes: ['items:read'] },
    unscoped: { subject: 'user:unscoped', scopes: [] },
  },
});
const headers = { authorization: 'Bearer reader' };
const contract = {
  current: baseContract.route({ method: 'GET', path: '/v2/items' }).output(SuccessSchema)
    .meta({ access: { authentication: 'required', authorization: { scopes: ['items:read'] } } }),
  public: baseContract.route({ method: 'GET', path: '/public' }).output(SuccessSchema)
    .meta({ access: { authentication: 'none' } }),
  internal: baseContract.route({ method: 'POST', path: '/internal' }).output(SuccessSchema)
    .meta({ access: { authentication: 'required', audience: 'internal' } }),
};
const implemented = implement(contract);
const router = os.router({
  current: implemented.current.handler(() => ({ success: true })),
  public: implemented.public.handler(() => ({ success: true })),
  internal: implemented.internal.handler(() => ({ success: true })),
});
const binding = { apiPath: '/rest', rpcPath: '/transport', rpcAliases: ['/legacy'] };
const retiredPaths = ['/rest/v1/items', '/transport/old', '/legacy/old', '/stream'];

function availabilityApp(paths = retiredPaths, denyByDefault = true) {
  let rawCalls = 0;
  let fallbackCalls = 0;
  const authorizer = createContractAuthorizer(contract, {
    retiredPaths: paths,
    rawRoutes: [{ path: '/rest/raw', authentication: 'required' }],
    fallback: {
      authorize: () => ({ allow: true }),
      authorizeMatch: () => {
        fallbackCalls++;
        return { matched: true, decision: { allow: true } };
      },
    },
  });
  const app = createService(router, { name: 'procedure-availability' })
    .withRPC(binding)
    .withAuthn({ authenticator, protect: ['/rest', '/transport', '/legacy'] })
    .withAuthz({ authorizer, denyByDefault })
    .route('all', '/rest/raw', (c) => c.json({ raw: true }))
    .route('all', '/rest/hidden', (c) => {
      rawCalls++;
      return c.json({ reached: true });
    })
    .route('all', '/stream', (c) => {
      rawCalls++;
      return c.json({ reached: true });
    })
    .build();
  return { app, rawCalls: () => rawCalls, fallbackCalls: () => fallbackCalls };
}

Deno.test('procedure availability codes are typed and identical on root and auth imports', () => {
  assertType<IsExact<ProcedureErrorCode, 'procedure_not_found' | 'procedure_retired'>>(true);
  assertType<IsExact<ProcedureErrorCode, AuthProcedureErrorCode>>(true);
  assertType<
    IsExact<ProcedureErrorCode, typeof PROCEDURE_ERROR_CODES[keyof typeof PROCEDURE_ERROR_CODES]>
  >(true);
  assertType<
    IsExact<typeof PROCEDURE_ERROR_CODES, {
      readonly NOT_FOUND: 'procedure_not_found';
      readonly RETIRED: 'procedure_retired';
    }>
  >(true);
  assertType<IsExact<typeof PROCEDURE_ERROR_CODES, typeof AUTH_PROCEDURE_ERROR_CODES>>(true);
  const code: ProcedureErrorCode = AUTH_PROCEDURE_ERROR_CODES.RETIRED;
  const authCode: AuthProcedureErrorCode = PROCEDURE_ERROR_CODES.RETIRED;
  assertEquals(code, 'procedure_retired');
  assertEquals(authCode, code);
  assertStrictEquals(PROCEDURE_ERROR_CODES, AUTH_PROCEDURE_ERROR_CODES);
});

Deno.test('procedure availability: authenticated unknown REST, RPC and alias paths return 404', async () => {
  const fixture = availabilityApp();
  for (const path of ['/rest/missing', '/transport/missing', '/legacy/missing', '/rest/hidden']) {
    const response = await fixture.app.request(path, { headers });
    assertEquals(response.status, 404, path);
    assertEquals(await response.json(), {
      error: 'NOT_FOUND',
      message: 'authz.no-contract-procedure',
      code: 'procedure_not_found',
    }, path);
  }
  assertEquals(fixture.rawCalls(), 0);
  assertEquals(fixture.fallbackCalls(), 0);
});

Deno.test('procedure availability: declared retired REST, RPC, alias and raw paths return 410', async () => {
  const fixture = availabilityApp();
  for (const path of retiredPaths) {
    for (const method of ['GET', 'POST', 'DELETE']) {
      const response = await fixture.app.request(`${path}?oldClient=true`, { headers, method });
      assertEquals(response.status, 410, `${method} ${path}`);
      assertEquals(await response.json(), {
        error: 'GONE',
        message: 'authz.procedure-retired',
        code: 'procedure_retired',
      });
    }
  }
  assertEquals(fixture.rawCalls(), 0);
  assertEquals(fixture.fallbackCalls(), 0);
});

Deno.test('procedure availability: missing or invalid credentials disclose no availability', async () => {
  const { app } = availabilityApp();
  for (const path of [...retiredPaths, '/rest/missing', '/transport/missing', '/legacy/missing']) {
    for (const authorization of [undefined, 'Bearer invalid', 'Basic invalid']) {
      const response = await app.request(path, {
        headers: authorization ? { authorization } : {},
      });
      assertEquals(response.status, 401, path);
      const body = await response.json();
      assertEquals(body.error, 'UNAUTHORIZED');
      assertEquals('code' in body, false);
    }
  }
});

Deno.test('procedure availability: retirement cannot shadow current scopes, public or raw routes', async () => {
  const { app } = availabilityApp([
    '/rest/v2/items',
    '/transport/current',
    '/legacy/current',
    '/rest/public',
    '/rest/raw',
  ]);
  for (const path of ['/rest/v2/items', '/transport/current', '/legacy/current']) {
    const denied = await app.request(path, { headers: { authorization: 'Bearer unscoped' } });
    assertEquals(denied.status, 403, path);
    assertEquals(await denied.json(), {
      error: 'FORBIDDEN',
      message: 'authz.missing-scope:items:read',
    });
    const allowed = await app.request(path, { headers });
    assertEquals(allowed.status, 200);
    await allowed.body?.cancel();
  }
  const publicResponse = await app.request('/rest/public');
  assertEquals(publicResponse.status, 200);
  await publicResponse.body?.cancel();
  const raw = await app.request('/rest/raw', { headers });
  assertEquals(raw.status, 200);
  assertEquals(await raw.json(), { raw: true });
});

Deno.test('procedure availability: retired declaration cannot shadow an internal audience guard', async () => {
  const { app } = availabilityApp(['/rest/internal']);
  for (const method of ['POST', 'GET', 'HEAD']) {
    const response = await app.request('/rest/internal', { headers, method });
    assertEquals(response.status, 403, method);
    await response.body?.cancel();
  }
});

Deno.test('procedure availability: raw path spelling is exact and cannot retire siblings', async () => {
  const { app } = availabilityApp(['/rest/old']);
  for (const path of ['/rest/old/', '/rest/old/child', '/rest/older', '/rest/Old', '/rest/%6Fld']) {
    const response = await app.request(path, { headers });
    assertEquals(response.status, 404, path);
    assertEquals((await response.json()).code, 'procedure_not_found');
  }
  const retired = await app.request('/rest/old?version=1', { headers });
  assertEquals(retired.status, 410);
  await retired.body?.cancel();
});

Deno.test('procedure availability: declaration snapshots and fail-open options never revive a path', async () => {
  const paths = ['/rest/old'];
  const { app } = availabilityApp(paths, false);
  paths.splice(0, 1, '/rest/later');
  for (const [path, status] of [['/rest/old', 410], ['/rest/later', 404]] as const) {
    const response = await app.request(path, { headers });
    assertEquals(response.status, status);
    await response.body?.cancel();
  }
});

Deno.test('procedure availability: authz without a principal refuses before typed failures', async () => {
  const app = createService({}, { name: 'procedure-authz-only' })
    .withAuthz({
      authorizer: createContractAuthorizer({}, { retiredPaths: ['/api/old', '/stream'] }),
    })
    .build();
  for (const path of ['/api/old', '/api/missing', '/stream']) {
    const response = await app.request(path);
    assertEquals(response.status, 401);
    assertEquals(await response.json(), { error: 'UNAUTHORIZED', message: 'missing-principal' });
  }
});

Deno.test('procedure availability: retired paths override anonymous prefix exemptions', async () => {
  const app = createService({}, { name: 'retired-anonymous' })
    .withAuthn({ authenticator, allowAnonymous: ['/api/old'] })
    .withAuthz({ authorizer: createContractAuthorizer({}, { retiredPaths: ['/api/old'] }) })
    .build();
  const anonymous = await app.request('/api/old');
  assertEquals(anonymous.status, 401);
  await anonymous.body?.cancel();
  const authenticated = await app.request('/api/old', { headers });
  assertEquals(authenticated.status, 410);
  await authenticated.body?.cancel();
});

Deno.test('procedure availability: invalid or duplicate retirement declarations fail before build', () => {
  for (
    const path of [
      '',
      'relative',
      '/old/',
      '/old/*',
      '/old/:id',
      '/old/{id}',
      '/old?x=1',
      '/old#hash',
      '/%6Fld',
      '/old\\child',
      '/old child',
      '/old//child',
      '/old/./child',
      '/old/../child',
    ]
  ) {
    assertThrows(
      () => createContractAuthorizer({}, { retiredPaths: [path] }),
      TypeError,
      '[netscript.service.contract-policy] invalid retired path',
    );
  }
  assertThrows(
    () => createContractAuthorizer({}, { retiredPaths: ['/old', '/old'] }),
    TypeError,
    'is declared more than once',
  );
});
