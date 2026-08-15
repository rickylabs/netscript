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
    assertEquals(config.tasks['db:deploy:postgres'], 'deno task db:migrate:deploy');
    assertEquals(config.tasks['db:validate:postgres'], 'deno task db:validate');
    assertStringIncludes(config.tasks['db:resolve-applied'], 'migrate resolve --applied=');
    assertStringIncludes(config.tasks['db:resolve-rolled-back'], 'migrate resolve --rolled-back=');
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

  it('emits only the selected provider helpers in engine modules and Prisma config', () => {
    const cases = [
      {
        engine: 'postgres' as const,
        engineRequired: ['PrismaPg', 'PostgresClient', 'normalizePostgresUrl'],
        prismaRequired: ['defineConfig, env', "env('DATABASE_URL')", 'normalizePostgresUrl'],
        forbidden: ['normalizeMysqlUrl', 'normalizeMssqlUrl', 'parseSqlServerEndpoint'],
      },
      {
        engine: 'mysql' as const,
        engineRequired: ['PrismaMySql', 'MysqlClient', 'normalizeMysqlUrl'],
        prismaRequired: ['defineConfig, env', "env('DATABASE_URL')", 'normalizeMysqlUrl'],
        forbidden: ['normalizePostgresUrl', 'normalizeMssqlUrl', 'parseSqlServerEndpoint'],
      },
      {
        engine: 'mssql' as const,
        engineRequired: ['PrismaMssql', 'MssqlClient', 'normalizeMssqlUrl'],
        prismaRequired: ['defineConfig, env', "env('DATABASE_URL')", 'normalizeMssqlUrl'],
        forbidden: ['normalizePostgresUrl', 'normalizeMysqlUrl'],
      },
      {
        engine: 'sqlite' as const,
        engineRequired: [
          'PrismaLibSql',
          'SqliteClient',
          "resolveConnectionString('PRIMARY_DB_URI', 'file:./alpha_app.db')",
        ],
        prismaRequired: [
          "import { defineConfig } from 'prisma/config'",
          "'file:./alpha_app.db'",
        ],
        forbidden: [
          'normalizePostgresUrl',
          'normalizeMysqlUrl',
          'normalizeMssqlUrl',
          'parseConnectionParts',
          'parseSqlServerEndpoint',
        ],
      },
    ] as const;

    for (const testCase of cases) {
      const provider = registry.get(testCase.engine);
      const engineOutput = generateEngineMod(provider, {
        configKey: 'primary-db',
        databaseName: 'alpha_app.db',
      });
      const prismaOutput = generatePrismaConfig(provider, {
        configKey: 'primary-db',
        databaseName: 'alpha_app.db',
      });

      for (const symbol of testCase.engineRequired) {
        assertStringIncludes(engineOutput, symbol);
      }
      for (const symbol of testCase.prismaRequired) {
        assertStringIncludes(prismaOutput, symbol);
      }
      for (const symbol of testCase.forbidden) {
        assertEquals(
          engineOutput.includes(symbol),
          false,
          `${testCase.engine} engine output must not contain ${symbol}`,
        );
        assertEquals(
          prismaOutput.includes(symbol),
          false,
          `${testCase.engine} Prisma config must not contain ${symbol}`,
        );
      }
    }
  });

  it('normalizes mssql Aspire loopback endpoints to hostname URLs', () => {
    const mssql = registry.get('mssql');
    const output = generatePrismaConfig(mssql, {
      configKey: 'mssql',
      databaseName: 'netscript',
    });

    assertStringIncludes(output, "const trimmed = value.replace(/^tcp:/i, '');");
    assertStringIncludes(
      output,
      "const [host = 'localhost', port = '1433'] = trimmed.split(',', 2);",
    );
    assertStringIncludes(output, 'host: normalizeSqlServerHost(host.trim())');
    assertStringIncludes(output, "port: port.trim() || '1433'");
    assertStringIncludes(output, "host === '127.0.0.1'");
    assertStringIncludes(output, "host === '::1'");
    assertStringIncludes(output, "host === '[::1]'");
    assertStringIncludes(output, "return 'localhost'");
    assertStringIncludes(output, "return host || 'localhost'");
  });

  it('constructs sqlite with the libsql adapter and generated typed client', () => {
    const sqlite = registry.get('sqlite');
    const output = generateEngineMod(sqlite, {
      configKey: 'primary-db',
      databaseName: 'alpha_app.db',
    });

    assertStringIncludes(output, "import { PrismaLibSql } from '@prisma/adapter-libsql'");
    assertStringIncludes(output, "from './schema/.generated/client.server.ts'");
    assertStringIncludes(output, 'new PrismaLibSql({ url: connectionString })');
    assertStringIncludes(output, 'adapter: new PrismaLibSql(');
    assertStringIncludes(
      output,
      "Deno.env.get(envKey) ?? Deno.env.get('DATABASE_URL') ?? fallback",
    );
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
