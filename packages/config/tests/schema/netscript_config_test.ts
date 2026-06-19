import { assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { defineConfig } from '../../mod.ts';

Deno.test('defineConfig: applies defaults to validated saga and trigger sections', () => {
  const config = defineConfig({
    name: 'orders',
    databases: { config: [] },
    sagas: {
      groups: [{ topic: 'orders' }],
    },
    triggers: {
      groups: [{ topic: 'events' }],
    },
  });

  assertEquals(config.sagas?.sagasDir, 'sagas');
  assertEquals(config.sagas?.transportProvider, 'auto');
  assertEquals(config.sagas?.groups[0]?.sagas, []);
  assertEquals(config.triggers?.triggersDir, 'triggers');
  assertEquals(config.triggers?.groups[0]?.scaling.concurrency, 10);
  assertEquals(config.triggers?.enabled, true);
});

Deno.test('defineConfig: accepts legacy project and TS entrypoint AppHost paths', () => {
  const legacy = defineConfig({
    name: 'legacy',
    databases: { config: [] },
    aspire: { appHost: 'dotnet/AppHost' },
  });
  const modern = defineConfig({
    name: 'modern',
    databases: { config: [] },
    aspire: { appHost: 'aspire/apphost.mts' },
  });

  assertEquals(legacy.aspire?.appHost, 'dotnet/AppHost');
  assertEquals(modern.aspire?.appHost, 'aspire/apphost.mts');
});

Deno.test('defineConfig: rejects unrelated saga and trigger section shapes', () => {
  assertThrows(() =>
    defineConfig(
      {
        name: 'orders',
        databases: { config: [] },
        sagas: ['not-a-saga-section'],
      } as unknown as Parameters<typeof defineConfig>[0],
    )
  );

  assertThrows(() =>
    defineConfig(
      {
        name: 'orders',
        databases: { config: [] },
        triggers: ['not-a-trigger-section'],
      } as unknown as Parameters<typeof defineConfig>[0],
    )
  );
});
