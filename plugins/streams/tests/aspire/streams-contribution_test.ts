import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { createContributionContextFixture, MemoryAspireBuilder } from '@netscript/aspire/public';
import { StreamsAspireContribution } from '../../src/aspire/mod.ts';

Deno.test('StreamsAspireContribution registers the streams service and health check', () => {
  const builder = new MemoryAspireBuilder();
  const ctx = createContributionContextFixture({
    projectRoot: '/workspace/netscript-app',
    port: () => 9437,
  });
  const contribution = new StreamsAspireContribution();

  const resources = contribution.contribute(builder, ctx);

  assertEquals(contribution.pluginName, '@netscript/plugin-streams');
  assertEquals(resources.length, 1);
  assertEquals(builder.resources.length, 1);

  const [service] = builder.resources;
  assertEquals(service.name, 'streams');
  assertEquals(service.kind, 'deno-service');
  assertEquals(service.port, 9437);
  assert(service.metadata);
  assertEquals(service.metadata.spec, {
    workdir: '/workspace/netscript-app',
    entrypoint: 'plugins/streams/services/src/main.ts',
    port: 9437,
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
    DURABLE_STREAMS_URL: { kind: 'resource', resource: 'streams', key: 'url' },
  });
  assertEquals('declareHealthChecks' in contribution, false);
});

Deno.test('StreamsAspireContribution opts into AppHost-owned file storage explicitly', () => {
  const builder = new MemoryAspireBuilder();
  const ctx = createContributionContextFixture({ projectRoot: '/workspace/app' });
  const contribution = new StreamsAspireContribution({ dataDir: '.netscript/data/streams' });
  contribution.contribute(builder, ctx);
  const spec = builder.resources[0].metadata?.spec;
  assert(spec && typeof spec === 'object');
  assertEquals(Reflect.get(spec, 'dataDirectories'), {
    STREAMS_DATA_DIR: '.netscript/data/streams',
  });
  assertEquals(Reflect.get(spec, 'env').STREAMS_DATA_DIR, '.netscript/data/streams');
});

Deno.test('StreamsAspireContribution default declares no persistent directory or file env', () => {
  const builder = new MemoryAspireBuilder();
  new StreamsAspireContribution().contribute(builder, createContributionContextFixture());
  const spec = builder.resources[0].metadata?.spec;
  assert(spec && typeof spec === 'object');
  assertEquals(Reflect.get(spec, 'dataDirectories'), undefined);
  assertEquals(Reflect.get(spec, 'env').STREAMS_DATA_DIR, undefined);
});
