import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { createContributionContextFixture, MemoryAspireBuilder } from '@netscript/aspire';
import { WorkersAspireContribution } from '../../src/aspire/mod.ts';

Deno.test('WorkersAspireContribution registers API and background resources', () => {
  const builder = new MemoryAspireBuilder();
  const ctx = createContributionContextFixture({ projectRoot: '/workspace/netscript-app' });
  const contribution = new WorkersAspireContribution();

  const resources = contribution.contribute(builder, ctx);

  assertEquals(contribution.pluginName, '@netscript/plugin-workers');
  assertEquals(resources.length, 4);
  assertEquals(builder.resources.length, 4);
  assertEquals(builder.resources.map((resource) => resource.name), [
    'workers-api',
    'workers-combined',
    'workers-scheduler',
    'workers-worker',
  ]);
  assertEquals(builder.resources.map((resource) => resource.kind), [
    'deno-service',
    'deno-background',
    'deno-background',
    'deno-background',
  ]);

  const [api, combined, scheduler, worker] = builder.resources;
  assertEquals(api.port, 8091);
  assert(api.metadata);
  assertEquals(api.metadata.spec, {
    workdir: '/workspace/netscript-app',
    entrypoint: 'plugins/workers/services/src/main.ts',
    port: 8091,
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
  assertEquals(entrypointOf(scheduler.metadata?.spec), 'plugins/workers/bin/scheduler.ts');
  assertEquals(entrypointOf(worker.metadata?.spec), 'plugins/workers/bin/worker.ts');

  assertEquals(contribution.declareEnv(ctx), {
    WORKERS_API_URL: 'http://localhost:8091',
    WORKER_CONCURRENCY: '2',
  });
  assertEquals(contribution.declareHealthChecks(ctx), [{
    resource: 'workers-api',
    url: 'http://localhost:8091/health',
    expect: 200,
    timeoutMs: 3000,
  }]);
});

function entrypointOf(spec: unknown): string | undefined {
  return typeof spec === 'object' && spec !== null
    ? (spec as { readonly entrypoint?: string }).entrypoint
    : undefined;
}
