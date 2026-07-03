import { assertEquals } from 'jsr:@std/assert@^1';
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

Deno.test('mergePartialConfig: a deploy fragment replaces the whole targets map', () => {
  // The deploy section is spread one level deep, so a contribution replaces the
  // entire `targets` map wholesale (coarser than the old per-`windows`-key
  // granularity). Guard that behavior explicitly.
  const base = defineConfig({
    name: 'shop',
    databases: { config: [] },
    deploy: {
      targets: {
        windows: { mode: 'compile', servicePrefix: 'Base' },
      },
    },
  });

  const merged = mergePartialConfig(base, {
    deploy: {
      targets: {
        windows: { mode: 'script' },
      },
    },
  });

  assertEquals(merged.deploy?.targets?.windows?.mode, 'script');
  // Base-only fields under the replaced target are gone (whole-map replacement).
  assertEquals(merged.deploy?.targets?.windows?.servicePrefix, undefined);
  // Base is not mutated.
  assertEquals(base.deploy?.targets?.windows?.servicePrefix, 'Base');
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
