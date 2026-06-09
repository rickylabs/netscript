import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { createContributionContextFixture, MemoryAspireBuilder } from '@netscript/aspire';
import { SagasAspireContribution } from '../../src/aspire/mod.ts';
import type { SagasAspireBuilder } from '../../src/aspire/mod.ts';

Deno.test('SagasAspireContribution registers API and background resources', () => {
  const builder = new MemoryAspireBuilder();
  const ctx = createContributionContextFixture({ projectRoot: '/workspace/netscript-app' });
  const contribution = new SagasAspireContribution();

  const resources = contribution.contribute(builder as unknown as SagasAspireBuilder, ctx);

  assertEquals(contribution.pluginName, '@netscript/plugin-sagas');
  assertEquals(resources.length, 2);
  assertEquals(builder.resources.length, 2);
  assertEquals(builder.resources.map((resource) => resource.name), [
    'sagas-api',
    'sagas-runner',
  ]);
  assertEquals(builder.resources.map((resource) => resource.kind), [
    'deno-service',
    'deno-background',
  ]);

  const [api, runner] = builder.resources;
  assertEquals(api.port, 8092);
  assert(api.metadata);
  assertEquals(api.metadata.spec, {
    workdir: '/workspace/netscript-app',
    entrypoint: 'plugins/sagas/services/src/main.ts',
    port: 8092,
    permissions: [
      '--unstable-kv',
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
    ],
    env: {
      SAGAS_PLUGIN_VERSION: '1.0.0',
    },
  });

  assertEquals(runner.metadata?.spec, {
    workdir: '/workspace/netscript-app',
    entrypoint: 'plugins/sagas/src/runtime/saga-runner.ts',
    permissions: [
      '--unstable-kv',
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
    ],
    concurrencyEnvVar: 'SAGAS_RUNNER_CONCURRENCY',
    watchMode: true,
  });

  assertEquals(contribution.declareEnv(ctx), {
    SAGAS_API_URL: 'http://localhost:8092',
    SAGAS_ADAPTER: 'native',
    SAGAS_DURABILITY_TIER: 't1',
    SAGAS_RUNNER_CONCURRENCY: '2',
  });
  assertEquals(contribution.declareHealthChecks(ctx), [{
    resource: 'sagas-api',
    url: 'http://localhost:8092/health',
    expect: 200,
    timeoutMs: 3000,
  }]);
});
