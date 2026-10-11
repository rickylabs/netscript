/**
 * @module templates/aspire/generate-standalone-appsettings_test
 *
 * #1996: the `--no-aspire` appsettings.json must satisfy the same schema the
 * service, database and config commands read, without AppHost wiring.
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import { parseAppSettings } from '@netscript/aspire/config';
import { generateStandaloneAppsettings } from './generate-standalone-appsettings.ts';

async function parseStrict(content: string) {
  const path = await Deno.makeTempFile({ suffix: '.json' });
  try {
    await Deno.writeTextFile(path, content);
    return await parseAppSettings(path, { strict: true });
  } finally {
    await Deno.remove(path);
  }
}

Deno.test('standalone appsettings parses strictly for every engine and cache backend', async () => {
  for (const dbEngine of ['postgres', 'mysql', 'mssql', 'sqlite', 'none'] as const) {
    for (const cacheBackend of ['redis', 'garnet', 'deno-kv'] as const) {
      const { warnings } = await parseStrict(generateStandaloneAppsettings({
        name: 'probe app',
        dbEngine,
        cache: true,
        cacheBackend,
        service: { name: 'probe-svc', port: 3001 },
      }));
      assertEquals(warnings, [], `${dbEngine} + ${cacheBackend}`);
    }
  }
});

Deno.test('standalone appsettings registers developer-provisioned infrastructure only', () => {
  const document = JSON.parse(generateStandaloneAppsettings({
    name: 'probeapp',
    dbEngine: 'postgres',
    cache: true,
    cacheBackend: 'redis',
    service: { name: 'probe-svc', port: 61432 },
  }));

  assertEquals(document, {
    NetScript: {
      Name: 'probeapp',
      Version: '1.0.0',
      PrimaryDatabase: 'postgres',
      PrimaryCache: 'redis',
      Databases: {
        postgres: { Engine: 'Postgres', Mode: 'External', DatabaseName: 'probeapp-db' },
      },
      Cache: { redis: { Engine: 'Redis', Mode: 'External' } },
      Services: {
        'probe-svc': { Runtime: 'deno', Port: 61432, Entrypoint: 'src/main.ts' },
      },
      Plugins: {},
      BackgroundProcessors: {},
    },
  });
});

Deno.test('standalone appsettings keeps SQLite file-backed and Deno KV in-process', () => {
  const document = JSON.parse(generateStandaloneAppsettings({
    name: 'probeapp',
    dbEngine: 'sqlite',
    cache: true,
    cacheBackend: 'deno-kv',
  }));

  assertEquals(document.NetScript.Databases, {
    sqlite: { Engine: 'Sqlite', DatabaseName: 'probeapp.db' },
  });
  assertEquals(document.NetScript.Cache, {
    'deno-kv': { Engine: 'DenoKv', Mode: 'Local', DataPath: 'data/kv' },
  });
  assertEquals(document.NetScript.Services, {});
});
