import { assertEquals } from '@std/assert';
import { implement, os } from '@orpc/server';
import type { ServiceBuilder, ServiceRouter } from '@netscript/service';
import type {
  Principal as RootPrincipal,
  ServiceHandlerContext as RootServiceHandlerContext,
} from '../../mod.ts';
import {
  assemblePluginContractRouter,
  createPluginService,
  type PluginServiceConfig,
  type Principal as ServicePrincipal,
  type ServiceHandlerContext as ServiceSurfaceHandlerContext,
} from '../../src/service/mod.ts';
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
const handlers: any = os.router({
  // deno-lint-ignore no-explicit-any
  describe: (implemented as any).describe.handler(() => capabilities),
});
const router = assemblePluginContractRouter(
  { router: () => handlers },
  { version: 'v1', namespace: 'sample', handlers },
);

Deno.test('createPluginService preserves typed custom context and identity re-exports', () => {
  type CustomContext = { readonly tenant: 'alpha' };

  const config = {
    name: 'sample',
    context: () => ({ tenant: 'alpha' as const }),
  } satisfies PluginServiceConfig<CustomContext>;

  const builder: ServiceBuilder<ServiceRouter, CustomContext> = createPluginService(router, config);
  const context: RootServiceHandlerContext<CustomContext> = {
    tenant: 'alpha',
    principal: undefined,
  };
  const serviceContext: ServiceSurfaceHandlerContext<CustomContext> = context;
  const rootPrincipal: RootPrincipal | undefined = context.principal;
  const servicePrincipal: ServicePrincipal | undefined = rootPrincipal;

  assertEquals(typeof builder.build, 'function');
  assertEquals(serviceContext.tenant, 'alpha');
  assertEquals(servicePrincipal, undefined);
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

  const describe = await app.request('/api/v1/sample/describe');
  assertEquals(describe.status, 200);
  const describeBody = await describe.json();
  assertEquals(describeBody.pluginName, '@netscript/plugin-sample');
  assertEquals(describeBody.contractVersions, ['v1']);

  const canonicalDescribe = await app.request('/api/rpc/v1/sample/describe');
  assertEquals(canonicalDescribe.status, 200);

  const legacyDescribe = await app.request('/api/rpc/v1/describe');
  assertEquals(legacyDescribe.status, 200);
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
