/**
 * @module templates/aspire/helpers/generate-db-cli-mode_test
 */

import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { generateDbCliMode } from '../generate-db-cli-mode.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';

// Generator tests exercise the source asset before the embedded snapshot is
// regenerated in its own slice.
const dbCliTemplateKey = TEMPLATE_KEYS.generatedAspireHelpersGenerateDbCliMode1;
DEFAULT_TEMPLATE_REGISTRY.register(dbCliTemplateKey, {
  path: dbCliTemplateKey,
  content: await Deno.readTextFile(
    new URL(
      '../../../../assets/generated/aspire/helpers/generate-db-cli-mode-1.ts.template',
      import.meta.url,
    ),
  ),
});
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

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
    });

    assertStringIncludes(output, "'postgres': {");
    assertStringIncludes(output, "mode: 'Container'");
    assertStringIncludes(output, "envKey: 'POSTGRES_URI'");
    assertStringIncludes(output, "taskSuffix: 'postgres'");
    assertStringIncludes(
      output,
      "workdir: resolve(appHostDir, 'database', 'postgres')",
    );
    assertStringIncludes(output, "'mysql': {");
    assertStringIncludes(output, "envKey: 'MYSQL_URI'");
    assertStringIncludes(output, "taskSuffix: 'mysql'");
    assertStringIncludes(output, "'mssql': {");
    assertStringIncludes(output, "envKey: 'MSSQL_URI'");
    assertStringIncludes(output, "taskSuffix: 'mssql'");
    assertStringIncludes(output, "'sqlite': {");
    assertStringIncludes(output, "mode: 'External'");
    assertStringIncludes(output, "envKey: 'SQLITE_URI'");
    assertStringIncludes(output, "taskSuffix: 'sqlite'");
    assertStringIncludes(output, 'let resource = await builder.addExecutable(');
    assertStringIncludes(output, '`${target.configKey}-cli`');
    assertStringIncludes(output, "'--request'");
    assertStringIncludes(output, '`.netscript-db-operation-${target.configKey}.json`');
    assertStringIncludes(output, '.withExplicitStart()');
    assertStringIncludes(
      output,
      'const sqliteUrl = `file:./${target.databaseName}`;',
    );
    assertStringIncludes(output, ".withEnvironment('DATABASE_URL', sqliteUrl)");
    assertStringIncludes(output, '.withEnvironment(target.envKey, sqliteUrl);');
    assertStringIncludes(output, 'resource = await resource');
    assertStringIncludes(
      output,
      "if (target.engine !== 'Sqlite' && target.resource)",
    );
    assertStringIncludes(
      output,
      ".withEnvironment('DATABASE_URL', target.resource)",
    );
    assertStringIncludes(output, '.withReference(target.resource)');
    assertStringIncludes(output, '.withReference(target.resource)');
    assertStringIncludes(output, '.waitFor(target.resource)');
  });

  it('registers typed migrate, seed, and reset commands through the runtime tool edge', () => {
    const output = generateDbCliMode({ databases: {} });

    assertStringIncludes(output, "type DbCliOperation = 'migrate' | 'seed' | 'reset'");
    assertStringIncludes(output, "{ name: 'migrate', displayName: 'Migrate database'");
    assertStringIncludes(output, "{ name: 'seed', displayName: 'Seed database'");
    assertStringIncludes(output, "{ name: 'reset', displayName: 'Reset database'");
    assertStringIncludes(output, 'await resource.withCommand(');
    assertEquals(output.match(/await resource\.withCommand\(/g)?.length ?? 0, 1);
    assertStringIncludes(output, 'const args = await context.arguments()');
    assertStringIncludes(output, "await args.requiredValue('timeout')");
    assertStringIncludes(output, "await args.value('confirm') !== 'true'");
    assertStringIncludes(output, 'inputType: InputType.Number');
    assertStringIncludes(output, 'inputType: InputType.Boolean');
    assertStringIncludes(output, 'iconName: command.iconName');
    assertStringIncludes(
      output,
      'infrastructure.databaseConnectionStrings.get(',
    );
    assertStringIncludes(output, 'return await executeDbTool(');
    assertStringIncludes(output, "'aspire', '.helpers', 'run-tool.mts'");
    assertStringIncludes(output, "const child = spawn(\n    'deno'");
  });

  it('retains the configuration resolver only for External typed commands', () => {
    const output = generateDbCliMode({ databases: {} });

    assertStringIncludes(
      output,
      'infrastructure.databaseConnectionStrings.get(',
    );
    assertStringIncludes(output, 'databaseUrl = await resolveConnectionString()');
    assertStringIncludes(output, 'target.configKey,');
    assert(!output.includes('builder.getConfiguration().getConnectionString('));
  });

  it('runs Container typed commands through the graph-injected executable resource', () => {
    const output = generateDbCliMode({ databases: {} });

    assertStringIncludes(
      output,
      "if (target.mode === 'Container' && target.engine !== 'Sqlite')",
    );
    assertStringIncludes(output, 'return await executeDbCliResource(');
    assertStringIncludes(output, "const child = spawn(\n      'aspire'");
    assertStringIncludes(
      output,
      "'resource',\n        `${target.configKey}-cli`,\n        'start'",
    );
    const resultRead = output.indexOf('const result = await readDbCliResult(resultPath);');
    const nonzeroFallback = output.indexOf('if (startExitCode !== 0)');
    assert(resultRead !== -1);
    assert(nonzeroFallback !== -1);
    assert(resultRead < nonzeroFallback);
    assertStringIncludes(output, ".withEnvironment('DATABASE_URL', target.resource)");
    assertStringIncludes(output, '.withReference(target.resource)');
    assertStringIncludes(output, '.waitFor(target.resource)');
    assert(!output.includes('connectionStringExpression()'));
    assert(!output.includes('.getValue()'));
  });

  it('rejects reset without confirmation before resolving or invoking runtime IO', () => {
    const output = generateDbCliMode({ databases: {} });
    const confirmation = output.indexOf("command.name === 'reset'");
    const connection = output.indexOf(
      'infrastructure.databaseConnectionStrings.get(',
    );
    const mutation = output.indexOf('await executeDbTool(');

    assert(confirmation > 0);
    assert(connection > confirmation);
    assert(mutation > connection);
    assertStringIncludes(output, 'no mutation was started');
  });

  it('uses the shared emitted tool runner and named MCP-exclusion default', async () => {
    const [runTool, aspireCompat] = await Promise.all([
      Deno.readTextFile(
        new URL('../../../../assets/aspire/helpers/run-tool.ts.template', import.meta.url),
      ),
      Deno.readTextFile(
        new URL('../../../../assets/aspire/helpers/_aspire-compat.ts.template', import.meta.url),
      ),
    ]);

    assertStringIncludes(runTool, 'export async function runTool(');
    assertStringIncludes(runTool, 'readonly timeoutSeconds?: number');
    assertStringIncludes(runTool, 'readonly actionableStderr: readonly string[]');
    assertStringIncludes(runTool, 'readonly actionableStdout: readonly string[]');
    assertStringIncludes(runTool, 'stripVTControlCharacters(line)');
    assertStringIncludes(runTool, "child.kill('SIGTERM')");
    assertStringIncludes(aspireCompat, 'DbCliModeExcludeFromMcp: true');
  });

  it('registers CLI resources without short-circuiting the resident graph', () => {
    const output = generateDbCliMode({ databases: {} });

    assertStringIncludes(output, 'export async function tryHandleDbCliMode(');
    assertStringIncludes(output, 'await resource.withCommand(');
    assert(!output.includes('DB_OPERATION_RUNNER'));
    assertStringIncludes(output, "'aspire', '.helpers', 'run-tool.mts'");
    assertStringIncludes(output, 'return false;');
    assertStringIncludes(output, "message: [result.message, ...context].join(' | ')");
  });

  it('excludes exactly the generated database CLI resource from MCP exposure', () => {
    const output = generateDbCliMode({
      databases: {
        postgres: {
          Enabled: true,
          Engine: 'Postgres',
          Mode: 'Container',
          DatabaseName: 'app-db',
          Persistent: true,
        },
      },
    });

    assertStringIncludes(output, '`${target.configKey}-cli`');
    assertEquals(output.match(/\.excludeFromMcp\(\)/g)?.length ?? 0, 1);
    assertStringIncludes(output, 'RESOURCE_DEFAULTS.DbCliModeExcludeFromMcp');
    assert(!output.includes('.withHidden('));
    const cliResource = output.indexOf('`${target.configKey}-cli`');
    const exclusion = output.indexOf('.excludeFromMcp()');
    assert(cliResource > 0);
    assert(exclusion > cliResource);
  });
});
