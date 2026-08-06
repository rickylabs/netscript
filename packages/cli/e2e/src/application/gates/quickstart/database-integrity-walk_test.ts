import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { pgDataFromEnv, resolvePgDataPath } from './database-integrity-walk.ts';

Deno.test('pgDataFromEnv reads PGDATA from docker inspect Env', () => {
  assertEquals(
    pgDataFromEnv(['PATH=/usr/bin', 'PGDATA=/var/lib/postgresql/18/docker', 'POSTGRES_PASSWORD=x']),
    '/var/lib/postgresql/18/docker',
  );
  assertEquals(pgDataFromEnv(['PATH=/usr/bin']), undefined);
});

Deno.test('resolvePgDataPath prefers PGDATA env over host layout', async () => {
  const root = await Deno.makeTempDir();
  try {
    // Deliberately leave the host tree empty — env must win without host discovery.
    const path = await resolvePgDataPath({
      image: 'docker.io/library/postgres:18.3',
      source: root,
      destination: '/var/lib/postgresql',
      env: ['PGDATA=/var/lib/postgresql/18/docker'],
    });
    assertEquals(path, '/var/lib/postgresql/18/docker');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('resolvePgDataPath finds nested Postgres 18 PGDATA on a readable host tree', async () => {
  const root = await Deno.makeTempDir();
  try {
    const nested = join(root, '18', 'docker', 'global');
    await Deno.mkdir(nested, { recursive: true });
    await Deno.writeTextFile(join(nested, 'pg_control'), 'control');
    assertEquals(
      await resolvePgDataPath({
        image: 'unused',
        source: root,
        destination: '/var/lib/postgresql',
        env: [],
      }),
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
      await resolvePgDataPath({
        image: 'unused',
        source: root,
        destination: '/var/lib/postgresql/data',
        env: [],
      }),
      '/var/lib/postgresql/data',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('resolvePgDataPath fails closed when pg_control is absent', async () => {
  const root = await Deno.makeTempDir();
  try {
    await assertRejects(
      () =>
        resolvePgDataPath({
          image: 'docker.io/library/postgres:18.3',
          source: root,
          destination: '/var/lib/postgresql',
          env: [],
        }),
      Error,
      'no global/pg_control',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
