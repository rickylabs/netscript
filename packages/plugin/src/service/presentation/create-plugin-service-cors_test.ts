import { assertEquals } from '@std/assert';
import type { ServiceApp } from '@netscript/service';
import { createPluginService } from '../mod.ts';

const appOrigin = 'https://app.example';
const otherOrigin = 'https://other.example';

// Environment mutation is process-global; keep cases serial within this module.
async function withOrigins(value: string, run: () => Promise<void>): Promise<void> {
  const previous = Deno.env.get('NETSCRIPT_CORS_ORIGINS');
  Deno.env.set('NETSCRIPT_CORS_ORIGINS', value);
  try {
    await run();
  } finally {
    if (previous === undefined) Deno.env.delete('NETSCRIPT_CORS_ORIGINS');
    else Deno.env.set('NETSCRIPT_CORS_ORIGINS', previous);
  }
}

async function assertPluginOrigin(
  app: ServiceApp,
  origin: string,
  expected: string | null,
): Promise<void> {
  for (const method of ['GET', 'OPTIONS']) {
    const response = await app.request('/health', {
      method,
      headers: { origin, 'access-control-request-method': 'GET' },
    });
    assertEquals(response.headers.get('access-control-allow-origin'), expected, method);
    await response.body?.cancel();
  }
}

Deno.test('createPluginService receives workspace origins through its existing builder seam', async () => {
  await withOrigins(appOrigin, async () => {
    const app = createPluginService({}, {
      name: 'plugin-env',
      auth: { public: true, reason: 'Public health fixture for CORS policy' },
      serveRpc: false,
    }).build();
    await assertPluginOrigin(app, appOrigin, appOrigin);
    await assertPluginOrigin(app, otherOrigin, null);
    const override = createPluginService({}, {
      name: 'plugin-explicit',
      auth: { public: true, reason: 'Public health fixture for CORS policy' },
      serveRpc: false,
      cors: { origin: [otherOrigin] },
    }).build();
    await assertPluginOrigin(override, otherOrigin, otherOrigin);
    await assertPluginOrigin(override, appOrigin, null);
  });
});
