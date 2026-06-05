import { assertEquals, assertExists, assertRejects } from '@std/assert';
import {
  AppSettingsSchema,
  NetScriptConfigSchema,
  parseAppSettings,
  ServiceEntrySchema,
} from '../config.ts';

const REAL_CONFIG_PATH = new URL(
  '../../../dotnet/AppHost/appsettings.json',
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

  await t.step('parseAppSettings: parses plugins correctly', async () => {
    const { config } = await parseAppSettings(REAL_CONFIG_PATH);

    const workersApi = config.Plugins['workers-api'];
    assertExists(workersApi);
    assertEquals(workersApi.Port, 8091);
    assertEquals(workersApi.RequiresKv, true);
    assertEquals(workersApi.RequiresDb, true);
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
