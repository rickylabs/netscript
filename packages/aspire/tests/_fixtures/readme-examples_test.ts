import { assertEquals, assertExists, assertStringIncludes } from '@std/assert';
import { inspectAspire } from '../../mod.ts';
import { AspireTypeScriptBuilder } from '../../src/adapters/mod.ts';
import {
  type AspireBuilder,
  type AspireResource,
  composeAppHost,
  type ComposePluginManifest,
  type ContributionContext,
} from '../../src/application/mod.ts';
import {
  AspireNSPluginContribution,
  composeAppHost as composeAppHostPublic,
  generateAppSettingsJsonSchema as generateAppSettingsJsonSchemaPublic,
} from '../../src/public/mod.ts';

class WorkersContribution extends AspireNSPluginContribution {
  readonly pluginName = '@netscript/plugin-workers';

  contribute(_builder: AspireBuilder, _ctx: ContributionContext): readonly AspireResource[] {
    return [{ name: 'workers-service', kind: 'deno-service', port: 8080 }];
  }
}

function createProductionContext(): ContributionContext {
  return {
    projectRoot: '/workspace/app',
    port: (_key, fallback = 8080) => fallback,
    env: (
      source,
    ) => (typeof source === 'string'
      ? source
      : source.kind === 'literal'
      ? source.value
      : 'configured'),
    resource: () => undefined,
    manifest: { name: 'apphost' },
  };
}

Deno.test('README composition example creates an inspectable resource graph', () => {
  const builder = new AspireTypeScriptBuilder();
  const context = createProductionContext();
  const plugins: readonly ComposePluginManifest[] = [
    {
      name: '@netscript/plugin-workers',
      contributions: { aspire: WorkersContribution },
    },
  ];

  const result = composeAppHost({
    builder,
    context,
    plugins,
  });
  const report = inspectAspire(builder);

  assertEquals(result.resources.length, 1);
  assertEquals(result.resources[0]?.name, 'workers-service');
  assertStringIncludes(report.summary, 'Aspire composition');
});

Deno.test('public aggregate exports composeAppHost and schema generator', () => {
  const builder = new AspireTypeScriptBuilder();
  const context = createProductionContext();
  const result = composeAppHostPublic({
    builder,
    context,
    plugins: [{
      name: '@netscript/plugin-workers',
      contributions: { aspire: WorkersContribution },
    }],
  });
  assertEquals(result.resources.length, 1);

  const schema = generateAppSettingsJsonSchemaPublic();
  assertExists(schema);
});
