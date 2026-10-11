/**
 * @module templates/aspire/generate-apphost-package-json_test
 */

import { assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import {
  appHostRuntimeDependencies,
  generateAppHostPackageJson,
  reconcileAppHostPackageJson,
} from './generate-apphost-package-json.ts';

describe('generateAppHostPackageJson', () => {
  it('declares pg only for AppHosts with a PostgreSQL database', () => {
    const postgres = JSON.parse(generateAppHostPackageJson({ name: 'shop', dbEngines: ['postgres'] }));
    const sqlite = JSON.parse(generateAppHostPackageJson({ name: 'shop', dbEngines: ['sqlite'] }));

    assertEquals(postgres.name, 'shop-apphost');
    assertEquals(postgres.dependencies, {
      'vscode-jsonrpc': '8.2.0',
      pg: SCAFFOLD_VERSIONS.APPHOST_PG,
    });
    assertEquals(sqlite.dependencies, { 'vscode-jsonrpc': '8.2.0' });
    assertEquals(postgres.devDependencies, sqlite.devDependencies);
    assertEquals(postgres.devDependencies.tsx, '4.21.0');
  });

  it('pins pg exactly because the AppHost has no lockfile', () => {
    assertEquals(/^\d+\.\d+\.\d+$/.test(SCAFFOLD_VERSIONS.APPHOST_PG), true);
    for (const engine of ['mysql', 'mssql', 'sqlite', 'none'] as const) {
      assertEquals('pg' in appHostRuntimeDependencies([engine]), false);
    }
  });
});

describe('reconcileAppHostPackageJson', () => {
  const existing = JSON.stringify({
    name: 'shop-apphost',
    private: true,
    dependencies: { 'vscode-jsonrpc': '8.2.0', 'left-pad': '1.3.0' },
    devDependencies: { tsx: '4.21.0' },
    scripts: { lint: 'tsc --noEmit' },
  });

  it('adds pg when a PostgreSQL database joins and keeps project-owned entries', () => {
    const reconciled = reconcileAppHostPackageJson(existing, ['sqlite', 'postgres']);

    assertEquals(JSON.parse(reconciled ?? 'null'), {
      name: 'shop-apphost',
      private: true,
      dependencies: {
        'vscode-jsonrpc': '8.2.0',
        'left-pad': '1.3.0',
        pg: SCAFFOLD_VERSIONS.APPHOST_PG,
      },
      devDependencies: { tsx: '4.21.0' },
      scripts: { lint: 'tsc --noEmit' },
    });
  });

  it('never overrides a declared version and reports no change when nothing is missing', () => {
    const pinned = JSON.stringify({ dependencies: { 'vscode-jsonrpc': '8.2.0', pg: '8.0.0' } });

    assertEquals(reconcileAppHostPackageJson(pinned, ['postgres']), null);
    assertEquals(reconcileAppHostPackageJson(existing, ['sqlite']), null);
  });

  it('never removes pg when PostgreSQL leaves', () => {
    const withPg = JSON.stringify({ dependencies: { 'vscode-jsonrpc': '8.2.0', pg: '8.23.1' } });

    assertEquals(reconcileAppHostPackageJson(withPg, []), null);
  });

  it('rejects a package.json that is not a JSON object', () => {
    assertThrows(() => reconcileAppHostPackageJson('[]', ['postgres']), TypeError);
  });
});
