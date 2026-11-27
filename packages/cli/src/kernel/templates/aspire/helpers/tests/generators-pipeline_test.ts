/**
 * @module templates/aspire/helpers/generators-pipeline_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals, assertStringIncludes, assertThrows } from 'jsr:@std/assert@^1';
import { generateHelpers, HelpersGeneratorPipeline } from '../helpers-generator-pipeline.ts';
import {
  assertHelperImportsEmitted,
  writeGeneratedHelperFixture,
} from './generated-helper-fixture.ts';
import { join } from '@std/path';
import * as fixtures from './generators-test-support.ts';

describe('HelpersGeneratorPipeline', () => {
  it('should generate all AppHost project files when enabled', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    assertEquals(files.length, 16);
  });

  it('should generate 15 files without apphost', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({
      config: fixtures.POPULATED_CONFIG,
      generateAppHost: false,
    });
    assertEquals(files.length, 15);
  });

  it('should produce files with non-empty paths and content', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    for (const file of files) {
      assert(file.path.length > 0, `File path should not be empty`);
      assert(
        file.content.length > 0,
        `File content should not be empty for ${file.path}`,
      );
    }
  });

  it('threads SQLite FFI to every permission-bearing register output', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({
      config: {
        ...fixtures.POPULATED_CONFIG,
        PrimaryDatabase: 'main',
        Databases: {
          main: { ...fixtures.MINIMAL_DATABASE, Engine: 'Sqlite' },
        },
      },
    });
    const permissionBearingPaths = [
      '.helpers/register-services.mts',
      '.helpers/register-plugins.mts',
      '.helpers/register-background.mts',
    ];

    for (const path of permissionBearingPaths) {
      const generated = files.find((file) => file.path === path);
      assert(generated, `${path} should be generated`);
      assertEquals(
        generated.content.match(/--allow-ffi/g)?.length,
        1,
        `${path} should contain SQLite FFI exactly once`,
      );
    }
  });

  it('should emit local import specifiers that resolve to generated files', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const generatedPaths = new Set(files.map((file) => `/aspire/${file.path}`));

    for (const file of files) {
      const importSpecifiers = file.content.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g);
      for (const match of importSpecifiers) {
        const specifier = match[1];
        if (specifier.includes('/.aspire/modules/')) continue;

        const resolvedPath = new URL(specifier, `file:///aspire/${file.path}`).pathname;
        assert(
          generatedPaths.has(resolvedPath),
          `${file.path} imports ${specifier}, but ${resolvedPath} was not generated`,
        );
      }
    }
  });

  it('should use correct .helpers/ output paths for all helpers files', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const paths = files.map((f) => f.path);

    const expectedHelpersPaths = [
      '.helpers/configure-dashboard.mts',
      '.helpers/config-schema.mts',
      '.helpers/register-infrastructure.mts',
      '.helpers/db-cli-mode.mts',
      '.helpers/register-services.mts',
      '.helpers/register-plugins.mts',
      '.helpers/register-background.mts',
      '.helpers/register-apps.mts',
      '.helpers/register-tools.mts',
      '.helpers/index.mts',
    ];

    for (const expected of expectedHelpersPaths) {
      assert(
        paths.includes(expected),
        `Missing expected path: ${expected} (got: ${paths.join(', ')})`,
      );
    }
  });

  it('should include apphost.mts at root level (not in .helpers/)', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const paths = files.map((f) => f.path);
    assert(paths.includes('apphost.mts'), 'should include apphost.mts at root');
    assert(
      !paths.includes('.helpers/apphost.mts'),
      'apphost.mts should NOT be inside .helpers/',
    );
  });

  it('must not generate a second DB-operation AppHost over resident data', async () => {
    const files = await generateHelpers({ config: fixtures.POPULATED_CONFIG });
    assert(
      files.every((file) => !file.path.startsWith('db-operation/')),
      'a database command must use the resident AppHost resource graph',
    );
  });

  it('should not include apphost.mts when generateAppHost is false', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({
      config: fixtures.POPULATED_CONFIG,
      generateAppHost: false,
    });
    const paths = files.map((f) => f.path);
    assert(!paths.includes('apphost.mts'), 'should not include apphost.mts');
  });

  it('should render apphost.mts with correct template variables', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({
      config: fixtures.POPULATED_CONFIG,
      configPath: '../appsettings.json',
    });
    const apphost = files.find((f) => f.path === 'apphost.mts');
    assert(apphost, 'apphost.mts should exist in output');
    assertStringIncludes(apphost!.content, fixtures.FILE_HEADER);
    assertStringIncludes(apphost!.content, '../appsettings.json');
    assertStringIncludes(apphost!.content, './.aspire/modules/aspire.mts');
    assertStringIncludes(apphost!.content, './.helpers/index.mts');
    assertStringIncludes(apphost!.content, 'createBuilder()');
    assertStringIncludes(apphost!.content, 'createNetScriptAppHost');
  });

  it('should include configure-dashboard.mts from Tier 2 template', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const dashboard = files.find(
      (f) => f.path === '.helpers/configure-dashboard.mts',
    );
    assert(dashboard, 'configure-dashboard.mts should exist in output');
    assertStringIncludes(dashboard!.content, 'export function configureDashboard');
    assertStringIncludes(
      dashboard!.content,
      'DASHBOARD_ENV_VARS.OTLP_HTTP_ENDPOINT',
    );
    assertStringIncludes(
      dashboard!.content,
      'DASHBOARD_ENV_VARS.ALLOW_UNSECURED_TRANSPORT',
    );
    assertStringIncludes(
      dashboard!.content,
      'DASHBOARD_ENV_VARS.UNSECURED_ALLOW_ANONYMOUS',
    );
    assertStringIncludes(dashboard!.content, "'true'");
  });

  it('should re-export canonical @netscript/aspire contracts without D-7 duplication', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const compat = files.find((f) => f.path === '.helpers/_aspire-compat.mts');
    const readiness = files.find((f) => f.path === '.helpers/_apphost-readiness.mts');
    const postgresReadiness = files.find(
      (f) => f.path === '.helpers/_apphost-postgres-readiness.mts',
    );

    assert(compat, 'compat helper should exist in output');
    assert(readiness, 'readiness helper should exist in output');
    assert(postgresReadiness, 'postgres readiness helper should exist in output');
    assertStringIncludes(compat!.content, "from '@netscript/aspire/config'");
    assertStringIncludes(compat!.content, "from '@netscript/aspire/constants'");
    assertStringIncludes(compat!.content, "from '@netscript/aspire/types'");
    assertStringIncludes(compat!.content, "from '@netscript/aspire/application'");
    assertStringIncludes(compat!.content, "from './_apphost-readiness.mts'");
    assertStringIncludes(compat!.content, "from './_apphost-postgres-readiness.mts'");
    assertStringIncludes(compat!.content, 'DASHBOARD_ENV_VARS');
    assertStringIncludes(compat!.content, 'buildViteEnvVarName');
    assertStringIncludes(compat!.content, 'NetScriptConfigSchema');
    assertStringIncludes(compat!.content, 'export function buildDatabaseProviderEnvVars(');
    assertStringIncludes(compat!.content, 'DATABASE_PROVIDER: config.PrimaryDatabase');
    assertStringIncludes(compat!.content, 'export function buildSqliteDatabaseUrl(');
    assertStringIncludes(compat!.content, 'pathToFileURL(');
    assert(!compat!.content.includes('D-7 workaround'));
    assert(!compat!.content.includes('export interface NetScriptConfig'));
    assert(
      compat!.content.split('\n').length < 350,
      'F-1: _aspire-compat.mts must stay under 350 LOC',
    );
    assert(
      readiness!.content.split('\n').length < 350,
      'F-1: _apphost-readiness.mts must stay under 350 LOC',
    );
    assert(
      postgresReadiness!.content.split('\n').length < 350,
      'F-1: _apphost-postgres-readiness.mts must stay under 350 LOC',
    );
  });

  it('should bound best-effort Garnet tool restore', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const compat = files.find((f) => f.path === '.helpers/_aspire-compat.mts');

    assert(compat, 'compat helper should exist in output');
    assertStringIncludes(compat!.content, 'GARNET_TOOL_RESTORE_TIMEOUT_MS = 10_000');
    assertStringIncludes(compat!.content, 'timeout: GARNET_TOOL_RESTORE_TIMEOUT_MS');
  });

  it('should pass populated config through to Tier 1 generator content', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });

    // Config schema should include our service key
    const configSchema = files.find(
      (f) => f.path === '.helpers/config-schema.mts',
    );
    assert(configSchema, 'config-schema.mts should exist');
    assertStringIncludes(configSchema!.content, 'users: asZodSchema(ServiceEntrySchema)');

    // Register services should include our service
    const regServices = files.find(
      (f) => f.path === '.helpers/register-services.mts',
    );
    assert(regServices, 'register-services.mts should exist');
    assertStringIncludes(regServices!.content, "builder.addExecutable('users'");
    assertStringIncludes(
      regServices!.content,
      "buildOtelEnvVars('users', config.Version, 'executable')",
    );
    assertStringIncludes(
      regServices!.content,
      'withOtlpExporter({ protocol: OtlpProtocol.HttpProtobuf })',
    );
    assert(
      !regServices!.content.includes('config.Otel.HttpEndpoint'),
      'service OTEL should use Aspire-injected dashboard collector endpoint',
    );

    // Register infrastructure should include our database
    const regInfra = files.find(
      (f) => f.path === '.helpers/register-infrastructure.mts',
    );
    assert(regInfra, 'register-infrastructure.mts should exist');
    assertStringIncludes(regInfra!.content, 'builder.addPostgres("main", {');
    assertStringIncludes(regInfra!.content, 'ensureDatabasePassword(appHostDir, "main")');

    // Register plugins should include our plugin
    const regPlugins = files.find(
      (f) => f.path === '.helpers/register-plugins.mts',
    );
    assert(regPlugins, 'register-plugins.mts should exist');
    assertStringIncludes(regPlugins!.content, 'builder.addExecutable("auth"');
    assertStringIncludes(
      regPlugins!.content,
      'withOtlpExporter({ protocol: OtlpProtocol.HttpProtobuf })',
    );
    assert(
      !regPlugins!.content.includes('config.Otel.HttpEndpoint'),
      'plugin OTEL should use Aspire-injected dashboard collector endpoint',
    );

    // Register tools should include our tool
    const regTools = files.find(
      (f) => f.path === '.helpers/register-tools.mts',
    );
    assert(regTools, 'register-tools.mts should exist');
    assertStringIncludes(
      regTools!.content,
      'builder.addExecutable("prisma-studio"',
    );
  });

  it('should handle empty config producing valid no-op output', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.EMPTY_CONFIG });
    assertEquals(files.length, 16);

    const regServices = files.find(
      (f) => f.path === '.helpers/register-services.mts',
    );
    assert(regServices, 'register-services.mts should exist');
    assertStringIncludes(regServices!.content, '// No services configured');

    const regInfra = files.find(
      (f) => f.path === '.helpers/register-infrastructure.mts',
    );
    assert(regInfra, 'register-infrastructure.mts should exist');
    assertStringIncludes(regInfra!.content, '// No databases configured');

    const regApps = files.find(
      (f) => f.path === '.helpers/register-apps.mts',
    );
    assert(regApps, 'register-apps.mts should exist');
    assertStringIncludes(regApps!.content, '// No apps configured');

    const regTools = files.find(
      (f) => f.path === '.helpers/register-tools.mts',
    );
    assert(regTools, 'register-tools.mts should exist');
    assertStringIncludes(regTools!.content, 'No development tools are configured.');
    assertStringIncludes(regTools!.content, 'return Promise.resolve();');
  });
});
// generateHelpers convenience function
// --------------------------------------------------------------------------

describe('generateHelpers', () => {
  it('should return the same file count as pipeline.execute()', async () => {
    const files = await generateHelpers({ config: fixtures.POPULATED_CONFIG });
    assertEquals(files.length, 16);
  });

  it('should support generateAppHost: false', async () => {
    const files = await generateHelpers({
      config: fixtures.POPULATED_CONFIG,
      generateAppHost: false,
    });
    assertEquals(files.length, 15);
    const paths = files.map((f) => f.path);
    assert(!paths.includes('apphost.mts'));
  });

  it('should produce valid generated files with non-empty content', async () => {
    const files = await generateHelpers({ config: fixtures.POPULATED_CONFIG });
    for (const file of files) {
      assert(file.path.length > 0, 'path should not be empty');
      assert(file.content.length > 0, `content empty for ${file.path}`);
    }
  });
});

Deno.test('canonical helper fixtures emit every generated relative import, including new dependencies', async () => {
  const root = await Deno.makeTempDir({ prefix: 'canonical-helper-fixture-' });
  try {
    const files = await writeGeneratedHelperFixture(root, fixtures.POPULATED_CONFIG);
    for (const file of files) {
      assertEquals(await Deno.readTextFile(join(root, file.path)), file.content);
    }
    assertHelperImportsEmitted(files);
    const omitted = files.filter((file) => file.path !== '.helpers/installation-secret.mts');
    const error = assertThrows(() => assertHelperImportsEmitted(omitted), Error);
    assertStringIncludes(error.message, 'installation-secret.mts');

    const future = {
      path: '.helpers/future.mts',
      content: "export { value } from './future-dependency.mts';\n",
    };
    assertThrows(() => assertHelperImportsEmitted([...files, future]));
    assertHelperImportsEmitted([...files, future, {
      path: '.helpers/future-dependency.mts',
      content: 'export const value = 1;\n',
    }]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
