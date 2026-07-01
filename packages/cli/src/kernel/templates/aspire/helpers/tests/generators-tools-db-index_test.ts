/**
 * @module templates/aspire/helpers/generators-tools-db-index_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertStringIncludes } from 'jsr:@std/assert@^1';
import type { ToolEntry } from '@netscript/aspire/types';
import { generateRegisterTools } from '../register/generate-register-tools.ts';
import { generateDbCliMode } from '../generate-db-cli-mode.ts';
import { generateIndex } from '../generate-index.ts';
import * as fixtures from './generators-test-support.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';

// These generators read templates synchronously, which requires a previously-
// awaited registry hydration. The tests exercise them directly (outside the CLI
// dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

describe('generateRegisterTools', () => {
  it('should return a non-empty string', () => {
    const output = generateRegisterTools({
      tools: { 'prisma-studio': fixtures.MINIMAL_TOOL },
    });
    assert(output.length > 0);
  });

  it('should include the standard file header', () => {
    const output = generateRegisterTools({ tools: {} });
    assertStringIncludes(output, fixtures.FILE_HEADER);
    assertStringIncludes(output, 'register-tools.mts');
  });

  it('should export registerTools async function', () => {
    const output = generateRegisterTools({ tools: {} });
    assertStringIncludes(output, 'export async function registerTools(');
  });

  it('should import resolveWorkspacePath from _aspire-compat', () => {
    const output = generateRegisterTools({ tools: {} });
    assertStringIncludes(output, 'buildDatabaseUriEnvKey');
    assertStringIncludes(output, 'resolveWorkspacePath');
    assertStringIncludes(output, "from './_aspire-compat.mjs'");
  });

  it('should register tools via addExecutable with deno task', () => {
    const output = generateRegisterTools({
      tools: { 'prisma-studio': fixtures.MINIMAL_TOOL },
    });
    assertStringIncludes(
      output,
      "builder.addExecutable('prisma-studio', 'deno', prisma_studio_workdir, ['task', '--minimum-dependency-age=0', 'studio'])",
    );
    assertStringIncludes(
      output,
      "prisma_studio = await maybeWithProcessCommand(prisma_studio, 'prisma-studio', 'studio');",
    );
    assertStringIncludes(output, "const PROCESS_COMMANDS_FLAG = 'NETSCRIPT_ASPIRE_PROCESS_COMMANDS'");
    assertStringIncludes(output, 'Aspire 13.4 WithProcessCommand seam');
  });

  it('should use resource name as TaskName fallback', () => {
    const toolNoTaskName: ToolEntry = { Enabled: true };
    const output = generateRegisterTools({
      tools: { migrate: toolNoTaskName },
    });
    assertStringIncludes(output, "['task', '--minimum-dependency-age=0', 'migrate']");
  });

  it('should convert hyphenated names to safe identifiers', () => {
    const output = generateRegisterTools({
      tools: { 'prisma-studio': fixtures.MINIMAL_TOOL },
    });
    assertStringIncludes(output, 'prisma_studio_workdir');
    assertStringIncludes(output, 'let prisma_studio = await builder.addExecutable');
  });

  it('should include enabled gate for each tool', () => {
    const output = generateRegisterTools({
      tools: { 'prisma-studio': fixtures.MINIMAL_TOOL },
    });
    assertStringIncludes(
      output,
      "config.Tools['prisma-studio']?.Enabled !== false",
    );
  });

  it('should use named database dependency when configured', () => {
    const output = generateRegisterTools({
      tools: { 'prisma-studio': fixtures.MINIMAL_TOOL },
    });
    assertStringIncludes(output, '// Named database dependency: main');
    assertStringIncludes(
      output,
      "prisma_studio = await attachToolDatabase(prisma_studio, config, infrastructure, 'main');",
    );
    assertStringIncludes(
      output,
      "const prisma_studio_workdir = resolvePrismaStudioWorkdir(appHostDir, config, 'main');",
    );
  });

  it('should fall back to primary database when no named database', () => {
    const toolNoDB: ToolEntry = { Enabled: true, TaskName: 'lint' };
    const output = generateRegisterTools({
      tools: { lint: toolNoDB },
    });
    assertStringIncludes(output, '// Primary database dependency (fallback)');
    assertStringIncludes(
      output,
      'lint = await attachToolDatabase(lint, config, infrastructure);',
    );
  });

  it('should inject database URL for database-backed tools', () => {
    const output = generateRegisterTools({
      tools: { 'prisma-studio': fixtures.MINIMAL_TOOL },
    });
    assertStringIncludes(
      output,
      ".withEnvironment('DATABASE_URL', databaseResource)",
    );
    assertStringIncludes(output, 'buildDatabaseUriEnvKey(config)');
    assertStringIncludes(output, '.withReference(databaseResource)');
    assertStringIncludes(output, '.waitFor(databaseResource)');
  });

  it('should resolve Prisma Studio to the database workspace', () => {
    const output = generateRegisterTools({
      tools: { 'prisma-studio': fixtures.MINIMAL_TOOL },
    });
    assertStringIncludes(output, 'function resolvePrismaStudioWorkdir(');
    assertStringIncludes(
      output,
      'return resolveWorkspacePath(appHostDir, `database/${toolEngineDir(databaseConfig.Engine)}`);',
    );
  });

  it('should handle empty tools', () => {
    const output = generateRegisterTools({ tools: {} });
    assertStringIncludes(output, '// No tools configured');
  });
});
// generateDbCliMode
// --------------------------------------------------------------------------

describe('generateDbCliMode', () => {
  it('should generate targets for all configured database engines', () => {
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
    assertStringIncludes(output, "taskSuffix: 'postgres'");
    assertStringIncludes(output, "workdir: resolve(appHostDir, 'database', 'postgres')");
    assertStringIncludes(output, "'mysql': {");
    assertStringIncludes(output, "taskSuffix: 'mysql'");
    assertStringIncludes(output, "'mssql': {");
    assertStringIncludes(output, "taskSuffix: 'mssql'");
    assertStringIncludes(output, "'sqlite': {");
    assertStringIncludes(output, "taskSuffix: 'sqlite'");
  });

  it('should short-circuit AppHost startup when a Prisma operation is present', () => {
    const output = generateDbCliMode({ databases: {} });

    assertStringIncludes(output, 'export async function tryHandleDbCliMode(');
    assertStringIncludes(output, 'const configuration = await builder.getConfiguration();');
    assertStringIncludes(output, 'const configured = await configuration.getConfigValue(key);');
    assertStringIncludes(output, "'prisma-operation',");
    assertStringIncludes(output, 'await configuration.getConfigValue(key)');
    assertStringIncludes(output, 'configured ?? process.env[envName]');
    assertStringIncludes(output, "'NETSCRIPT_PRISMA_OPERATION'");
    assertStringIncludes(output, "'NETSCRIPT_PRISMA_TARGET'");
    assertStringIncludes(output, "'NETSCRIPT_PRISMA_NAME'");
    assertStringIncludes(output, 'return false;');
    assertStringIncludes(output, 'return true;');
  });
});
// generateIndex
// --------------------------------------------------------------------------

describe('generateIndex', () => {
  it('should return a non-empty string', () => {
    const output = generateIndex();
    assert(output.length > 0);
  });

  it('should include the standard file header', () => {
    const output = generateIndex();
    assertStringIncludes(output, fixtures.FILE_HEADER);
    assertStringIncludes(output, 'index.mts');
  });

  it('should export createNetScriptAppHost async function with correct params', () => {
    const output = generateIndex();
    assertStringIncludes(output, 'export async function createNetScriptAppHost(');
    assertStringIncludes(output, 'builder: DistributedApplicationBuilder');
    assertStringIncludes(output, 'configPath: string');
  });

  it('should import parseAppSettings from _aspire-compat', () => {
    const output = generateIndex();
    assertStringIncludes(
      output,
      "import { parseAppSettings } from './_aspire-compat.mjs'",
    );
  });

  it('should import DistributedApplicationBuilder from SDK module', () => {
    const output = generateIndex();
    assertStringIncludes(
      output,
      "import type { DistributedApplicationBuilder } from '../.aspire/modules/aspire.mjs'",
    );
  });

  it('should include all registration phase imports', () => {
    const output = generateIndex();
    assertStringIncludes(
      output,
      "import { configureDashboard } from './configure-dashboard.mjs'",
    );
    assertStringIncludes(
      output,
      "import { registerInfrastructure } from './register-infrastructure.mjs'",
    );
    assertStringIncludes(
      output,
      "import { registerServices } from './register-services.mjs'",
    );
    assertStringIncludes(
      output,
      "import { registerPlugins } from './register-plugins.mjs'",
    );
    assertStringIncludes(
      output,
      "import { registerBackgroundProcessors } from './register-background.mjs'",
    );
    assertStringIncludes(
      output,
      "import { registerApps } from './register-apps.mjs'",
    );
    assertStringIncludes(
      output,
      "import { registerTools } from './register-tools.mjs'",
    );
  });

  it('should follow correct registration order in function body', () => {
    const output = generateIndex();
    const dashboardIdx = output.indexOf('configureDashboard(config)');
    const infraIdx = output.indexOf('registerInfrastructure(builder');
    const servicesIdx = output.indexOf('registerServices(builder');
    const pluginsIdx = output.indexOf('registerPlugins(builder');
    const backgroundIdx = output.indexOf('registerBackgroundProcessors(builder');
    const appsIdx = output.indexOf('registerApps(builder');
    const toolsIdx = output.indexOf('registerTools(builder, config, infrastructure, appHostDir)');

    assert(dashboardIdx > 0, 'configureDashboard should be in body');
    assert(infraIdx > dashboardIdx, 'infrastructure should follow dashboard');
    assert(servicesIdx > infraIdx, 'services should follow infrastructure');
    assert(pluginsIdx > servicesIdx, 'plugins should follow services');
    assert(backgroundIdx > pluginsIdx, 'background should follow plugins');
    assert(appsIdx > backgroundIdx, 'apps should follow background');
    assert(toolsIdx > appsIdx, 'tools should follow apps');
  });

  it('should parse config via parseAppSettings in function body', () => {
    const output = generateIndex();
    assertStringIncludes(output, 'await parseAppSettings(configPath)');
    // apphost.mts lives in an isolated `aspire/` subfolder, so we shift
    // appHostDir up one level to the project root where services, apps,
    // and plugins declared in appsettings.json actually live.
    assertStringIncludes(
      output,
      "const appHostDir = resolve(await builder.appHostDirectory(), '..')",
    );
  });
});
// HelpersGeneratorPipeline
// --------------------------------------------------------------------------
