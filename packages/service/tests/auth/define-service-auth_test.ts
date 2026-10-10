import { assertEquals, assertRejects } from '@std/assert';
import { os } from '@orpc/server';
import { z } from 'zod';
import { defineService, type DefineServiceOptions } from '../../mod.ts';
import { createScopeAuthorizer } from '../../src/auth/scope-authorizer.ts';
import { createStaticCredentialAuthenticator } from '../../src/auth/static-credential-authenticator.ts';

function clientOrigin(hostname: string, port: number): string {
  const host = hostname === '0.0.0.0' ? '127.0.0.1' : hostname;
  return `http://${host}:${port}`;
}

const router = os.router({
  ping: os.route({ method: 'POST', path: '/ping' })
    .input(z.object({ value: z.string() }))
    .output(z.object({ value: z.string() }))
    .handler(({ input }) => ({ value: input.value })),
});

Deno.test('defineService requires an auth policy in the type contract and refuses omission at startup', async () => {
  await assertRejects(
    async () => {
      // @ts-expect-error An explicit ServiceAuthPolicy is required, even for a public service.
      const running = await defineService({}, { name: 'missing-policy', port: 0 });
      // Clean up if a regression starts a listener instead of refusing the policy.
      await running.stop();
    },
    TypeError,
    '{ public: true, reason: "nonblank explanation" }',
  );
});

Deno.test('defineService rejects malformed policies before middleware and database startup', async () => {
  let startupCalls = 0;
  const authenticator = createStaticCredentialAuthenticator({ credentials: {} });
  for (
    const policy of [
      null,
      {},
      { public: true },
      { public: true, reason: '' },
      { public: true, reason: ' \t\n' },
      { public: false, reason: 'Must explicitly opt out' },
      { public: true, reason: 'Ambiguous posture', authn: { authenticator } },
      { authn: { authenticator: {} } },
      { authn: { authenticator }, authz: { authorizer: {} } },
    ]
  ) {
    const options: DefineServiceOptions = {
      name: 'invalid-policy',
      port: 0,
      auth: { public: true, reason: 'Replaced with untyped input below' },
      db: {
        $queryRaw(): Promise<unknown> {
          startupCalls += 1;
          return Promise.resolve(1);
        },
      },
      middleware: [async (_c, next) => {
        startupCalls += 1;
        await next();
      }],
    };
    // Simulate untyped JavaScript/JSON configuration without weakening the public contract.
    Object.defineProperty(options, 'auth', { value: policy });
    await assertRejects(
      async () => {
        const running = await defineService({}, options);
        await running.stop();
      },
      TypeError,
      'Service auth requires',
    );
  }
  assertEquals(startupCalls, 0);
});

Deno.test('defineService explicit public opt-out leaves REST, RPC and health public', async () => {
  const running = await defineService(router, {
    name: 'preset-public',
    port: 0,
    auth: { public: true, reason: 'Public ping and documentation fixture' },
  });

  try {
    for (const path of ['/api/openapi.json', '/health']) {
      const response = await running.app.request(path);
      assertEquals(response.status, 200, path);
      await response.body?.cancel();
    }
    for (
      const [path, body] of [
        ['/api/ping', { value: 'rest' }],
        ['/api/rpc/ping', { json: { value: 'rpc' } }],
      ] as const
    ) {
      const response = await running.app.request(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      assertEquals(response.status, 200, path);
      await response.body?.cancel();
    }
  } finally {
    await running.stop();
  }
});

Deno.test('defineService guarded policy enforces REST and RPC 401, 403, and 200 with anonymous health', async () => {
  const running = await defineService(router, {
    name: 'preset-auth',
    port: 0,
    auth: {
      authn: {
        authenticator: createStaticCredentialAuthenticator({
          credentials: {
            read: {
              subject: 'user:reader',
              scopes: ['docs:read'],
              roles: ['reader'],
            },
            write: {
              subject: 'user:writer',
              scopes: ['docs:write'],
              roles: ['writer'],
            },
          },
        }),
      },
      authz: {
        authorizer: createScopeAuthorizer({
          rules: [{
            match: (request) => request.path.startsWith('/api'),
            requireScopes: ['docs:read'],
          }],
        }),
      },
    },
  });

  try {
    const origin = clientOrigin(running.addr.hostname, running.addr.port);
    const unauthenticated = await fetch(`${origin}/api/openapi.json`);
    assertEquals(unauthenticated.status, 401);
    assertEquals(await unauthenticated.json(), {
      error: 'UNAUTHORIZED',
      message: 'missing-credential',
    });

    const forbidden = await fetch(`${origin}/api/openapi.json`, {
      headers: { authorization: 'Bearer write' },
    });
    assertEquals(forbidden.status, 403);
    assertEquals(await forbidden.json(), {
      error: 'FORBIDDEN',
      message: 'authz.missing-scope:docs:read',
    });

    const allowed = await fetch(`${origin}/api/openapi.json`, {
      headers: { authorization: 'Bearer read' },
    });
    assertEquals(allowed.status, 200);
    await allowed.body?.cancel();

    for (
      const [path, body] of [
        ['/api/ping', { value: 'rest' }],
        ['/api/rpc/ping', { json: { value: 'rpc' } }],
      ] as const
    ) {
      for (const [token, status] of [[undefined, 401], ['write', 403], ['read', 200]] as const) {
        const headers = new Headers({ 'content-type': 'application/json' });
        if (token) headers.set('authorization', `Bearer ${token}`);
        const response = await fetch(`${origin}${path}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
        assertEquals(response.status, status, `${path} ${token ?? 'anonymous'}`);
        await response.body?.cancel();
      }
    }

    for (const path of ['/health', '/health/live', '/health/ready']) {
      const response = await fetch(`${origin}${path}`);
      assertEquals(response.status, 200, path);
      await response.body?.cancel();
    }
  } finally {
    await running.stop();
  }
});

Deno.test('defineService guarded policy supports authentication without authorization', async () => {
  const running = await defineService({}, {
    name: 'authn-only',
    port: 0,
    auth: {
      authn: {
        authenticator: createStaticCredentialAuthenticator({
          credentials: { token: { subject: 'service:reader', scopes: [] } },
        }),
      },
    },
  });
  try {
    const anonymous = await running.app.request('/api/openapi.json');
    assertEquals(anonymous.status, 401);
    await anonymous.body?.cancel();
    const allowed = await running.app.request('/api/openapi.json', {
      headers: { authorization: 'Bearer token' },
    });
    assertEquals(allowed.status, 200);
    await allowed.body?.cancel();
  } finally {
    await running.stop();
  }
});
