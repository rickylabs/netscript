import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { createContributionContextFixture, MemoryAspireBuilder } from '@netscript/aspire/public';
import {
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  type TriggersAspireBuilder,
  TriggersAspireContribution,
  type TriggersContributionContext,
} from '../../src/aspire/mod.ts';

Deno.test('TriggersAspireContribution registers API and processor resources', () => {
  const builder = new MemoryAspireBuilder();
  const ctx = createContributionContextFixture({
    projectRoot: '/workspace/netscript-app',
  }) as unknown as TriggersContributionContext;
  const contribution = new TriggersAspireContribution();

  const resources = contribution.contribute(builder as unknown as TriggersAspireBuilder, ctx);

  assertEquals(contribution.pluginName, '@netscript/plugin-triggers');
  assertEquals(resources.length, 2);
  assertEquals(builder.resources.length, 2);
  assertEquals(builder.resources.map((resource) => resource.name), [
    TRIGGERS_API_SERVICE_NAME,
    'trigger-processor',
  ]);
  assertEquals(builder.resources.map((resource) => resource.kind), [
    'deno-service',
    'deno-background',
  ]);
  assertEquals(builder.references, [{
    from: 'trigger-processor',
    to: TRIGGERS_API_SERVICE_NAME,
    waitFor: true,
  }]);

  const [api, processor] = builder.resources;
  assertEquals(api.port, TRIGGERS_API_DEFAULT_PORT);
  assert(api.metadata);
  assertEquals(api.metadata.spec, {
    workdir: '/workspace/netscript-app',
    entrypoint: 'plugins/triggers/services/src/main.ts',
    port: TRIGGERS_API_DEFAULT_PORT,
    permissions: [
      '--unstable-kv',
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
    ],
    env: {
      TRIGGERS_PLUGIN_VERSION: '0.1.0',
    },
  });

  assertEquals(processor.metadata?.spec, {
    workdir: '/workspace/netscript-app',
    entrypoint: 'plugins/triggers/src/runtime/trigger-processor.ts',
    permissions: [
      '--unstable-kv',
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
    ],
    concurrencyEnvVar: 'TRIGGERS_PROCESSOR_CONCURRENCY',
    watchMode: true,
  });

  assertEquals(contribution.declareEnv(ctx), {
    TRIGGERS_API_URL: 'http://localhost:8093',
    TRIGGERS_ADAPTER: 'native',
    TRIGGERS_DURABILITY_TIER: 't1',
    TRIGGERS_PROCESSOR_CONCURRENCY: '2',
  });
  assertEquals(contribution.declareHealthChecks(ctx), [{
    resource: TRIGGERS_API_SERVICE_NAME,
    url: 'http://localhost:8093/health',
    expect: 200,
    timeoutMs: 3000,
  }]);
});
