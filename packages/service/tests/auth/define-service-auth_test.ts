import { assertEquals } from '@std/assert';
import { defineService } from '../../mod.ts';
import { createScopeAuthorizer } from '../../src/auth/scope-authorizer.ts';
import { createStaticCredentialAuthenticator } from '../../src/auth/static-credential-authenticator.ts';

function clientOrigin(hostname: string, port: number): string {
  const host = hostname === '0.0.0.0' ? '127.0.0.1' : hostname;
  return `http://${host}:${port}`;
}

Deno.test('defineService without auth leaves api routes public', async () => {
  const running = await defineService({}, { name: 'preset-public', port: 0 });

  try {
    const response = await fetch(
      `${clientOrigin(running.addr.hostname, running.addr.port)}/api/openapi.json`,
    );

    assertEquals(response.status, 200);
  } finally {
    await running.stop();
  }
});

Deno.test('defineService auth option enforces 401, 403, and 200', async () => {
  const running = await defineService({}, {
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
  } finally {
    await running.stop();
  }
});
