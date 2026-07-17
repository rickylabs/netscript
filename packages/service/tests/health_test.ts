import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import {
  createHealthHandler,
  createLivenessHandler,
  createReadinessHandler,
  healthChecks,
} from '../mod.ts';

Deno.test('createHealthHandler returns healthy with no checks', async () => {
  const app = new Hono();
  app.get('/health', createHealthHandler());
  const response = await app.request('/health');
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.status, 'healthy');
});

for (
  const [adapterClass, check] of [
    [
      'database',
      healthChecks.database(
        { $queryRaw: () => Promise.reject(new Error('unused database invoked')) },
        { configured: false },
      ),
    ],
    ['kv', healthChecks.kv({ configured: false })],
    ['service', healthChecks.service('unused', 'http://127.0.0.1:1', { configured: false })],
    [
      'custom',
      healthChecks.custom(
        'unused-custom',
        () => Promise.reject(new Error('unused custom invoked')),
        { configured: false },
      ),
    ],
  ] as const
) {
  Deno.test(`createHealthHandler excludes unconfigured ${adapterClass} adapter`, async () => {
    const app = new Hono();
    app.get('/health', createHealthHandler({ checks: [check] }));

    const response = await app.request('/health');
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.status, 'healthy');
    assertEquals(body.checks, []);
  });
}

Deno.test('createHealthHandler keeps configured adapter failures authoritative', async () => {
  const app = new Hono();
  app.get(
    '/health',
    createHealthHandler({
      checks: [
        healthChecks.custom('configured-failure', () => Promise.resolve(false), {
          configured: true,
        }),
      ],
    }),
  );

  const response = await app.request('/health');
  const body = await response.json();

  assertEquals(response.status, 503);
  assertEquals(body.status, 'unhealthy');
  assertEquals(body.checks[0].name, 'configured-failure');
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
