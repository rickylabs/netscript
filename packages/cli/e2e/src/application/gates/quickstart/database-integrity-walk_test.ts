import { assertEquals, assertThrows } from '@std/assert';
import { join } from '@std/path';
import { resolvePgDataPath } from './database-integrity-walk.ts';

Deno.test('resolvePgDataPath finds nested Postgres 18 PGDATA', async () => {
  const root = await Deno.makeTempDir();
  try {
    const nested = join(root, '18', 'docker', 'global');
    await Deno.mkdir(nested, { recursive: true });
    await Deno.writeTextFile(join(nested, 'pg_control'), 'control');
    assertEquals(
      resolvePgDataPath(root, '/var/lib/postgresql'),
      '/var/lib/postgresql/18/docker',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('resolvePgDataPath keeps flat PGDATA at the mount root', async () => {
  const root = await Deno.makeTempDir();
  try {
    const globalDir = join(root, 'global');
    await Deno.mkdir(globalDir, { recursive: true });
    await Deno.writeTextFile(join(globalDir, 'pg_control'), 'control');
    assertEquals(
      resolvePgDataPath(root, '/var/lib/postgresql/data'),
      '/var/lib/postgresql/data',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('resolvePgDataPath fails closed when pg_control is absent', async () => {
  const root = await Deno.makeTempDir();
  try {
    assertThrows(
      () => resolvePgDataPath(root, '/var/lib/postgresql'),
      Error,
      'no global/pg_control',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
