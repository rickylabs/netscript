import { assertEquals } from 'jsr:@std/assert@^1';
import { defineConfig, inspectConfig, resolveEnv } from '../../mod.ts';
import { mergePartialConfig } from '../../src/merge/mod.ts';
import { PERMISSIONS, SCAFFOLD_DIRS } from '../../src/paths/mod.ts';
import { pluginEntrySchema } from '../../src/schema/plugins/mod.ts';

Deno.test('README examples: define and inspect config', () => {
  const config = defineConfig({
    name: 'orders',
    version: '1.0.0',
    databases: {
      active: 'postgres',
      config: [{ provider: 'postgres', schema: 'database/postgres/schema' }],
    },
    services: {
      api: { port: 3000 },
    },
  });

  const report = inspectConfig(config);
  assertEquals(report.target, 'orders');
});

Deno.test('README examples: resolve env defaults', () => {
  const env = resolveEnv({
    PORT: { type: 'number', default: 3000 },
    DEBUG: { type: 'boolean', default: false },
  });

  assertEquals(env.PORT, 3000);
  assertEquals(env.DEBUG, false);
});

Deno.test('README examples: merge plugin contribution', () => {
  const config = defineConfig({
    name: 'orders',
    databases: { active: 'postgres', config: [] },
  });

  const next = mergePartialConfig(config, {
    services: { 'workers-api': { port: 8091 } },
  });

  assertEquals(next.services?.['workers-api'].port, 8091);
});

Deno.test('README examples: use paths and plugin schema fragments', () => {
  const plugin = pluginEntrySchema.parse({
    Port: 8091,
    InstalledVersion: '0.0.1-alpha.0',
    InstalledFrom: 'jsr:@netscript/plugin-workers',
  });

  assertEquals(SCAFFOLD_DIRS.WORKERS, 'workers');
  assertEquals(PERMISSIONS.workerDefault.includes('--allow-run'), true);
  assertEquals(plugin.Runtime, 'deno');
});
