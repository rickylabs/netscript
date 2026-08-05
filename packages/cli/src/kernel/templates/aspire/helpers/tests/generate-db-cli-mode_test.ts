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
    assertStringIncludes(output, '`netscript-db-${target.configKey}`')
    assertStringIncludes(output, 'DB_OPERATION_RUNNER')
    assertStringIncludes(output, '.withExplicitStart()')
    assertStringIncludes(
      output,
      'const sqliteUrl = `file:./${target.databaseName}`;',
    )
    assertStringIncludes(output, ".withEnvironment('DATABASE_URL', sqliteUrl)")
    assertStringIncludes(output, '.withEnvironment(target.envKey, sqliteUrl);')
    assertStringIncludes(output, 'resource = await resource')
    assertStringIncludes(
      output,
      "if (target.engine !== 'Sqlite' && target.resource)",
    )
    assertStringIncludes(
      output,
      ".withEnvironment('DATABASE_URL', target.resource)",
    )
    assertStringIncludes(output, '.withReference(target.resource)')
    assertStringIncludes(output, '.withReference(target.resource)')
    assertStringIncludes(output, '.waitFor(target.resource)')
  })

  it('registers operation resources without short-circuiting the resident graph', () => {
    const output = generateDbCliMode({ databases: {} })

    assertStringIncludes(output, 'export async function tryHandleDbCliMode(')
    assertStringIncludes(
      output,
      "`.netscript-db-operation-${target.configKey}.json`",
    )
    assertStringIncludes(
      output,
      "const request = JSON.parse(await Deno.readTextFile(Deno.args[0]));",
    )
    assertStringIncludes(output, 'request.NETSCRIPT_PRISMA_OPERATION')
    assertStringIncludes(output, "args: ['task', task]")
    assertStringIncludes(output, 'return false;')
  })
})
