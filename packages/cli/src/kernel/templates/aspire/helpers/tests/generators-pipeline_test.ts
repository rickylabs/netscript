/**
 * @module templates/aspire/helpers/generators-pipeline_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { generateHelpers, HelpersGeneratorPipeline } from '../helpers-generator-pipeline.ts';
import * as fixtures from './generators-test-support.ts';

describe('HelpersGeneratorPipeline', () => {
  it('should generate all 12 files with apphost enabled (default)', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    assertEquals(files.length, 12);
  });

  it('should generate 11 files without apphost', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({
      config: fixtures.POPULATED_CONFIG,
      generateAppHost: false,
    });
    assertEquals(files.length, 11);
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

  it('should use correct .helpers/ output paths for all helpers files', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const paths = files.map((f) => f.path);

    const expectedHelpersPaths = [
      '.helpers/configure-dashboard.ts',
      '.helpers/config-schema.ts',
      '.helpers/register-infrastructure.ts',
      '.helpers/db-cli-mode.ts',
      '.helpers/register-services.ts',
      '.helpers/register-plugins.ts',
      '.helpers/register-background.ts',
      '.helpers/register-apps.ts',
      '.helpers/register-tools.ts',
      '.helpers/index.ts',
    ];

    for (const expected of expectedHelpersPaths) {
      assert(
        paths.includes(expected),
        `Missing expected path: ${expected} (got: ${paths.join(', ')})`,
      );
    }
  });

  it('should include apphost.ts at root level (not in .helpers/)', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const paths = files.map((f) => f.path);
    assert(paths.includes('apphost.ts'), 'should include apphost.ts at root');
    assert(
      !paths.includes('.helpers/apphost.ts'),
      'apphost.ts should NOT be inside .helpers/',
    );
  });

  it('should not include apphost.ts when generateAppHost is false', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({
      config: fixtures.POPULATED_CONFIG,
      generateAppHost: false,
    });
    const paths = files.map((f) => f.path);
    assert(!paths.includes('apphost.ts'), 'should not include apphost.ts');
  });

  it('should render apphost.ts with correct template variables', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({
      config: fixtures.POPULATED_CONFIG,
      configPath: 'dotnet/AppHost/appsettings.json',
    });
    const apphost = files.find((f) => f.path === 'apphost.ts');
    assert(apphost, 'apphost.ts should exist in output');
    assertStringIncludes(apphost!.content, fixtures.FILE_HEADER);
    assertStringIncludes(apphost!.content, 'dotnet/AppHost/appsettings.json');
    assertStringIncludes(apphost!.content, './.modules/aspire.ts');
    assertStringIncludes(apphost!.content, './.helpers/index.ts');
    assertStringIncludes(apphost!.content, 'createBuilder()');
    assertStringIncludes(apphost!.content, 'createNetScriptAppHost');
  });

  it('should include configure-dashboard.ts from Tier 2 template', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const dashboard = files.find(
      (f) => f.path === '.helpers/configure-dashboard.ts',
    );
    assert(dashboard, 'configure-dashboard.ts should exist in output');
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

  it('should mirror dashboard env constants in the Aspire compat helper', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const compat = files.find((f) => f.path === '.helpers/_aspire-compat.ts');

    assert(compat, 'compat helper should exist in output');
    assertStringIncludes(
      compat!.content,
      "OTLP_HTTP_ENDPOINT: 'ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL'",
    );
    assertStringIncludes(
      compat!.content,
      "ALLOW_UNSECURED_TRANSPORT: 'ASPIRE_ALLOW_UNSECURED_TRANSPORT'",
    );
    assertStringIncludes(
      compat!.content,
      "UNSECURED_ALLOW_ANONYMOUS: 'ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS'",
    );
  });

  it('should include the Aspire compat helper with VITE env-var export', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const compat = files.find((f) => f.path === '.helpers/_aspire-compat.ts');

    assert(compat, 'compat helper should exist in output');
    assertStringIncludes(compat!.content, 'export function buildViteEnvVarName(');
    assertStringIncludes(compat!.content, 'VITE_services__${resourceName}__${endpointName}__0');
    assertStringIncludes(compat!.content, 'VITE_${normalised}_URL');
  });

  it('should pass populated config through to Tier 1 generator content', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });

    // Config schema should include our service key
    const configSchema = files.find(
      (f) => f.path === '.helpers/config-schema.ts',
    );
    assert(configSchema, 'config-schema.ts should exist');
    assertStringIncludes(configSchema!.content, 'users: ServiceEntrySchema');

    // Register services should include our service
    const regServices = files.find(
      (f) => f.path === '.helpers/register-services.ts',
    );
    assert(regServices, 'register-services.ts should exist');
    assertStringIncludes(regServices!.content, "builder.addExecutable('users'");

    // Register infrastructure should include our database
    const regInfra = files.find(
      (f) => f.path === '.helpers/register-infrastructure.ts',
    );
    assert(regInfra, 'register-infrastructure.ts should exist');
    assertStringIncludes(regInfra!.content, "builder.addPostgres('main')");

    // Register plugins should include our plugin
    const regPlugins = files.find(
      (f) => f.path === '.helpers/register-plugins.ts',
    );
    assert(regPlugins, 'register-plugins.ts should exist');
    assertStringIncludes(regPlugins!.content, "builder.addExecutable('auth'");

    // Register tools should include our tool
    const regTools = files.find(
      (f) => f.path === '.helpers/register-tools.ts',
    );
    assert(regTools, 'register-tools.ts should exist');
    assertStringIncludes(
      regTools!.content,
      "builder.addExecutable('prisma-studio'",
    );
  });

  it('should handle empty config producing valid no-op output', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.EMPTY_CONFIG });
    assertEquals(files.length, 12);

    const regServices = files.find(
      (f) => f.path === '.helpers/register-services.ts',
    );
    assert(regServices, 'register-services.ts should exist');
    assertStringIncludes(regServices!.content, '// No services configured');

    const regInfra = files.find(
      (f) => f.path === '.helpers/register-infrastructure.ts',
    );
    assert(regInfra, 'register-infrastructure.ts should exist');
    assertStringIncludes(regInfra!.content, '// No databases configured');

    const regApps = files.find(
      (f) => f.path === '.helpers/register-apps.ts',
    );
    assert(regApps, 'register-apps.ts should exist');
    assertStringIncludes(regApps!.content, '// No apps configured');

    const regTools = files.find(
      (f) => f.path === '.helpers/register-tools.ts',
    );
    assert(regTools, 'register-tools.ts should exist');
    assertStringIncludes(regTools!.content, '// No tools configured');
  });
});
// generateHelpers convenience function
// --------------------------------------------------------------------------

describe('generateHelpers', () => {
  it('should return the same file count as pipeline.execute()', async () => {
    const files = await generateHelpers({ config: fixtures.POPULATED_CONFIG });
    assertEquals(files.length, 12);
  });

  it('should support generateAppHost: false', async () => {
    const files = await generateHelpers({
      config: fixtures.POPULATED_CONFIG,
      generateAppHost: false,
    });
    assertEquals(files.length, 11);
    const paths = files.map((f) => f.path);
    assert(!paths.includes('apphost.ts'));
  });

  it('should produce valid generated files with non-empty content', async () => {
    const files = await generateHelpers({ config: fixtures.POPULATED_CONFIG });
    for (const file of files) {
      assert(file.path.length > 0, 'path should not be empty');
      assert(file.content.length > 0, `content empty for ${file.path}`);
    }
  });
});
