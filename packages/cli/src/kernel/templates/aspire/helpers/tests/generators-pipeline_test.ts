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
      configPath: 'dotnet/AppHost/appsettings.json',
    });
    const apphost = files.find((f) => f.path === 'apphost.mts');
    assert(apphost, 'apphost.mts should exist in output');
    assertStringIncludes(apphost!.content, fixtures.FILE_HEADER);
    assertStringIncludes(apphost!.content, 'dotnet/AppHost/appsettings.json');
    assertStringIncludes(apphost!.content, './.aspire/modules/aspire.mjs');
    assertStringIncludes(apphost!.content, './.helpers/index.mjs');
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

  it('should mirror dashboard env constants in the Aspire compat helper', async () => {
    const pipeline = new HelpersGeneratorPipeline();
    const files = await pipeline.execute({ config: fixtures.POPULATED_CONFIG });
    const compat = files.find((f) => f.path === '.helpers/_aspire-compat.mts');

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
    const compat = files.find((f) => f.path === '.helpers/_aspire-compat.mts');

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
      (f) => f.path === '.helpers/config-schema.mts',
    );
    assert(configSchema, 'config-schema.mjs should exist');
    assertStringIncludes(configSchema!.content, 'users: ServiceEntrySchema');

    // Register services should include our service
    const regServices = files.find(
      (f) => f.path === '.helpers/register-services.mts',
    );
    assert(regServices, 'register-services.mjs should exist');
    assertStringIncludes(regServices!.content, "builder.addDenoApp('users'");
    assertStringIncludes(
      regServices!.content,
      "buildOtelEnvVars('users', config.Version, 'denoApp')",
    );
    // Services use addDenoApp → WithDenoDefaults already wires the OTLP
    // exporter, so the generated helper does not call withOtlpExporter.
    assert(
      !regServices!.content.includes('withOtlpExporter'),
      'addDenoApp services should not call withOtlpExporter (WithDenoDefaults handles it)',
    );
    assert(
      !regServices!.content.includes('config.Otel.HttpEndpoint'),
      'service OTEL should use Aspire-injected dashboard collector endpoint',
    );

    // Register infrastructure should include our database
    const regInfra = files.find(
      (f) => f.path === '.helpers/register-infrastructure.mts',
    );
    assert(regInfra, 'register-infrastructure.mjs should exist');
    assertStringIncludes(regInfra!.content, "builder.addPostgres('main')");

    // Register plugins should include our plugin
    const regPlugins = files.find(
      (f) => f.path === '.helpers/register-plugins.mts',
    );
    assert(regPlugins, 'register-plugins.mjs should exist');
    assertStringIncludes(regPlugins!.content, "builder.addDenoApp('auth'");
    assert(
      !regPlugins!.content.includes('withOtlpExporter'),
      'addDenoApp plugins should not call withOtlpExporter (WithDenoDefaults handles it)',
    );
    assert(
      !regPlugins!.content.includes('config.Otel.HttpEndpoint'),
      'plugin OTEL should use Aspire-injected dashboard collector endpoint',
    );

    // Register tools should include our tool
    const regTools = files.find(
      (f) => f.path === '.helpers/register-tools.mts',
    );
    assert(regTools, 'register-tools.mjs should exist');
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
      (f) => f.path === '.helpers/register-services.mts',
    );
    assert(regServices, 'register-services.mjs should exist');
    assertStringIncludes(regServices!.content, '// No services configured');

    const regInfra = files.find(
      (f) => f.path === '.helpers/register-infrastructure.mts',
    );
    assert(regInfra, 'register-infrastructure.mjs should exist');
    assertStringIncludes(regInfra!.content, '// No databases configured');

    const regApps = files.find(
      (f) => f.path === '.helpers/register-apps.mts',
    );
    assert(regApps, 'register-apps.mjs should exist');
    assertStringIncludes(regApps!.content, '// No apps configured');

    const regTools = files.find(
      (f) => f.path === '.helpers/register-tools.mts',
    );
    assert(regTools, 'register-tools.mjs should exist');
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
