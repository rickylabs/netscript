import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import { DenoGeneratedSourceFormatter } from '../runtime/process/deno-generated-source-formatter.ts';
import { DenoProcess } from '../runtime/process/deno-process.ts';
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
    join(root, 'aspire', 'deno.json'),
    JSON.stringify({
      imports: { 'vscode-jsonrpc/node.js': 'npm:vscode-jsonrpc@8.2.0/node.js' },
    }),
  );
}

Deno.test('regenerating Aspire config declares pg in aspire/deno.json once a PostgreSQL database is configured', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-db-apphost-deps-' });
  try {
    await writeProject(root, {
      main: { Engine: 'Postgres', Mode: 'Container', DatabaseName: 'main' },
    });
    const mutator = new DatabaseWorkspaceMutator(
      new DenoFileSystem(),
      {} as never,
      {} as never,
      new DenoGeneratedSourceFormatter(new DenoProcess()),
    );

    await mutator.regenerateAspireConfig(root);

    const denoJson = JSON.parse(await Deno.readTextFile(join(root, 'aspire', 'deno.json')));
    assertEquals(denoJson.imports, {
      'vscode-jsonrpc/node.js': 'npm:vscode-jsonrpc@8.2.0/node.js',
      pg: `npm:pg@${SCAFFOLD_VERSIONS.APPHOST_PG}`,
    });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('regenerating Aspire config leaves a SQLite aspire/deno.json untouched', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-db-apphost-deps-' });
  try {
    await writeProject(root, { main: { Engine: 'Sqlite', DatabaseName: 'main.sqlite' } });
    const denoJsonPath = join(root, 'aspire', 'deno.json');
    const before = await Deno.readTextFile(denoJsonPath);
    const mutator = new DatabaseWorkspaceMutator(
      new DenoFileSystem(),
      {} as never,
      {} as never,
      new DenoGeneratedSourceFormatter(new DenoProcess()),
    );

    await mutator.regenerateAspireConfig(root);

    assertEquals(await Deno.readTextFile(denoJsonPath), before);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('regenerating Aspire config refuses a legacy Node.js aspire/package.json workspace without writing', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-db-legacy-apphost-' });
  try {
    await writeProject(root, {
      main: { Engine: 'Postgres', Mode: 'Container', DatabaseName: 'main' },
    });
    await Deno.writeTextFile(
      join(root, 'aspire', 'package.json'),
      JSON.stringify({ name: 'shop-apphost' }),
    );
    const configPath = join(root, 'aspire', 'aspire.config.json');
    const beforeConfig = '{"sdk":{"version":"13.5.3"}}\n';
    await Deno.writeTextFile(configPath, beforeConfig);

    const mutator = new DatabaseWorkspaceMutator(
      new DenoFileSystem(),
      {} as never,
      {} as never,
      new DenoGeneratedSourceFormatter(new DenoProcess()),
    );

    await assertRejects(
      () => mutator.regenerateAspireConfig(root),
      ScaffoldValidationError,
      'Legacy Node.js Aspire AppHost detected',
    );
    assertEquals(await Deno.readTextFile(configPath), beforeConfig);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
