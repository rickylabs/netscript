import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { createContributionContextFixture, MemoryAspireBuilder } from '@netscript/aspire/public';
import { WorkersAspireContribution } from '../../src/aspire/mod.ts';

Deno.test('WorkersAspireContribution publishes one dependency-aware workers runtime', () => {
  const builder = new MemoryAspireBuilder();
  const ctx = createContributionContextFixture({
    projectRoot: '/workspace/netscript-app',
    port: (resource, fallback) => resource === 'workers-api' ? 9191 : (fallback ?? 0),
  });
  const contribution = new WorkersAspireContribution();

  const resources = contribution.contribute(builder, ctx);

  assertEquals(contribution.pluginName, '@netscript/plugin-workers');
  assertEquals(resources.length, 2);
  assertEquals(builder.resources.length, 2);
  assertEquals(builder.resources.map((resource) => resource.name), [
    'workers-api',
    'workers-combined',
  ]);
  assertEquals(builder.resources.map((resource) => resource.kind), [
    'deno-service',
    'deno-background',
  ]);

  const [api, combined] = builder.resources;
  assertEquals(api.port, 9191);
  assert(api.metadata);
  assertEquals(api.metadata.spec, {
    workdir: '/workspace/netscript-app',
    entrypoint: 'plugins/workers/services/src/main.ts',
    port: 9191,
    permissions: [
      '--unstable-kv',
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-run',
    ],
    env: {
      WORKERS_PLUGIN_VERSION: '0.0.1-alpha.0',
    },
  });

  assertEquals(combined.metadata?.spec, {
    workdir: '/workspace/netscript-app',
    entrypoint: 'plugins/workers/bin/combined.ts',
    permissions: [
      '--unstable-kv',
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-run',
      '--allow-sys',
      '--allow-ffi',
    ],
    concurrencyEnvVar: 'WORKER_CONCURRENCY',
    watchMode: true,
  });
  assertEquals(builder.references, [{
    from: 'workers-combined',
    to: 'workers-api',
    waitFor: true,
  }]);

  assertEquals(contribution.declareEnv(ctx), {
    WORKERS_API_URL: { kind: 'resource', resource: 'workers-api', key: 'url' },
    WORKER_CONCURRENCY: '2',
  });
  assertEquals(contribution.declareHealthChecks(ctx), [{
    resource: 'workers-api',
    url: 'http://localhost:9191/health',
    expect: 200,
    timeoutMs: 3000,
  }]);
});
