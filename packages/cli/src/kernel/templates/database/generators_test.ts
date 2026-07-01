/**
 * @module templates/database/generators_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';

import { DbEngineRegistry } from '../../application/registries/db-engine-registry.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';
import { generateDatabaseDenoJson } from './generate-db-deno-json.ts';
import { generateDatabaseFacadeMod } from './generate-db-mod.ts';
import { generateEngineMod } from './generate-engine-mod.ts';
import { generatePrismaConfig } from './generate-prisma-config.ts';

// These generators read templates synchronously, which requires a previously-
// awaited registry hydration. The tests exercise them directly (outside the CLI
// dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

describe('database template generators', () => {
  const registry = new DbEngineRegistry();

  it('generates engine-specific Deno tasks and imports', () => {
    const postgres = registry.get('postgres');
    const config = JSON.parse(
      generateDatabaseDenoJson(postgres, {
        projectName: 'alpha-app',
        importMode: 'local',
        localBase: '../..',
      }),
    );

    assertEquals(config.name, '@alpha-app/database-postgres');
    assertEquals(config.tasks['db:generate:postgres'], 'deno task db:generate');
    assertStringIncludes(config.tasks['db:generate'], 'deno task db:clear-seeded-client');
    assertEquals(
      config.tasks['db:clear-seeded-client'],
      'deno run --allow-write=schema/.generated/client.server.ts scripts/clear-seeded-client.ts',
    );
    assertStringIncludes(config.tasks['db:generate'], 'npm:prisma@^7.4.2 generate');
    assertEquals(
      config.tasks['db:init'],
      'deno run -A --minimum-dependency-age=0 scripts/migrate.ts --name=init',
    );
    assertEquals(
      config.tasks['db:migrate'],
      'deno run -A --minimum-dependency-age=0 scripts/migrate.ts',
    );
    assertEquals(
      config.imports['@netscript/database/scripts'],
      '../../packages/database/scripts/mod.ts',
    );
    assertEquals(config.imports['@prisma/adapter-pg'], 'npm:@prisma/adapter-pg@^7.4.2');
  });

  it('includes patch-client and fix-zod tasks for sqlite', () => {
    const sqlite = registry.get('sqlite');
    const config = JSON.parse(
      generateDatabaseDenoJson(sqlite, {
        projectName: 'alpha-app',
        importMode: 'jsr',
      }),
    );

    assertEquals(config.tasks['db:status:sqlite'], 'deno task db:status');
    assertEquals(
      config.tasks['db:patch-client'],
      'deno run -A --minimum-dependency-age=0 scripts/patch-prisma-client.ts',
    );
    assertEquals(config.imports['@prisma/adapter-pg'], undefined);
    assertEquals(
      config.imports['@netscript/database'],
      netscriptJsrSpecifier('database'),
    );
    assertEquals(
      config.imports['@netscript/database/scripts'],
      netscriptJsrSpecifier('database') + '/scripts',
    );
    assertEquals(
      config.imports['@netscript/database/tracing'],
      netscriptJsrSpecifier('database') + '/tracing',
    );
  });

  it('generates zod and patch-client tasks for mysql', () => {
    const mysql = registry.get('mysql');
    const config = JSON.parse(
      generateDatabaseDenoJson(mysql, {
        projectName: 'alpha-app',
        importMode: 'jsr',
      }),
    );

    assertStringIncludes(config.tasks['db:generate'], 'scripts/generate-zod.ts');
    assertStringIncludes(config.tasks['db:generate'], 'scripts/fix-zod-imports.ts');
    assertEquals(
      config.tasks['db:zod'],
      'deno run -A --minimum-dependency-age=0 scripts/generate-zod.ts',
    );
    assertEquals(
      config.tasks['db:patch-client'],
      'deno run -A --minimum-dependency-age=0 scripts/patch-prisma-client.ts',
    );
    assertEquals(
      config.imports['@netscript/database/scripts'],
      netscriptJsrSpecifier('database') + '/scripts',
    );
    assertEquals(
      config.imports['@netscript/database/tracing'],
      netscriptJsrSpecifier('database') + '/tracing',
    );
  });

  it('generates zod and patch-client tasks for mssql', () => {
    const mssql = registry.get('mssql');
    const config = JSON.parse(
      generateDatabaseDenoJson(mssql, {
        projectName: 'alpha-app',
        importMode: 'jsr',
      }),
    );

    assertStringIncludes(config.tasks['db:generate'], 'scripts/generate-zod.ts');
    assertEquals(
      config.tasks['db:zod'],
      'deno run -A --minimum-dependency-age=0 scripts/generate-zod.ts',
    );
    assertEquals(
      config.tasks['db:patch-client'],
      'deno run -A --minimum-dependency-age=0 scripts/patch-prisma-client.ts',
    );
  });

  it('generates Prisma config with Aspire env key and sqlite fallback URL', () => {
    const sqlite = registry.get('sqlite');
    const output = generatePrismaConfig(sqlite, {
      configKey: 'primary-db',
      databaseName: 'alpha_app.db',
    });

    assertStringIncludes(output, "Deno.env.get(envKey) ?? Deno.env.get('DATABASE_URL')");
    assertStringIncludes(output, "'file:./alpha_app.db'");
    assertStringIncludes(output, 'const databaseUrl = resolveDatabaseUrl(');
    assertStringIncludes(
      output,
      'function normalizeDatabaseUrl(provider: string, value: string): string',
    );
    assertStringIncludes(output, "schema: 'schema'");
  });

  it('generates engine modules with adapter setup where required', () => {
    const mssql = registry.get('mssql');
    const output = generateEngineMod(mssql, { configKey: 'sql-server' });

    assertStringIncludes(output, "import { PrismaMssql } from '@prisma/adapter-mssql'");
    assertStringIncludes(output, "resolveConnectionString('mssql', 'SQL_SERVER_URI')");
    assertStringIncludes(output, "Deno.env.set('SQL_SERVER_URI', connectionString);");
    assertStringIncludes(output, "Deno.env.set('DATABASE_URL', connectionString);");
    assertStringIncludes(output, 'export function getMssql()');
    assertStringIncludes(output, 'readonly mssql: MssqlClient');
  });

  it('constructs the sqlite engine module with the libsql driver adapter', () => {
    const sqlite = registry.get('sqlite');
    const output = generateEngineMod(sqlite, { configKey: 'primary-db' });

    // Prisma 7 requires a driver adapter; the sqlite facade must supply one.
    assertStringIncludes(output, "import { PrismaLibSql } from '@prisma/adapter-libsql'");
    assertStringIncludes(output, "resolveConnectionString('sqlite', 'PRIMARY_DB_URI')");
    assertStringIncludes(output, 'new PrismaLibSql({ url: connectionString })');
    assertStringIncludes(output, 'adapter: new PrismaLibSql(');
    // Regression guard: must never construct the client with no adapter.
    assertEquals(output.includes('new SqliteClient();'), false);
  });

  it('includes the libsql adapter import for the sqlite database deno.json', () => {
    const sqlite = registry.get('sqlite');
    const config = JSON.parse(
      generateDatabaseDenoJson(sqlite, {
        projectName: 'alpha-app',
        importMode: 'jsr',
      }),
    );

    assertEquals(
      config.imports['@prisma/adapter-libsql'],
      'npm:@prisma/adapter-libsql@^7.4.2',
    );
  });

  it('generates the root database facade for the selected engine', () => {
    const mysql = registry.get('mysql');
    const output = generateDatabaseFacadeMod(mysql);

    assertStringIncludes(output, "export * from './mysql/mod.ts'");
    assertStringIncludes(output, "export { default } from './mysql/mod.ts'");
  });
});
