import { assertEquals } from 'jsr:@std/assert';
import { defineConfig } from '../../mod.ts';
import { mergePartialConfig } from '../../src/merge/mod.ts';

Deno.test('mergePartialConfig: merges object sections without mutating base', () => {
  const base = defineConfig({
    name: 'shop',
    databases: {
      active: 'postgres',
      config: [{ provider: 'postgres', schema: 'database/postgres/schema' }],
    },
    services: {
      api: { port: 3000 },
    },
  });

  const merged = mergePartialConfig(base, {
    services: {
      'workers-api': { port: 8091, workdir: 'plugins/workers' },
    },
    apps: {
      admin: { port: 5173 },
    },
  });

  assertEquals(Object.keys(base.services ?? {}), ['api']);
  assertEquals(Object.keys(merged.services ?? {}), ['api', 'workers-api']);
  assertEquals(merged.apps?.admin.port, 5173);
});

Deno.test('mergePartialConfig: replaces duplicate database entries by name', () => {
  const base = defineConfig({
    name: 'shop',
    databases: {
      active: 'postgres',
      config: [{ name: 'main', provider: 'postgres', schema: 'database/postgres/schema' }],
    },
  });

  const merged = mergePartialConfig(base, {
    databases: {
      config: [{ name: 'main', provider: 'mysql', schema: 'database/mysql/schema' }],
    },
  });

  assertEquals(merged.databases.config.length, 1);
  assertEquals(merged.databases.config[0]?.provider, 'mysql');
});
