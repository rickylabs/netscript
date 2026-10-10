import { assertEquals } from '@std/assert';
import { implement } from '@orpc/server';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { createContractAuthorizer, createService, type ServiceApp } from '../../mod.ts';
import {
  type AuthenticatorPort,
  createCompositeAuthenticator,
  createContractOverlayAuthorizer,
  createInstallationSecret,
  createInternalCredentialAuthenticator,
  createStaticCredentialAuthenticator,
  deriveInternalCredential,
  type InstallationSecret,
  type Principal,
} from '../../src/auth/mod.ts';

const SERVICE = 'orders';
const USER_TOKEN = 'user-session-token';

/**
 * One otherwise-public contract: `catalog.list` is unmarked, `internal.sync` relies on oRPC's
 * default OpenAPI projection (no `route.path`), `internal.reindex` declares an explicit route.
 */
const contract = {
  catalog: {
    list: baseContract.route({ method: 'GET', path: '/catalog' }).output(SuccessSchema),
  },
  internal: {
    sync: baseContract.output(SuccessSchema).meta({ access: { audience: 'internal' } }),
    reindex: baseContract.route({ method: 'POST', path: '/internal/reindex' })
      .output(SuccessSchema)
      .meta({ access: { audience: 'internal' } }),
  },
};

const implemented = implement(contract);
const router = implemented.router({
  catalog: { list: implemented.catalog.list.handler(() => ({ success: true })) },
  internal: {
    sync: implemented.internal.sync.handler(() => ({ success: true })),
    reindex: implemented.internal.reindex.handler(() => ({ success: true })),
  },
});

/** Both projections of each internal procedure, as a caller would reach them. */
const INTERNAL_CALLS: readonly { readonly label: string; readonly path: string }[] = [
  { label: 'rpc internal.sync', path: '/api/rpc/internal/sync' },
  { label: 'openapi default internal.sync', path: '/api/internal/sync' },
  { label: 'rpc internal.reindex', path: '/api/rpc/internal/reindex' },
  { label: 'openapi route internal.reindex', path: '/api/internal/reindex' },
];

const sessionAuthenticator = createStaticCredentialAuthenticator({
  credentials: {
    [USER_TOKEN]: {
      subject: 'user:alice',
      roles: ['admin'],
      // A session adapter mapping provider claims cannot mint an internal principal.
      claims: { audience: SERVICE, internal: true },
    },
  },
});

async function secretOf(seed: number): Promise<InstallationSecret> {
  return await createInstallationSecret(new Uint8Array(32).fill(seed));
}

function call(app: ServiceApp, path: string, bearer?: string, method = 'POST') {
  const isRpc = path.startsWith('/api/rpc/');
  return app.request(path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
    },
    ...(method === 'POST' ? { body: isRpc ? '{"json":{}}' : '{}' } : {}),
  });
}

function overlayService(secret: InstallationSecret): ServiceApp {
  return createService(router, { name: SERVICE })
    .withRPC()
    .withAuthn({
      authenticator: createCompositeAuthenticator([
        createInternalCredentialAuthenticator({ secret, service: SERVICE }),
        sessionAuthenticator,
      ]),
      allowAnonymous: ['/api', '/health'],
    })
    .withAuthz({ authorizer: createContractOverlayAuthorizer(contract) })
    .build();
}

async function statusesFor(
  app: ServiceApp,
  bearer: string | undefined,
): Promise<Record<string, number>> {
  const statuses: Record<string, number> = {};
  for (const { label, path } of INTERNAL_CALLS) {
    const response = await call(app, path, bearer);
    await response.body?.cancel();
    statuses[label] = response.status;
  }
  return statuses;
}

function expectAll(status: number): Record<string, number> {
  return Object.fromEntries(INTERNAL_CALLS.map(({ label }) => [label, status]));
}

Deno.test('internal procedures reject uncredentialed calls on both projections', async () => {
  const app = overlayService(await secretOf(1));
  assertEquals(await statusesFor(app, undefined), expectAll(401));
});

Deno.test('internal procedures reject wrong, foreign, cross-service, and rotated credentials', async () => {
  const secret = await secretOf(1);
  const app = overlayService(secret);

  const foreign = await deriveInternalCredential(await secretOf(2), SERVICE);
  const crossService = await deriveInternalCredential(secret, 'billing');
  assertEquals(await statusesFor(app, 'nsi1_not-a-derived-credential'), expectAll(401));
  assertEquals(await statusesFor(app, foreign), expectAll(401));
  assertEquals(await statusesFor(app, crossService), expectAll(401));

  // Rotation is how a credential expires: after the installation secret changes, the service
  // rejects every credential derived from the old one.
  const beforeRotation = await deriveInternalCredential(secret, SERVICE);
  const rotated = overlayService(await secretOf(3));
  assertEquals(await statusesFor(rotated, beforeRotation), expectAll(401));
});

Deno.test('a user-session bearer cannot call internal procedures on either projection', async () => {
  const app = overlayService(await secretOf(1));
  assertEquals(await statusesFor(app, USER_TOKEN), expectAll(403));

  const response = await call(app, '/api/internal/sync', USER_TOKEN);
  assertEquals(await response.json(), {
    error: 'FORBIDDEN',
    message: 'authz.internal-audience',
  });
});

Deno.test('the internal credential reaches internal procedures on both projections', async () => {
  const secret = await secretOf(1);
  const app = overlayService(secret);
  assertEquals(
    await statusesFor(app, await deriveInternalCredential(secret, SERVICE)),
    expectAll(200),
  );
});

Deno.test('unmarked procedures keep the public service policy beside internal ones', async () => {
  const app = overlayService(await secretOf(1));

  const rest = await app.request('/api/catalog');
  const rpc = await call(app, '/api/rpc/catalog/list');
  assertEquals([rest.status, rpc.status], [200, 200]);
  await Promise.all([rest.body?.cancel(), rpc.body?.cancel()]);
});

Deno.test('undeclared methods on an internal OpenAPI path fail closed', async () => {
  const app = overlayService(await secretOf(1));

  for (const method of ['GET', 'HEAD', 'PUT', 'DELETE']) {
    const response = await call(app, '/api/internal/reindex', undefined, method);
    await response.body?.cancel();
    assertEquals(response.status, 401, method);
  }
});

Deno.test('a session-guarded service accepts the internal credential beside user sessions', async () => {
  const secret = await secretOf(1);
  const guardedContract = {
    catalog: contract.catalog,
    internal: { sync: contract.internal.sync },
  };
  const guardedImpl = implement(guardedContract);
  const app = createService(
    guardedImpl.router({
      catalog: { list: guardedImpl.catalog.list.handler(() => ({ success: true })) },
      internal: { sync: guardedImpl.internal.sync.handler(() => ({ success: true })) },
    }),
    { name: SERVICE },
  )
    .withRPC()
    // Default guard: every /api path requires a principal, as for a plugin API behind sessions.
    .withAuthn({
      authenticator: createCompositeAuthenticator([
        createInternalCredentialAuthenticator({ secret, service: SERVICE }),
        sessionAuthenticator,
      ]),
    })
    .withAuthz({ authorizer: createContractOverlayAuthorizer(guardedContract) })
    .build();
  const credential = await deriveInternalCredential(secret, SERVICE);

  const statuses = [];
  for (
    const [path, bearer] of [
      ['/api/catalog', undefined],
      ['/api/catalog', USER_TOKEN],
      ['/api/catalog', credential],
      ['/api/rpc/internal/sync', USER_TOKEN],
      ['/api/rpc/internal/sync', credential],
    ] as const
  ) {
    const response = path === '/api/catalog'
      ? await app.request(path, bearer ? { headers: { authorization: `Bearer ${bearer}` } } : {})
      : await call(app, path, bearer);
    await response.body?.cancel();
    statuses.push(response.status);
  }
  assertEquals(statuses, [401, 200, 200, 403, 200]);
});

Deno.test('the strict contract authorizer also enforces the internal audience', async () => {
  const secret = await secretOf(1);
  const app = createService(router, { name: SERVICE })
    .withRPC()
    .withAuthn({
      authenticator: createCompositeAuthenticator([
        sessionAuthenticator,
        createInternalCredentialAuthenticator({ secret, service: SERVICE }),
      ]),
    })
    .withAuthz({ authorizer: createContractAuthorizer(contract) })
    .build();

  assertEquals(await statusesFor(app, USER_TOKEN), expectAll(403));
  assertEquals(
    await statusesFor(app, await deriveInternalCredential(secret, SERVICE)),
    expectAll(200),
  );
});

Deno.test('a custom internal-caller predicate replaces the default identity check', async () => {
  const trusted: AuthenticatorPort = {
    authenticate: () => ({
      ok: true,
      principal: { subject: 'svc:mesh', scopes: [], roles: [], scheme: 'custom', claims: {} },
    }),
  };
  const app = createService(router, { name: SERVICE })
    .withRPC()
    .withAuthn({ authenticator: trusted, allowAnonymous: ['/api'] })
    .withAuthz({
      authorizer: createContractOverlayAuthorizer(contract, {
        isInternalCaller: (principal: Principal) => principal.subject === 'svc:mesh',
      }),
    })
    .build();

  assertEquals(await statusesFor(app, undefined), expectAll(200));
});
