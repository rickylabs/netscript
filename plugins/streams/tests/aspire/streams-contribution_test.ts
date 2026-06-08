import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { createContributionContextFixture, MemoryAspireBuilder } from '@netscript/aspire';
import { StreamsAspireContribution } from '../../src/aspire/mod.ts';

Deno.test('StreamsAspireContribution registers the streams service and health check', () => {
  const builder = new MemoryAspireBuilder();
  const ctx = createContributionContextFixture({ projectRoot: '/workspace/netscript-app' });
  const contribution = new StreamsAspireContribution();

  const resources = contribution.contribute(builder, ctx);

  assertEquals(contribution.pluginName, '@netscript/plugin-streams');
  assertEquals(resources.length, 1);
  assertEquals(builder.resources.length, 1);

  const [service] = builder.resources;
  assertEquals(service.name, 'streams');
  assertEquals(service.kind, 'deno-service');
  assertEquals(service.port, 4437);
  assert(service.metadata);
  assertEquals(service.metadata.spec, {
    workdir: '/workspace/netscript-app',
    entrypoint: 'plugins/streams/services/src/main.ts',
    port: 4437,
    permissions: [
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-sys',
      '--allow-ffi',
    ],
    env: {
      STREAMS_PLUGIN_VERSION: '0.0.1-alpha.0',
    },
  });

  assertEquals(contribution.declareEnv(ctx), {
    DURABLE_STREAMS_URL: 'http://localhost:4437',
  });
  assertEquals(contribution.declareHealthChecks(ctx), [{
    resource: 'streams',
    url: 'http://localhost:4437/health',
    expect: 200,
    timeoutMs: 3000,
  }]);
});
