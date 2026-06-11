import { assertEquals } from '@std/assert';
import { createService } from '../mod.ts';

Deno.test('createService builder builds a mountable health app', async () => {
  const app = createService({}, { name: 'users', version: '1.2.3' })
    .withHealth()
    .build();

  const response = await app.request('/health');
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.status, 'healthy');
  assertEquals(body.version, '1.2.3');
});

Deno.test('custom health checks affect health status', async () => {
  const app = createService({}, { name: 'users' })
    .withHealthCheck({
      name: 'dependency',
      check: () => Promise.resolve({ healthy: false, message: 'offline' }),
    })
    .withHealth()
    .build();

  const response = await app.request('/health');
  const body = await response.json();

  assertEquals(response.status, 503);
  assertEquals(body.status, 'unhealthy');
  assertEquals(body.checks[0].name, 'dependency');
});
