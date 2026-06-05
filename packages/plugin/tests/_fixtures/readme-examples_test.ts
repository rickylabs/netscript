import { assertEquals } from '@std/assert';
import { definePlugin, inspectPlugin } from '../../mod.ts';

Deno.test('README definePlugin example creates an inspectable plugin manifest', () => {
  const plugin = definePlugin('@example/plugin', '0.0.1-alpha.0').build();

  assertEquals(inspectPlugin(plugin).target, '@example/plugin');
});

Deno.test('author guide manifest example uses the public typestate builder', () => {
  const plugin = definePlugin('@acme/plugin-analytics', '0.0.1-alpha.0')
    .withDisplayName('Analytics')
    .withDescription('Analytics ingestion for NetScript projects.')
    .withLicense('MIT')
    .withService({
      name: 'analytics-api',
      entrypoint: './services/src/main.ts',
      port: 9001,
    })
    .withRuntimeConfigTopics([{
      name: 'analytics',
      schemaPath: './runtime/schema.json',
    }])
    .build();

  const report = inspectPlugin(plugin);

  assertEquals(report.target, '@acme/plugin-analytics');
  assertEquals(report.details.contributionGroups, 2);
});
