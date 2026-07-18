import { assertEquals, assertExists, assertRejects } from '@std/assert';
import {
  AppEntrySchema,
  AppSettingsSchema,
  AppTypeSchema,
  CacheEntrySchema,
  CacheModeSchema,
  NetScriptConfigSchema,
  parseAppSettings,
  PluginEntrySchema,
  ServiceEntrySchema,
} from '../config.ts';

const REAL_CONFIG_PATH = new URL(
  './_fixtures/appsettings.json',
  import.meta.url,
).pathname.replace(/^\/([A-Z]:)/, '$1'); // Fix Windows path

Deno.test('config', async (t) => {
  await t.step('parseAppSettings: parses real appsettings.json', async () => {
    const { config, warnings } = await parseAppSettings(REAL_CONFIG_PATH);

    assertEquals(config.Name, 'test-app');
    assertEquals(config.Version, '1.0.0');
    assertEquals(config.PrimaryDatabase, 'postgres');
    assertEquals(config.PrimaryCache, 'garnet');

    const users = config.Services['users'];
    const products = config.Services['products'];
    const orders = config.Services['orders'];
    assertExists(users);
    assertExists(products);
    assertExists(orders);
    assertEquals(users.Port, 3000);
    assertEquals(products.Port, 3001);
    assertEquals(orders.Port, 3002);
    assertEquals(warnings.length, 0);
  });

  await t.step('parseAppSettings: resolves default workdirs', async () => {
    const { config } = await parseAppSettings(REAL_CONFIG_PATH);

    const users = config.Services['users'];
    const products = config.Services['products'];
    assertExists(users);
    assertExists(products);
    assertEquals(users.Workdir, 'services/users');
    assertEquals(products.Workdir, 'services/products');
  });

  await t.step('parseAppSettings: parses apps correctly', async () => {
    const { config } = await parseAppSettings(REAL_CONFIG_PATH);

    const playground = config.Apps['playground'];
    assertExists(playground);
    assertEquals(playground.Type, 'app');
    assertEquals(playground.RequiresKv, true);
    assertExists(playground.ServiceReferences);
    assertExists(playground.PluginReferences);
  });

  await t.step('AppTypeSchema: accepts desktop as the fourth app type', () => {
    for (const type of ['app', 'tauri', 'task', 'desktop']) {
      assertEquals(AppTypeSchema.safeParse(type).success, true);
    }
    assertEquals(AppTypeSchema.safeParse('native').success, false);
  });

  await t.step('AppEntrySchema: preserves optional desktop enablement', () => {
    assertEquals(AppEntrySchema.parse({ Type: 'desktop' }).Enabled, undefined);
    assertEquals(AppEntrySchema.parse({ Type: 'desktop', Enabled: true }).Enabled, true);
  });

  await t.step('AppEntrySchema: preserves the desktop packaging task hook', () => {
    const desktop = AppEntrySchema.parse({
      Type: 'desktop',
      PackageTaskName: 'desktop:package:native',
    });

    assertEquals(desktop.PackageTaskName, 'desktop:package:native');
  });

  await t.step('parseAppSettings: parses plugins correctly', async () => {
    const { config } = await parseAppSettings(REAL_CONFIG_PATH);

    const workersApi = config.Plugins['workers-api'];
    assertExists(workersApi);
    assertEquals(workersApi.Port, 8091);
    assertEquals(workersApi.RequiresKv, true);
    assertEquals(workersApi.RequiresDb, true);
  });

  await t.step('PluginEntrySchema: preserves configured environment', () => {
    const plugin = PluginEntrySchema.parse({
      Port: 8094,
      Environment: { NETSCRIPT_AUTH_BACKEND: 'kv-oauth' },
    });
    assertEquals(plugin.Environment, { NETSCRIPT_AUTH_BACKEND: 'kv-oauth' });
  });

  await t.step('AppSettingsSchema: preserves saga store metadata', () => {
    const result = AppSettingsSchema.parse({
      NetScript: {
        Name: 'saga-app',
        Version: '1.0.0',
        Plugins: {
          'sagas-api': {
            Port: 8092,
            Sagas: { Store: { Backend: 'prisma' } },
          },
        },
        BackgroundProcessors: {
          sagas: {
            Sagas: { Store: { Backend: 'kv' } },
          },
        },
      },
    });

    assertEquals(result.NetScript.Plugins['sagas-api']?.Sagas?.Store?.Backend, 'prisma');
    assertEquals(result.NetScript.BackgroundProcessors.sagas?.Sagas?.Store?.Backend, 'kv');
  });

  await t.step('parseAppSettings: parses background processors', async () => {
    const { config } = await parseAppSettings(REAL_CONFIG_PATH);

    const workers = config.BackgroundProcessors['workers'];
    assertExists(workers);
    assertEquals(workers.Concurrency, 2);
    assertEquals(workers.ConcurrencyEnvVar, 'WORKER_CONCURRENCY');
  });

  await t.step('parseAppSettings: parses databases', async () => {
    const { config } = await parseAppSettings(REAL_CONFIG_PATH);

    const postgres = config.Databases['postgres'];
    assertExists(postgres);
    assertEquals(postgres.Engine, 'Postgres');
    assertEquals(postgres.ImageTag, '18');
    assertEquals(postgres.Persistent, true);
  });

  await t.step('parseAppSettings: parses cache', async () => {
    const { config } = await parseAppSettings(REAL_CONFIG_PATH);

    const garnet = config.Cache['garnet'];
    assertExists(garnet);
    assertEquals(garnet.Engine, 'Garnet');
    assertEquals(garnet.Port, 6379);
  });

  await t.step('AppSettingsSchema: accepts Deno KV cache entries', () => {
    const result = AppSettingsSchema.parse({
      NetScript: {
        Name: 'deno-kv-app',
        Version: '1.0.0',
        PrimaryCache: 'deno-kv',
        Cache: {
          'deno-kv': {
            Engine: 'DenoKv',
            Mode: 'Local',
            DataPath: 'data/kv',
          },
        },
      },
    });

    assertEquals(result.NetScript.PrimaryCache, 'deno-kv');
    assertEquals(result.NetScript.Cache['deno-kv']?.Engine, 'DenoKv');
    assertEquals(result.NetScript.Cache['deno-kv']?.Mode, 'Local');
  });

  await t.step('CacheModeSchema: accepts all five modes', () => {
    for (const mode of ['Local', 'Container', 'Executable', 'External', 'Auto']) {
      assertEquals(CacheModeSchema.safeParse(mode).success, true);
    }
  });

  await t.step('CacheModeSchema: rejects unknown mode', () => {
    assertEquals(CacheModeSchema.safeParse('Managed').success, false);
  });

  await t.step('CacheEntrySchema: accepts Executable mode with ToolVersion', () => {
    const result = CacheEntrySchema.parse({
      Engine: 'Garnet',
      Mode: 'Executable',
      ToolVersion: '1.1.10',
    });
    assertEquals(result.Engine, 'Garnet');
    assertEquals(result.Mode, 'Executable');
    assertEquals(result.ToolVersion, '1.1.10');
  });

  await t.step('CacheEntrySchema: defaults Engine=Garnet, Mode=Container', () => {
    const result = CacheEntrySchema.parse({});
    assertEquals(result.Engine, 'Garnet');
    assertEquals(result.Mode, 'Container');
  });

  await t.step('parseAppSettings: warns on invalid engine×mode combos', async () => {
    // Redis has no Executable mode; DenoKv has no External mode.
    const warnings = await cacheMatrixWarnings({
      'bad-redis': { Engine: 'Redis', Mode: 'Executable' },
      'bad-kv': { Engine: 'DenoKv', Mode: 'External' },
    });
    assertEquals(
      warnings.some((w) => w.includes('bad-redis') && w.includes('Executable')),
      true,
    );
    assertEquals(
      warnings.some((w) => w.includes('bad-kv') && w.includes('External')),
      true,
    );
  });

  await t.step('parseAppSettings: no matrix warning for valid combos', async () => {
    const warnings = await cacheMatrixWarnings({
      'redis': { Engine: 'Redis', Mode: 'Container' },
      'garnet': { Engine: 'Garnet', Mode: 'Executable' },
      'kv': { Engine: 'DenoKv', Mode: 'Local' },
      'auto': { Engine: 'Garnet', Mode: 'Auto' },
    });
    assertEquals(warnings.filter((w) => w.includes('is not valid for Engine')).length, 0);
  });

  await t.step('parseAppSettings: parses tools', async () => {
    const { config } = await parseAppSettings(REAL_CONFIG_PATH);

    const prismaStudio = config.Tools['prisma-studio'];
    assertExists(prismaStudio);
    assertEquals(prismaStudio.Enabled, true);
    assertEquals(prismaStudio.TaskName, 'db:studio');
  });

  await t.step('parseAppSettings: disabled entries preserved', async () => {
    const { config } = await parseAppSettings(REAL_CONFIG_PATH);

    // frontend is disabled in the real config
    const frontend = config.Apps['frontend'];
    assertExists(frontend);
    assertEquals(frontend.Enabled, false);
  });

  await t.step('parseAppSettings: OTEL defaults filled', async () => {
    const { config } = await parseAppSettings(REAL_CONFIG_PATH);

    assertEquals(config.Otel.HttpEndpoint, 'http://localhost:4318');
    assertEquals(config.Otel.Protocol, 'http/protobuf');
  });

  await t.step('parseAppSettings: Deno defaults filled', async () => {
    const { config } = await parseAppSettings(REAL_CONFIG_PATH);

    assertEquals(config.Defaults.Deno.WatchMode, true);
    assertEquals(config.Defaults.Deno.Permissions.length, 4);
  });

  await t.step('AppSettingsSchema: rejects missing Name', () => {
    const result = AppSettingsSchema.safeParse({
      NetScript: {},
    });
    assertEquals(result.success, false);
  });

  await t.step('ServiceEntrySchema: rejects missing Port', () => {
    const result = ServiceEntrySchema.safeParse({
      Runtime: 'deno',
      Entrypoint: 'src/main.ts',
    });
    assertEquals(result.success, false);
  });

  await t.step('ServiceEntrySchema: fills defaults', () => {
    const result = ServiceEntrySchema.parse({ Port: 3000 });
    assertEquals(result.Runtime, 'deno');
    assertEquals(result.Entrypoint, 'src/main.ts');
    assertEquals(result.Enabled, true);
  });

  await t.step('NetScriptConfigSchema: fills section defaults', () => {
    const result = NetScriptConfigSchema.parse({ Name: 'test' });
    assertEquals(Object.keys(result.Services).length, 0);
    assertEquals(Object.keys(result.Apps).length, 0);
    assertEquals(Object.keys(result.Plugins).length, 0);
    assertEquals(result.Version, '1.0.0');
  });

  await t.step('parseAppSettings: strict mode throws on bad cross-refs', async () => {
    const badConfig = {
      NetScript: {
        Name: 'test',
        PrimaryDatabase: 'nonexistent',
      },
    };
    const tmpPath = await Deno.makeTempFile({ suffix: '.json' });
    await Deno.writeTextFile(tmpPath, JSON.stringify(badConfig));
    try {
      await assertRejects(
        () => parseAppSettings(tmpPath, { strict: true }),
        Error,
        'Cross-reference validation failed',
      );
    } finally {
      await Deno.remove(tmpPath);
    }
  });

  await t.step('parseAppSettings: non-strict mode returns warnings', async () => {
    const badConfig = {
      NetScript: {
        Name: 'test',
        PrimaryDatabase: 'nonexistent',
      },
    };
    const tmpPath = await Deno.makeTempFile({ suffix: '.json' });
    await Deno.writeTextFile(tmpPath, JSON.stringify(badConfig));
    try {
      const { warnings } = await parseAppSettings(tmpPath);
      assertEquals(warnings.length > 0, true);
      const firstWarning = warnings[0];
      assertExists(firstWarning);
      assertEquals(firstWarning.includes('nonexistent'), true);
    } finally {
      await Deno.remove(tmpPath);
    }
  });

  await t.step('parseAppSettings: service references validated', async () => {
    const configData = {
      NetScript: {
        Name: 'test',
        Services: {
          api: { Port: 3000, ServiceReferences: ['nonexistent'] },
        },
      },
    };
    const tmpPath = await Deno.makeTempFile({ suffix: '.json' });
    await Deno.writeTextFile(tmpPath, JSON.stringify(configData));
    try {
      const { warnings } = await parseAppSettings(tmpPath);
      assertEquals(warnings.length > 0, true);
      const firstWarning = warnings[0];
      assertExists(firstWarning);
      assertEquals(firstWarning.includes('nonexistent'), true);
    } finally {
      await Deno.remove(tmpPath);
    }
  });
});

/** Parses a temp appsettings with the given Cache section and returns warnings. */
async function cacheMatrixWarnings(
  cache: Record<string, { Engine: string; Mode: string }>,
): Promise<readonly string[]> {
  const tmpPath = await Deno.makeTempFile({ suffix: '.json' });
  await Deno.writeTextFile(
    tmpPath,
    JSON.stringify({ NetScript: { Name: 'matrix-test', Cache: cache } }),
  );
  try {
    const { warnings } = await parseAppSettings(tmpPath);
    return warnings;
  } finally {
    await Deno.remove(tmpPath);
  }
}
