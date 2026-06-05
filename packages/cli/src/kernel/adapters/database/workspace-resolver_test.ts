/**
 * @module infra/database/workspace-resolver_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { DbWorkspaceResolver, mapEngine } from './workspace-resolver.ts';

describe('DbWorkspaceResolver', () => {
  it('discovers configured databases from appsettings.json', async () => {
    const fs = new MemoryFileSystemAdapter();
    await fs.writeFile(
      '/project/appsettings.json',
      JSON.stringify({
        NetScript: {
          Databases: {
            primary: {
              Enabled: true,
              Engine: 'Postgres',
              DatabaseName: 'app-db',
            },
            reports: {
              Enabled: false,
              Engine: 'Mssql',
              DatabaseName: 'reports-db',
            },
          },
        },
      }),
    );

    const resolver = new DbWorkspaceResolver(fs);
    const databases = await resolver.discoverDatabases('/project');

    assertEquals(databases.length, 2);
    assertEquals(databases[0].configKey, 'primary');
    assertEquals(databases[0].engine, 'postgres');
    assertEquals(databases[0].databaseName, 'app-db');
    assertEquals(databases[0].enabled, true);
    assertEquals(databases[1].engine, 'mssql');
    assertEquals(databases[1].enabled, false);
  });

  it('resolves all enabled databases and skips disabled entries', () => {
    const resolver = new DbWorkspaceResolver(new MemoryFileSystemAdapter());
    const target = resolver.resolveTarget([
      {
        configKey: 'primary',
        engine: 'postgres',
        databaseName: 'app-db',
        workspaceDir: 'database/postgres',
        enabled: true,
      },
      {
        configKey: 'reports',
        engine: 'mssql',
        databaseName: 'reports-db',
        workspaceDir: 'database/mssql',
        enabled: false,
      },
    ], 'all');

    assertEquals(target.kind, 'all');
    if (target.kind === 'all') {
      assertEquals(target.databases.map((database) => database.configKey), ['primary']);
    }
  });

  it('maps config engine labels to CLI engine identifiers', () => {
    assertEquals(mapEngine('Postgres'), 'postgres');
    assertEquals(mapEngine('Mysql'), 'mysql');
    assertEquals(mapEngine('Mssql'), 'mssql');
    assertEquals(mapEngine('Sqlite'), 'sqlite');
  });

  it('rejects unknown database targets', () => {
    const resolver = new DbWorkspaceResolver(new MemoryFileSystemAdapter());

    assertRejects(
      () =>
        Promise.resolve().then(() => {
          resolver.resolveTarget([
            {
              configKey: 'primary',
              engine: 'postgres',
              databaseName: 'app-db',
              workspaceDir: 'database/postgres',
              enabled: true,
            },
          ], 'missing');
        }),
      Error,
      'Unknown database target',
    );
  });
});
