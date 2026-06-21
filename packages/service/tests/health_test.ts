import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { createHealthHandler, createLivenessHandler, createReadinessHandler } from '../mod.ts';

Deno.test('createHealthHandler returns healthy with no checks', async () => {
  const app = new Hono();
  app.get('/health', createHealthHandler());
  const response = await app.request('/health');
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.status, 'healthy');
});

Deno.test('createLivenessHandler returns ok', async () => {
  const app = new Hono();
  app.get('/health/live', createLivenessHandler());
  const response = await app.request('/health/live');
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.status, 'ok');
});

Deno.test('createReadinessHandler reports failed readiness', async () => {
  const app = new Hono();
  app.get('/health/ready', createReadinessHandler([() => Promise.resolve(false)]));
  const response = await app.request('/health/ready');
  const body = await response.json();

  assertEquals(response.status, 503);
  assertEquals(body.ready, false);
});
