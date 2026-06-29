import { assertEquals } from '@std/assert';
import { implement, os } from '@orpc/server';
import { createPluginService } from '../../src/service/mod.ts';
import {
  BASE_PLUGIN_CONTRACT_ROUTES,
  type BasePluginContract,
  type PluginCapabilities,
} from '../../src/contract-base/mod.ts';

const sampleContract = {
  ...BASE_PLUGIN_CONTRACT_ROUTES,
} satisfies BasePluginContract;

const capabilities: PluginCapabilities = {
  pluginName: '@netscript/plugin-sample',
  contractVersions: ['v1'],
  routeGroups: ['describe'],
  capabilities: ['describe'],
};

// deno-lint-ignore no-explicit-any
const implemented = implement(sampleContract as any);
// deno-lint-ignore no-explicit-any
const router: any = os.router({
  // deno-lint-ignore no-explicit-any
  describe: (implemented as any).describe.handler(() => capabilities),
});

Deno.test('createPluginService serves health, service info, and the describe oRPC route', async () => {
  const app = createPluginService(router, {
    name: 'sample',
    version: '9.9.9',
    openApi: { title: 'Sample Plugin API' },
  }).build();

  const health = await app.request('/health');
  assertEquals(health.status, 200);
  const healthBody = await health.json();
  assertEquals(healthBody.status, 'healthy');
  assertEquals(healthBody.version, '9.9.9');

  const live = await app.request('/health/live');
  assertEquals(live.status, 200);

  const info = await app.request('/');
  assertEquals(info.status, 200);
  const infoBody = await info.json();
  assertEquals(infoBody.service, 'sample');
  assertEquals(infoBody.version, '9.9.9');

  const describe = await app.request('/api/describe');
  assertEquals(describe.status, 200);
  const describeBody = await describe.json();
  assertEquals(describeBody.pluginName, '@netscript/plugin-sample');
  assertEquals(describeBody.contractVersions, ['v1']);
});

Deno.test('createPluginService runs onStartup hooks on serve()', async () => {
  let started = false;

  const running = await createPluginService(router, {
    name: 'sample',
    version: '9.9.9',
    onStartup: [
      async () => {
        await Promise.resolve();
        started = true;
      },
    ],
  }).serve({ port: 0 });

  try {
    assertEquals(started, true);
  } finally {
    await running.stop();
  }
});
