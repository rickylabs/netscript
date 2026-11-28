import { assertEquals, assertRejects } from '@std/assert';
import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import {
  assertNativeDenoAppHost,
  collectConfiguredDbEngines,
  reconcileAppHostPackageDependencies,
} from './apphost-package-dependencies.ts';

const POSTGRES = { main: { Engine: 'Postgres' } };

Deno.test('AppHost dependency reconciliation is a no-op without aspire/deno.json', async () => {
  const fs = new MemoryFileSystemAdapter();

  assertEquals(await reconcileAppHostPackageDependencies(fs, '/project/aspire', POSTGRES), null);
  assertEquals(await fs.exists('/project/aspire/deno.json'), false);
});

Deno.test('AppHost dependency reconciliation updates aspire/deno.json and respects dry-run', async () => {
  const fs = new MemoryFileSystemAdapter();
  const original = JSON.stringify({
    imports: { 'vscode-jsonrpc/node.js': 'npm:vscode-jsonrpc@8.2.0/node.js' },
  });
  await fs.writeFile('/project/aspire/deno.json', original);

  assertEquals(
    await reconcileAppHostPackageDependencies(fs, '/project/aspire', POSTGRES, { dryRun: true }),
    '/project/aspire/deno.json',
  );
  assertEquals(await fs.readFile('/project/aspire/deno.json'), original);

  assertEquals(
    await reconcileAppHostPackageDependencies(fs, '/project/aspire', POSTGRES),
    '/project/aspire/deno.json',
  );
  assertEquals(
    JSON.parse(await fs.readFile('/project/aspire/deno.json')).imports.pg,
    `npm:pg@${SCAFFOLD_VERSIONS.APPHOST_PG}`,
  );
  assertEquals(await reconcileAppHostPackageDependencies(fs, '/project/aspire', POSTGRES), null);
});

Deno.test('assertNativeDenoAppHost allows --no-aspire and native Deno AppHost, rejects legacy package.json shapes', async () => {
  // --no-aspire (no aspire/ directory)
  const noAspireFs = new MemoryFileSystemAdapter();
  await assertNativeDenoAppHost(noAspireFs, '/project');

  // Native aspire/deno.json only
  const nativeFs = new MemoryFileSystemAdapter();
  await nativeFs.writeFile('/project/aspire/deno.json', JSON.stringify({ imports: {} }));
  await assertNativeDenoAppHost(nativeFs, '/project');

  // Legacy aspire/package.json alone
  const legacyOnlyFs = new MemoryFileSystemAdapter();
  await legacyOnlyFs.writeFile(
    '/project/aspire/package.json',
    JSON.stringify({ name: 'legacy-apphost' }),
  );
  await assertRejects(
    () => assertNativeDenoAppHost(legacyOnlyFs, '/project'),
    ScaffoldValidationError,
    'Legacy Node.js Aspire AppHost detected',
  );
  await assertRejects(
    () => reconcileAppHostPackageDependencies(legacyOnlyFs, '/project/aspire', POSTGRES),
    ScaffoldValidationError,
    'upgrade-aspire-17.md',
  );

  // Coexisting aspire/package.json + aspire/deno.json must also fail closed
  const hybridFs = new MemoryFileSystemAdapter();
  await hybridFs.writeFile('/project/aspire/deno.json', JSON.stringify({ imports: {} }));
  await hybridFs.writeFile(
    '/project/aspire/package.json',
    JSON.stringify({ name: 'legacy-apphost' }),
  );
  await assertRejects(
    () => assertNativeDenoAppHost(hybridFs, '/project'),
    ScaffoldValidationError,
    'Legacy Node.js Aspire AppHost detected',
  );
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
