import { assertEquals } from '@std/assert';
import { os } from '@orpc/server';
import { Hono } from 'hono';
import { z } from 'jsr:@zod/zod@4.4.3';
import {
  createErrorHandler,
  createNotFoundHandler,
  createOpenAPIHandler,
  createOpenAPISpec,
} from '../mod.ts';

interface OpenAPIParameter {
  readonly in?: string;
  readonly name?: string;
  readonly schema?: { readonly type?: string };
}

Deno.test('createOpenAPIHandler coerces a docs-shaped numeric query parameter', async () => {
  const router = os.router({
    board: os
      .route({ method: 'GET', path: '/issues/board' })
      .input(z.object({ cycleId: z.number() }))
      .output(z.object({ cycleId: z.number() }))
      .handler(({ input }) => ({ cycleId: input.cycleId })),
  });
  const handler = createOpenAPIHandler(router);
  const docs = new Hono();
  docs.get(
    '/api/openapi.json',
    createOpenAPISpec(router, { title: 'Issue API', version: '1.0.0' }),
  );

  const specResponse = await docs.request('/api/openapi.json');
  const spec = await specResponse.json() as {
    readonly paths?: Record<
      string,
      { readonly get?: { readonly parameters?: OpenAPIParameter[] } }
    >;
  };
  const cycleId = spec.paths?.['/issues/board']?.get?.parameters?.find((parameter) =>
    parameter.name === 'cycleId'
  );

  const result = await handler.handle(
    new Request('http://localhost/api/issues/board?cycleId=1'),
    { prefix: '/api' },
  );

  assertEquals(specResponse.status, 200);
  assertEquals(cycleId?.in, 'query');
  assertEquals(cycleId?.schema?.type, 'number');
  assertEquals(result.matched, true);
  assertEquals(result.response?.status, 200);
  assertEquals(await result.response?.json(), { cycleId: 1 });
});

Deno.test('createNotFoundHandler returns service-scoped not found response', async () => {
  const app = new Hono();
  app.notFound(createNotFoundHandler('users'));
  const response = await app.request('/unknown');
  const body = await response.json();

  assertEquals(response.status, 404);
  assertEquals(body.error, 'NOT_FOUND');
  assertEquals(body.path, '/unknown');
});

Deno.test('createErrorHandler returns production-safe error response', async () => {
  const app = new Hono();
  app.onError(createErrorHandler('users'));
  app.get('/boom', () => {
    throw new Error('boom');
  });
  const response = await app.request('/boom');
  const body = await response.json();

  assertEquals(response.status, 500);
  assertEquals(body.error, 'INTERNAL_ERROR');
});
