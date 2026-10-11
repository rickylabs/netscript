import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import { DenoFileSystem } from '../runtime/file-system/deno-file-system.ts';
import { DatabaseWorkspaceMutator } from './workspace-mutator.ts';

async function writeProject(root: string, databases: Record<string, unknown>): Promise<void> {
  await Deno.mkdir(join(root, 'aspire'), { recursive: true });
  await Deno.writeTextFile(
    join(root, 'appsettings.json'),
    JSON.stringify({
      NetScript: {
        Name: 'shop',
        Otel: { HttpEndpoint: 'http://localhost:4318', Protocol: 'http/protobuf' },
        Defaults: { Deno: { Permissions: [], WatchMode: false } },
        Databases: databases,
      },
    }),
  );
  await Deno.writeTextFile(
    join(root, 'aspire', 'package.json'),
    JSON.stringify({ name: 'shop-apphost', dependencies: { 'vscode-jsonrpc': '8.2.0' } }),
  );
}

Deno.test('regenerating Aspire config declares pg once a PostgreSQL database is configured', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-db-apphost-deps-' });
  try {
    await writeProject(root, {
      main: { Engine: 'Postgres', Mode: 'Container', DatabaseName: 'main' },
    });
    const mutator = new DatabaseWorkspaceMutator(new DenoFileSystem(), {} as never, {} as never);

    await mutator.regenerateAspireConfig(root);

    const packageJson = JSON.parse(await Deno.readTextFile(join(root, 'aspire', 'package.json')));
    assertEquals(packageJson.dependencies, {
      'vscode-jsonrpc': '8.2.0',
      pg: SCAFFOLD_VERSIONS.APPHOST_PG,
    });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('regenerating Aspire config leaves a SQLite AppHost package.json untouched', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-db-apphost-deps-' });
  try {
    await writeProject(root, { main: { Engine: 'Sqlite', DatabaseName: 'main.sqlite' } });
    const packagePath = join(root, 'aspire', 'package.json');
    const before = await Deno.readTextFile(packagePath);
    const mutator = new DatabaseWorkspaceMutator(new DenoFileSystem(), {} as never, {} as never);

    await mutator.regenerateAspireConfig(root);

    assertEquals(await Deno.readTextFile(packagePath), before);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
