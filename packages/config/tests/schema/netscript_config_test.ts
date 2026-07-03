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

Deno.test('defineConfig: accepts a deploy.targets.windows target', () => {
  const config = defineConfig({
    name: 'orders',
    databases: { config: [] },
    deploy: {
      targets: {
        windows: {
          mode: 'script',
          servicePrefix: 'Acme',
        },
      },
    },
  });

  assertEquals(config.deploy?.targets?.windows?.mode, 'script');
  assertEquals(config.deploy?.targets?.windows?.servicePrefix, 'Acme');
});

Deno.test('defineConfig: accepts a deploy.targets[deno-deploy] target', () => {
  const config = defineConfig({
    name: 'orders',
    databases: { config: [] },
    deploy: {
      targets: {
        'deno-deploy': {
          org: 'acme',
          app: 'orders-api',
          entrypoint: 'main.ts',
          prod: true,
          envFile: '.env.production',
        },
      },
    },
  });

  assertEquals(config.deploy?.targets?.['deno-deploy']?.org, 'acme');
  assertEquals(config.deploy?.targets?.['deno-deploy']?.app, 'orders-api');
  assertEquals(config.deploy?.targets?.['deno-deploy']?.prod, true);
});

Deno.test('defineConfig: accepts windows and deno-deploy targets side by side', () => {
  const config = defineConfig({
    name: 'orders',
    databases: { config: [] },
    deploy: {
      targets: {
        windows: { servicePrefix: 'Acme' },
        'deno-deploy': { app: 'orders-api' },
      },
    },
  });

  assertEquals(config.deploy?.targets?.windows?.servicePrefix, 'Acme');
  assertEquals(config.deploy?.targets?.['deno-deploy']?.app, 'orders-api');
});

Deno.test('defineConfig: does not honor the legacy deploy.windows shape (clean break)', () => {
  const config = defineConfig(
    {
      name: 'orders',
      databases: { config: [] },
      // Legacy pre-#337 shape — the `windows` key is no longer part of the
      // deploy contract, so it is dropped and never resolves to a target.
      deploy: { windows: { mode: 'script' } },
    } as unknown as Parameters<typeof defineConfig>[0],
  );

  assertEquals(config.deploy?.targets, undefined);
});

Deno.test('defineConfig: drops unknown deploy.targets keys', () => {
  const config = defineConfig(
    {
      name: 'orders',
      databases: { config: [] },
      deploy: {
        targets: {
          windows: { mode: 'compile' },
          // `linux` is now a valid member of the target map and is retained.
          linux: { mode: 'compile' },
          // `solaris` is not a member of this slice's target map and is dropped.
          solaris: { mode: 'compile' },
        },
      },
    } as unknown as Parameters<typeof defineConfig>[0],
  );

  assertEquals(config.deploy?.targets?.windows?.mode, 'compile');
  assertEquals(config.deploy?.targets?.linux?.mode, 'compile');
  assertEquals(Object.keys(config.deploy?.targets ?? {}), ['windows', 'linux']);
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
