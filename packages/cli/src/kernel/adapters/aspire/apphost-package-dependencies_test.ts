import { assertEquals } from '@std/assert';
import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import {
  collectConfiguredDbEngines,
  reconcileAppHostPackageDependencies,
} from './apphost-package-dependencies.ts';

const POSTGRES = { main: { Engine: 'Postgres' } };

Deno.test('AppHost dependency reconciliation is a no-op without an AppHost package.json', async () => {
  const fs = new MemoryFileSystemAdapter();

  assertEquals(await reconcileAppHostPackageDependencies(fs, '/project/aspire', POSTGRES), null);
  assertEquals(await fs.exists('/project/aspire/package.json'), false);
});

Deno.test('AppHost dependency reconciliation reports without writing in dry-run', async () => {
  const fs = new MemoryFileSystemAdapter();
  const original = JSON.stringify({ dependencies: { 'vscode-jsonrpc': '8.2.0' } });
  await fs.writeFile('/project/aspire/package.json', original);

  assertEquals(
    await reconcileAppHostPackageDependencies(fs, '/project/aspire', POSTGRES, { dryRun: true }),
    '/project/aspire/package.json',
  );
  assertEquals(await fs.readFile('/project/aspire/package.json'), original);

  assertEquals(
    await reconcileAppHostPackageDependencies(fs, '/project/aspire', POSTGRES),
    '/project/aspire/package.json',
  );
  assertEquals(
    JSON.parse(await fs.readFile('/project/aspire/package.json')).dependencies.pg,
    SCAFFOLD_VERSIONS.APPHOST_PG,
  );
  assertEquals(await reconcileAppHostPackageDependencies(fs, '/project/aspire', POSTGRES), null);
});

Deno.test('configured database engines map to distinct engine choices', () => {
  assertEquals(
    collectConfiguredDbEngines({
      a: { Engine: 'Postgres' },
      b: { Engine: 'Postgres' },
      c: { Engine: 'Sqlite' },
      d: { Engine: 'Unknown' },
      e: {},
    }),
    ['postgres', 'sqlite'],
  );
});
