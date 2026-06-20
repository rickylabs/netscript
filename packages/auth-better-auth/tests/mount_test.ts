import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { type BetterAuthInstance, mountBetterAuthHandler } from '../mod.ts';

Deno.test('mountBetterAuthHandler mounts better-auth handler at the configured base path', async () => {
  const app = new Hono();
  const auth: BetterAuthInstance = {
    handler: (request: Request) =>
      Promise.resolve(
        Response.json({
          path: new URL(request.url).pathname,
          method: request.method,
        }),
      ),
    api: {
      getSession: () => Promise.resolve(null),
    },
  };

  const returned = mountBetterAuthHandler(app, auth, { basePath: '/api/auth' });
  const response = await app.request('http://localhost/api/auth/session', {
    method: 'POST',
  });

  assertEquals(returned, app);
  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    path: '/api/auth/session',
    method: 'POST',
  });
});

Deno.test('mountBetterAuthHandler normalizes base path slashes', async () => {
  const app = new Hono();
  const auth: BetterAuthInstance = {
    handler: () => Promise.resolve(new Response('ok')),
    api: {
      getSession: () => Promise.resolve(null),
    },
  };

  mountBetterAuthHandler(app, auth, { basePath: 'auth/' });

  const response = await app.request('http://localhost/auth');

  assertEquals(response.status, 200);
  assertEquals(await response.text(), 'ok');
});
