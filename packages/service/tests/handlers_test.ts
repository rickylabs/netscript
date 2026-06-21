import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { createErrorHandler, createNotFoundHandler } from '../mod.ts';

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
