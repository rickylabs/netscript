import { assertEquals } from '@std/assert';
import { type Context, Hono } from 'hono';
import { loggerMiddleware, type LoggerMiddlewareEnv } from '../middleware.ts';

Deno.test('loggerMiddleware injects request metadata into Hono context', async () => {
  const app = new Hono<LoggerMiddlewareEnv>();

  app.use('*', loggerMiddleware('users'));
  app.get('/users', (ctx: Context<LoggerMiddlewareEnv>) =>
    ctx.json({
      hasLogger: Boolean(ctx.get('logger')),
      requestId: ctx.get('requestId'),
    }));

  const response = await app.request('http://localhost/users', {
    headers: {
      'X-Request-ID': 'req-123',
    },
  });

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    hasLogger: true,
    requestId: 'req-123',
  });
});
