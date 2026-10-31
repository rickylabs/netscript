import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { parsePluginManifest } from '@netscript/plugin/protocol';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { selectPluginDatabaseRequirement } from './plugin-database-requirement.ts';

const parsed = parsePluginManifest(JSON.parse(
  await Deno.readTextFile(
    new URL('../../../../../../../plugins/auth/scaffold.plugin.json', import.meta.url),
  ),
));
if (!parsed.ok) throw new Error(parsed.error.message);
const manifest = parsed.manifest;

Deno.test('database selector defaults to KV and specializes all SQL declarations together', async () => {
  const fs = new MemoryFileSystemAdapter();
  const selected = await selectPluginDatabaseRequirement(manifest, '/project', fs);
  assertEquals(selected.configuration, { NETSCRIPT_AUTH_BACKEND: 'kv-oauth' });
  assertEquals(selected.manifest.capabilities.hasDatabaseMigrations, false);
  assertEquals(selected.manifest.provider?.defaultRequiresDb, false);
  assertEquals(selected.manifest.provider?.infrastructureRequires, ['kv']);
  assertEquals(selected.manifest.officialSource?.requiresDb, false);
});

Deno.test('database selector precedence is process, .env, declared settings, default', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({
      auth: { backend: 'workos' },
      NetScript: { Plugins: { auth: { Environment: { NETSCRIPT_AUTH_BACKEND: 'better-auth' } } } },
    }),
  );
  const settings = await selectPluginDatabaseRequirement(manifest, '/project', fs);
  assertEquals(settings.configuration, { NETSCRIPT_AUTH_BACKEND: 'better-auth' });
  assertEquals(settings.manifest.provider?.defaultRequiresDb, true);
  assertEquals(settings.manifest.provider?.infrastructureRequires, ['kv', 'db']);
  assertEquals(settings.manifest.capabilities.hasDatabaseMigrations, true);
  assertEquals(settings.manifest.officialSource?.requiresDb, true);

  await fs.writeFile('/project/.env', "export NETSCRIPT_AUTH_BACKEND='workos'\n");
  const envFile = await selectPluginDatabaseRequirement(manifest, '/project', fs);
  assertEquals(envFile.configuration, { NETSCRIPT_AUTH_BACKEND: 'workos' });
  assertEquals(envFile.manifest.provider?.defaultRequiresDb, false);
  const process = await selectPluginDatabaseRequirement(manifest, '/project', fs, () => 'kv-oauth');
  assertEquals(process.configuration, { NETSCRIPT_AUTH_BACKEND: 'kv-oauth' });
});

Deno.test('database selector rejects unsupported and inherited values without leaking input', async () => {
  const fs = new MemoryFileSystemAdapter();
  for (const value of ['invalid-secret-value', 'toString', '__proto__', '']) {
    const error = await assertRejects(() =>
      selectPluginDatabaseRequirement(manifest, '/project', fs, () => value)
    );
    assert(error instanceof Error);
    assertStringIncludes(error.message, 'Unsupported NETSCRIPT_AUTH_BACKEND value');
    assertEquals(error.message.includes('invalid-secret-value'), false);
  }
});

Deno.test('plugins without a database selector preserve their original manifest', async () => {
  const { databaseRequirement: _omitted, ...legacy } = manifest;
  const selected = await selectPluginDatabaseRequirement(
    legacy,
    '/project',
    new MemoryFileSystemAdapter(),
  );
  assertEquals(selected.manifest, legacy);
  assertEquals(selected.configuration, undefined);
});
