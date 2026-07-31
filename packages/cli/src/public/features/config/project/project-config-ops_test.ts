import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';

import { parseAppSettings } from '@netscript/aspire/config';
import { join } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { ConfigInvalidError } from '../../../../kernel/domain/errors.ts';
import {
  getDottedValue,
  readAppsettingsValue,
  setProjectConfigValue,
} from './project-config-ops.ts';

/**
 * A scaffolded project's `appsettings.json` as `generateAppsettings()` emits it
 * for `--db postgres`. `Databases` is a record, so `postgres` is a user-chosen
 * key that must survive resolution verbatim.
 */
function scaffoldedAppsettings(): string {
  return JSON.stringify({
    NetScript: {
      Name: 'my-app',
      Version: '1.0.0',
      Otel: { HttpEndpoint: 'http://localhost:4318', Protocol: 'http/protobuf' },
      PrimaryDatabase: 'postgres',
      Databases: {
        postgres: {
          Engine: 'Postgres',
          Mode: 'Container',
          DatabaseName: 'my-app-db',
          Persistent: true,
          DataPath: '.data/postgres',
        },
      },
      Cache: {},
      Services: {},
      Plugins: {},
      BackgroundProcessors: {},
      Apps: {},
      Tools: {},
    },
  });
}

async function withProject(
  run: (context: { readonly root: string; readonly fs: DenoFileSystem }) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  await fs.writeFile(join(root, 'appsettings.json'), scaffoldedAppsettings());
  try {
    await run({ root, fs });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('getDottedValue reads resolved telemetry paths', () => {
  assertEquals(
    getDottedValue({ telemetry: { otlpEndpoint: 'http://localhost:4318' } }, 'telemetry.otlpEndpoint'),
    'http://localhost:4318',
  );
});

Deno.test('setProjectConfigValue maps telemetry endpoint into generated AppSettings', async () => {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  try {
    await fs.writeFile(
      join(root, 'appsettings.json'),
      JSON.stringify({ NetScript: { Name: 'my-app' } }),
    );
    await setProjectConfigValue(fs, root, 'telemetry.otlpEndpoint', 'http://otel:4318');
    assertEquals(JSON.parse(await fs.readFile(join(root, 'appsettings.json'))), {
      NetScript: { Name: 'my-app', Otel: { HttpEndpoint: 'http://otel:4318' } },
    });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

// --- Regression guard for #955 ---------------------------------------------
//
// The defect: `config set` reported success while writing a key the Aspire
// generator never reads. The guard therefore does not assert a string mapping —
// it asserts the semantic property that failed in production: after `set`, the
// generator's own parser reads the new value back at the requested setting.

Deno.test('#955 setProjectConfigValue writes a key parseAppSettings reads back', async () => {
  await withProject(async ({ root, fs }) => {
    const result = await setProjectConfigValue(
      fs,
      root,
      'NetScript.Databases.postgres.Persistent',
      false,
    );

    assertEquals(result.canonicalPath, 'NetScript.Databases.postgres.Persistent');
    const { config } = await parseAppSettings(join(root, 'appsettings.json'));
    assertEquals(config.Databases.postgres?.Persistent, false);
  });
});

Deno.test('#955 setProjectConfigValue does not double the NetScript prefix', async () => {
  await withProject(async ({ root, fs }) => {
    await setProjectConfigValue(fs, root, 'NetScript.Databases.postgres.Persistent', false);
    const document = JSON.parse(await fs.readFile(join(root, 'appsettings.json'))) as Record<
      string,
      Record<string, unknown>
    >;
    assertEquals(document.NetScript?.NetScript, undefined);
  });
});

Deno.test('#955 setProjectConfigValue preserves user-chosen record keys', async () => {
  await withProject(async ({ root, fs }) => {
    // The camelCase spelling documented for `config set` must land on the same
    // key: `postgres` is a record key, not a schema field, so it is never
    // capitalized.
    const result = await setProjectConfigValue(fs, root, 'databases.postgres.persistent', false);

    assertEquals(result.canonicalPath, 'NetScript.Databases.postgres.Persistent');
    const document = JSON.parse(await fs.readFile(join(root, 'appsettings.json'))) as {
      NetScript: { Databases: Record<string, { Persistent?: boolean }> };
    };
    assertEquals(Object.keys(document.NetScript.Databases), ['postgres']);
    assertEquals(document.NetScript.Databases.postgres?.Persistent, false);
  });
});

Deno.test('#955 setProjectConfigValue rejects a path the generator does not read', async () => {
  await withProject(async ({ root, fs }) => {
    const error = await assertRejects(
      () => setProjectConfigValue(fs, root, 'NetScript.Databases.postgres.Persistant', false),
      ConfigInvalidError,
    );
    assertStringIncludes(error.message, 'Persistant');
    assertStringIncludes(error.message, 'Persistent');

    // Nothing was written: the misspelling must not appear in the document.
    const raw = await fs.readFile(join(root, 'appsettings.json'));
    assertEquals(raw.includes('Persistant'), false);
  });
});

Deno.test('#955 setProjectConfigValue rejects a value the schema would drop', async () => {
  await withProject(async ({ root, fs }) => {
    await assertRejects(
      () => setProjectConfigValue(fs, root, 'NetScript.Databases.postgres.Persistent', 'nope'),
      ConfigInvalidError,
    );
  });
});

Deno.test('#955 setProjectConfigValue --force writes an off-schema key with no silent success', async () => {
  await withProject(async ({ root, fs }) => {
    const result = await setProjectConfigValue(fs, root, 'Parameters.postgres-password', 'pw', {
      force: true,
    });

    assertEquals(result.forced, true);
    assertEquals(result.canonicalPath, 'Parameters.postgres-password');
    const document = JSON.parse(await fs.readFile(join(root, 'appsettings.json'))) as {
      Parameters?: Record<string, unknown>;
    };
    assertEquals(document.Parameters?.['postgres-password'], 'pw');
  });
});

Deno.test('#975 setProjectConfigValue writes a modelled Aspire parameter without --force', async () => {
  await withProject(async ({ root, fs }) => {
    const result = await setProjectConfigValue(
      fs,
      root,
      'Parameters.postgres-password',
      'pw',
    );

    assertEquals(result.forced, false);
    assertEquals(result.canonicalPath, 'Parameters.postgres-password');
  });
});

Deno.test('#955 readAppsettingsValue resolves the same spellings as set', async () => {
  await withProject(async ({ root, fs }) => {
    assertEquals(
      await readAppsettingsValue(fs, root, 'NetScript.Databases.postgres.Persistent'),
      true,
    );
    assertEquals(await readAppsettingsValue(fs, root, 'databases.postgres.persistent'), true);
    assertEquals(await readAppsettingsValue(fs, root, 'telemetry.otlpEndpoint'), 'http://localhost:4318');
  });
});
