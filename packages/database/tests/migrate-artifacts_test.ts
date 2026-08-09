import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';

import { type PrismaSpawn, runMigrationWithArtifacts } from '../scripts/migrate.ts';

Deno.test('migration creation reports and verifies created and applied artifacts', async () => {
  const root = await Deno.makeTempDir();
  const migrationsPath = join(root, 'migrations');
  await Deno.mkdir(migrationsPath);
  const invocations: readonly string[][] = [];
  const calls = invocations as string[][];
  const spawn: PrismaSpawn = async (args) => {
    calls.push([...args]);
    if (args[0] === 'migrate' && args[1] === 'dev') {
      await Deno.mkdir(join(migrationsPath, '20260808_add_profile'));
      await Deno.writeTextFile(
        join(migrationsPath, '20260808_add_profile', 'migration.sql'),
        'ALTER TABLE "User" ADD COLUMN "profile" TEXT;\n',
      );
    }
    return { code: 0, stderr: '' };
  };

  try {
    const result = await runMigrationWithArtifacts({
      provider: 'postgres',
      migrationName: 'add-profile',
      migrationsPath,
      interactive: false,
      spawn,
      verbose: false,
    });

    assertEquals(result.code, 0);
    assertEquals(result.created, ['20260808_add_profile']);
    assertEquals(result.applied, ['20260808_add_profile']);
    assertEquals(calls[0].slice(0, 4), ['migrate', 'dev', '--config', 'prisma.config.ts']);
    assertEquals(calls[1].slice(0, 3), ['migrate', 'status', '--config']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('headless migrate never aliases deploy and fails when no artifact is created', async () => {
  const root = await Deno.makeTempDir();
  const migrationsPath = join(root, 'migrations');
  await Deno.mkdir(migrationsPath);
  const calls: string[][] = [];
  const messages: string[] = [];
  const spawn: PrismaSpawn = (args) => {
    calls.push([...args]);
    return Promise.resolve({ code: 0, stderr: '' });
  };

  try {
    const result = await runMigrationWithArtifacts({
      provider: 'postgres',
      migrationName: 'add-profile',
      migrationsPath,
      interactive: false,
      spawn,
      log: (message: string) => messages.push(message),
    });

    assertEquals(result.code, 1);
    assertEquals(result.created, []);
    assertEquals(result.applied, []);
    assertEquals(calls.length, 1);
    assertEquals(calls[0][0], 'migrate');
    assertEquals(calls[0][1], 'dev');
    assertStringIncludes(messages.join('\n'), 'netscript db migrate --name add-profile');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('no-change migration is a non-zero result with empty created and applied sets', async () => {
  const root = await Deno.makeTempDir();
  const migrationsPath = join(root, 'migrations');
  await Deno.mkdir(migrationsPath);

  try {
    const result = await runMigrationWithArtifacts({
      provider: 'sqlite',
      migrationsPath,
      interactive: true,
      spawn: () => Promise.resolve({ code: 0, stderr: '' }),
      verbose: false,
    });

    assertEquals(result, { code: 1, created: [], applied: [] });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
