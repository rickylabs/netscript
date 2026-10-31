import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import { appendPluginMigrations, pendingPluginMigrations } from '../scripts/plugin-migrations.ts';
import { runMigrationWithArtifacts } from '../scripts/migrate.ts';

Deno.test('SQL contributions precede deploy, remain immutable, and support SQL-only migrations', async () => {
  const root = await Deno.makeTempDir();
  const schemaPath = join(root, 'schema/plugins/example');
  const migrationsPath = join(root, 'migrations');
  await Deno.mkdir(schemaPath, { recursive: true });
  const asset = join(schemaPath, 'checks.migration.sql');
  await Deno.writeTextFile(asset, 'SELECT 1;\r\n');
  const calls: string[] = [];
  try {
    const result = await runMigrationWithArtifacts({
      provider: 'postgres',
      schemaPath,
      migrationsPath,
      interactive: false,
      verbose: false,
      async spawn(args) {
        calls.push(args[1]);
        if (args[1] === 'dev') assertEquals(args.includes('--create-only'), true);
        if (args[1] === 'deploy') {
          const entries = Array.from(Deno.readDirSync(migrationsPath));
          assertEquals(entries.length, 1);
          assertStringIncludes(
            await Deno.readTextFile(join(migrationsPath, entries[0].name, 'migration.sql')),
            'SELECT 1;',
          );
        }
        return { code: 0, stderr: '' };
      },
    });
    assertEquals(result.code, 0);
    assertEquals(result.created, result.applied);
    assertEquals(calls, ['dev', 'deploy', 'status']);
    await Deno.writeTextFile(asset, 'SELECT 1;\n');
    assertEquals(await pendingPluginMigrations(schemaPath, migrationsPath), []);
    await Deno.writeTextFile(asset, 'SELECT 2;');
    await assertRejects(
      () => pendingPluginMigrations(schemaPath, migrationsPath),
      Error,
      'new migration name',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('SQL contributions append to a new Prisma artifact and failed deploy is unproven', async () => {
  const root = await Deno.makeTempDir();
  try {
    const schemaPath = join(root, 'schema');
    const migrationsPath = join(root, 'migrations');
    await Deno.mkdir(schemaPath);
    await Deno.writeTextFile(join(schemaPath, 'checks.migration.sql'), 'SELECT 1;');
    const created = '20261031000000_initial';
    const result = await runMigrationWithArtifacts({
      provider: 'postgres',
      schemaPath,
      migrationsPath,
      interactive: false,
      verbose: false,
      async spawn(args) {
        if (args[1] === 'dev') {
          await Deno.mkdir(join(migrationsPath, created), { recursive: true });
          await Deno.writeTextFile(
            join(migrationsPath, created, 'migration.sql'),
            'CREATE TABLE example (id int);',
          );
        }
        return { code: args[1] === 'deploy' ? 9 : 0, stderr: '' };
      },
    });
    assertEquals(result, { code: 9, created: [created], applied: [] });
    assertStringIncludes(
      await Deno.readTextFile(join(migrationsPath, created, 'migration.sql')),
      'CREATE TABLE example',
    );
    assertEquals(await appendPluginMigrations(migrationsPath, [created], []), [created]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
