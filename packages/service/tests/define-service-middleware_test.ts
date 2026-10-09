import { assertEquals } from '@std/assert';
import { os } from '@orpc/server';
import { z } from 'zod';
import { defineService, type ServiceMiddleware } from '../mod.ts';
import { createStaticCredentialAuthenticator } from '../src/auth/static-credential-authenticator.ts';

const router = os.router({
  ping: os
    .route({ method: 'POST', path: '/ping' })
    .input(z.object({ value: z.string() }))
    .output(z.object({ value: z.string() }))
    .handler(({ input }) => ({ value: input.value })),
});

function clientOrigin(hostname: string, port: number): string {
  const host = hostname === '0.0.0.0' ? '127.0.0.1' : hostname;
  return `http://${host}:${port}`;
}

const authenticator = createStaticCredentialAuthenticator({
  credentials: { token: { subject: 'service:workers', scopes: [] } },
});

interface Observation {
  readonly name: string;
  readonly requestId: unknown;
  readonly principal: unknown;
}

function observing(name: string, seen: Observation[]): ServiceMiddleware {
  return async (c, next) => {
    seen.push({ name, requestId: c.get('requestId'), principal: c.get('principal') });
    await next();
  };
}

Deno.test('defineService middleware runs in order after logging and before auth on both projections', async () => {
  const seen: Observation[] = [];
  const running = await defineService(router, {
    name: 'middleware-order',
    port: 0,
    middleware: [observing('first', seen), observing('second', seen)],
    auth: { authn: { authenticator } },
  });

  try {
    const origin = clientOrigin(running.addr.hostname, running.addr.port);
    const requests = [
      { path: '/api/rpc/ping', body: { json: { value: 'rpc' } } },
      { path: '/api/ping', body: { value: 'openapi' } },
    ];

    for (const { path, body } of requests) {
      seen.length = 0;
      const response = await fetch(`${origin}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
        body: JSON.stringify(body),
      });
      assertEquals(response.status, 200, path);
      await response.body?.cancel();

      assertEquals(seen.map((entry) => entry.name), ['first', 'second'], path);
      for (const entry of seen) {
        // The logger middleware already ran: the request id is set.
        assertEquals(typeof entry.requestId, 'string', path);
        // Authentication has not run yet: no principal.
        assertEquals(entry.principal, undefined, path);
      }
    }
  } finally {
    await running.stop();
  }
});

Deno.test('defineService middleware rejections keep CORS headers and run before authentication', async () => {
  const running = await defineService(router, {
    name: 'middleware-reject',
    port: 0,
    middleware: [async (c, next) => {
      if (c.req.header('x-block') === 'yes') {
        return c.json({ error: 'BLOCKED', message: 'blocked by middleware' }, 429);
      }
      return await next();
    }],
    auth: { authn: { authenticator } },
  });

  try {
    const origin = clientOrigin(running.addr.hostname, running.addr.port);

    // No credential: the middleware still answers first, so the caller sees 429, not 401.
    const blocked = await fetch(`${origin}/api/ping`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://app.example', 'x-block': 'yes' },
      body: JSON.stringify({ value: 'x' }),
    });
    assertEquals(blocked.status, 429);
    assertEquals(blocked.headers.get('access-control-allow-origin'), '*');
    assertEquals(await blocked.json(), { error: 'BLOCKED', message: 'blocked by middleware' });

    // A request the middleware passes reaches authentication.
    const unauthenticated = await fetch(`${origin}/api/rpc/ping`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://app.example' },
      body: JSON.stringify({ json: { value: 'x' } }),
    });
    assertEquals(unauthenticated.status, 401);
    assertEquals(unauthenticated.headers.get('access-control-allow-origin'), '*');
    await unauthenticated.body?.cancel();
  } finally {
    await running.stop();
  }
});

Deno.test('defineService middleware runs before the body limit is enforced', async () => {
  const seenPaths: string[] = [];
  const running = await defineService(router, {
    name: 'middleware-body-limit',
    port: 0,
    middleware: [async (c, next) => {
      seenPaths.push(c.req.path);
      await next();
    }],
    bodyLimit: { maxBytes: 64 },
  });

  try {
    const response = await fetch(
      `${clientOrigin(running.addr.hostname, running.addr.port)}/api/ping`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: 'a'.repeat(256) }),
      },
    );

    assertEquals(response.status, 413);
    assertEquals(response.headers.get('access-control-allow-origin'), '*');
    await response.body?.cancel();
    assertEquals(seenPaths, ['/api/ping']);
  } finally {
    await running.stop();
  }
});
