/**
 * @module templates/aspire/helpers/generate-db-cli-mode_test
 */

import { assertStringIncludes } from 'jsr:@std/assert@^1'
import { describe, it } from 'jsr:@std/testing@^1/bdd'

import { generateDbCliMode } from '../generate-db-cli-mode.ts'
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts'

// `generateDbCliMode` reads templates synchronously, which requires a previously-
// awaited registry hydration. The tests exercise it directly (outside the CLI
// dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate()

describe('generateDbCliMode', () => {
  it('generates targets for all configured database engines', () => {
    const output = generateDbCliMode({
      databases: {
        postgres: {
          Enabled: true,
          Engine: 'Postgres',
          Mode: 'Container',
          DatabaseName: 'app-db',
          Persistent: true,
        },
        mysql: {
          Enabled: true,
          Engine: 'Mysql',
          Mode: 'Container',
          DatabaseName: 'app-mysql',
          Persistent: true,
        },
        mssql: {
          Enabled: true,
          Engine: 'Mssql',
          Mode: 'Container',
          DatabaseName: 'app-mssql',
          Persistent: true,
        },
        sqlite: {
          Enabled: true,
          Engine: 'Sqlite',
          Mode: 'External',
          DatabaseName: 'app.sqlite',
          Persistent: false,
        },
      },
    })

    assertStringIncludes(output, "'postgres': {")
    assertStringIncludes(output, "envKey: 'POSTGRES_URI'")
    assertStringIncludes(output, "taskSuffix: 'postgres'")
    assertStringIncludes(
      output,
      "workdir: resolve(appHostDir, 'database', 'postgres')",
    )
    assertStringIncludes(output, "'mysql': {")
    assertStringIncludes(output, "envKey: 'MYSQL_URI'")
    assertStringIncludes(output, "taskSuffix: 'mysql'")
    assertStringIncludes(output, "'mssql': {")
    assertStringIncludes(output, "envKey: 'MSSQL_URI'")
    assertStringIncludes(output, "taskSuffix: 'mssql'")
    assertStringIncludes(output, "'sqlite': {")
    assertStringIncludes(output, "envKey: 'SQLITE_URI'")
    assertStringIncludes(output, "taskSuffix: 'sqlite'")
    assertStringIncludes(output, 'let resource = await builder.addExecutable(')
    assertStringIncludes(output, 'const offlineGenerateUrl = operation ===')
    assertStringIncludes(output, 'buildOfflineGenerateUrl(target)')
    assertStringIncludes(
      output,
      ".withEnvironment('DATABASE_URL', offlineGenerateUrl)",
    )
    assertStringIncludes(
      output,
      'const sqliteUrl = `file:./${target.databaseName}`;',
    )
    assertStringIncludes(output, ".withEnvironment('DATABASE_URL', sqliteUrl)")
    assertStringIncludes(output, '.withEnvironment(target.envKey, sqliteUrl);')
    assertStringIncludes(output, 'resource = await resource')
    assertStringIncludes(output, 'if (!offlineGenerateUrl && target.resource)')
    assertStringIncludes(
      output,
      ".withEnvironment('DATABASE_URL', target.resource)",
    )
    assertStringIncludes(output, '.withReference(target.resource)')
    assertStringIncludes(
      output,
      'function buildOfflineGenerateUrl(target: DbCliTarget)',
    )
    assertStringIncludes(output, 'sqlserver://localhost:1433;database=')
    assertStringIncludes(output, 'password=NetscriptE2e!Sql2026')
  })

  it('supports env-based DB CLI activation for detached Aspire runs', () => {
    const output = generateDbCliMode({ databases: {} })

    assertStringIncludes(output, 'export async function tryHandleDbCliMode(')
    assertStringIncludes(
      output,
      'const configuration = await builder.getConfiguration();',
    )
    assertStringIncludes(
      output,
      'const configured = await configuration.getConfigValue(key);',
    )
    assertStringIncludes(output, "'prisma-operation',")
    assertStringIncludes(output, 'await configuration.getConfigValue(key)')
    assertStringIncludes(output, 'configured ?? process.env[envName]')
    assertStringIncludes(output, "'NETSCRIPT_PRISMA_OPERATION'")
    assertStringIncludes(output, "'NETSCRIPT_PRISMA_TARGET'")
    assertStringIncludes(output, "'NETSCRIPT_PRISMA_NAME'")
    assertStringIncludes(output, 'return false;')
    assertStringIncludes(output, 'return true;')
  })
})
