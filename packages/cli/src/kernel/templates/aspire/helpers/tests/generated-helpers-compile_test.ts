/**
 * @module templates/aspire/helpers/generated-helpers-compile_test
 *
 * Compiles the complete emitted AppHost helper suite (addDenoApp services/plugins/
 * background/apps, all 3 container DB .withRepl() engines, caches, tools, db-cli-mode,
 * config-schema, apphost.mts) against the unmodified recorded Aspire 17.0.0 SDK.
 */

import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { join, resolve } from '@std/path';
import { checkGeneratedFiles } from '../../../../../../../../.llm/tools/testing/check-generated-files.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../../../constants/scaffold/scaffold-app-catalog.ts';
import { writeGeneratedHelperFixture } from './generated-helper-fixture.ts';
import {
  APP_WITH_REFS,
  BACKGROUND_NO_TELEMETRY,
  BACKGROUND_WITH_CONCURRENCY,
  DATABASE_EXTERNAL,
  DATABASE_WITH_OPTIONS,
  DESKTOP_APP,
  MINIMAL_BACKGROUND,
  MINIMAL_DENO_DEFAULTS,
  MINIMAL_PLUGIN,
  MINIMAL_SERVICE,
  MINIMAL_TOOL,
  PLUGIN_WITH_REFS,
  SERVICE_WITH_PLUGIN_REFS,
  SERVICE_WITH_REFS,
  TASK_APP,
  TAURI_APP,
} from './generators-test-support.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

const SDK_FILES = ['aspire.mts', 'base.mts', 'transport.mts'] as const;

async function restoreRecordedSdk(modulesDir: string): Promise<void> {
  const compressed = await Deno.readFile(
    new URL('./fixtures/aspire-sdk-17.0.0.json.gz', import.meta.url),
  );
  const text = await new Response(
    new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')),
  ).text();
  const source: Record<string, unknown> = JSON.parse(text);
  for (const file of SDK_FILES) {
    const content = source[file];
    if (typeof content !== 'string') {
      throw new Error(`Recorded Aspire 17.0.0 SDK fixture missing ${file}`);
    }
    await Deno.writeTextFile(join(modulesDir, file), content);
  }
}

Deno.test('all emitted AppHost helpers compile cleanly against the real recorded Aspire 17.0.0 SDK', async () => {
  const root = resolve(await Deno.makeTempDir({ prefix: 'netscript-apphost-compile-' }));
  const helpersDir = join(root, '.helpers');
  const modulesDir = join(root, '.aspire', 'modules');
  await Deno.mkdir(helpersDir, { recursive: true });
  await Deno.mkdir(modulesDir, { recursive: true });

  try {
    const generatedFiles = await writeGeneratedHelperFixture(root, {
      Name: 'compile-proof',
      Version: '1.0.0',
      PrimaryDatabase: 'pg',
      PrimaryCache: 'garnet',
      Otel: { HttpEndpoint: 'http://localhost:4318', Protocol: 'http/protobuf' },
      Defaults: { Deno: MINIMAL_DENO_DEFAULTS },
      Databases: {
        pg: DATABASE_WITH_OPTIONS,
        mysql: {
          Enabled: true,
          Engine: 'Mysql',
          Mode: 'Container',
          DatabaseName: 'my_db',
          Persistent: false,
        },
        mssql: {
          Enabled: true,
          Engine: 'Mssql',
          Mode: 'Container',
          DatabaseName: 'ms_db',
          Persistent: true,
          ImageTag: '2022-latest',
        },
        sqlite: {
          Enabled: true,
          Engine: 'Sqlite',
          Mode: 'External',
          DatabaseName: 'app.sqlite',
          Persistent: false,
        },
        external: DATABASE_EXTERNAL,
      },
      Cache: {
        garnet: { Enabled: true, Engine: 'Garnet', Mode: 'Container' },
        persistentGarnet: {
          Enabled: true,
          Engine: 'Garnet',
          Mode: 'Container',
          DataPath: '.data/garnet',
        },
        executable: { Enabled: true, Engine: 'Garnet', Mode: 'Executable' },
        auto: { Enabled: true, Engine: 'Garnet', Mode: 'Auto', Port: 6385 },
        redis: { Enabled: true, Engine: 'Redis', Mode: 'Container' },
        denokv: { Enabled: true, Engine: 'DenoKv', Mode: 'Container' },
        localKv: { Enabled: true, Engine: 'DenoKv', Mode: 'Local' },
      },
      Services: {
        users: MINIMAL_SERVICE,
        orders: SERVICE_WITH_REFS,
        reporting: SERVICE_WITH_PLUGIN_REFS,
      },
      Plugins: {
        auth: MINIMAL_PLUGIN,
        'workers-api': PLUGIN_WITH_REFS,
      },
      BackgroundProcessors: {
        workers: MINIMAL_BACKGROUND,
        quiet: BACKGROUND_NO_TELEMETRY,
        concurrent: BACKGROUND_WITH_CONCURRENCY,
      },
      Apps: {
        frontend: APP_WITH_REFS,
        tauri: TAURI_APP,
        task: TASK_APP,
        desktop: DESKTOP_APP,
      },
      Tools: {
        'prisma-studio': MINIMAL_TOOL,
      },
    });
    await restoreRecordedSdk(modulesDir);

    const workspaceConfig: { catalog: Record<string, string> } = JSON.parse(
      await Deno.readTextFile(new URL('../../../../../../../../deno.json', import.meta.url)),
    );
    const aspirePackageRoot = new URL(
      '../../../../../../../../packages/aspire/',
      import.meta.url,
    );
    const configPath = join(root, 'deno.json');
    await Deno.writeTextFile(
      configPath,
      JSON.stringify(
        {
          lock: false,
          unstable: ['sloppy-imports'],
          catalog: { ...SCAFFOLD_WORKSPACE_CATALOG, pg: workspaceConfig.catalog.pg },
          imports: {
            zod: 'catalog:',
            pg: 'catalog:',
            'vscode-jsonrpc/node.js': 'npm:vscode-jsonrpc@8.2.0/node.js',
            '@netscript/aspire': new URL('mod.ts', aspirePackageRoot).href,
            '@netscript/aspire/config': new URL('config.ts', aspirePackageRoot).href,
            '@netscript/aspire/constants': new URL('constants.ts', aspirePackageRoot).href,
            '@netscript/aspire/types': new URL('types.ts', aspirePackageRoot).href,
            '@netscript/aspire/application': new URL('src/application/mod.ts', aspirePackageRoot)
              .href,
          },
        },
        null,
        2,
      ),
    );

    const registerInfrastructure = await Deno.readTextFile(
      join(helpersDir, 'register-infrastructure.mts'),
    );
    assertStringIncludes(registerInfrastructure, 'databases.set("pg", db_0)');
    assertStringIncludes(registerInfrastructure, 'withHealthCheck("pg_auth")');
    assertStringIncludes(registerInfrastructure, '.withRepl()');
    assertStringIncludes(registerInfrastructure, 'containerBacked: true');
    assertStringIncludes(registerInfrastructure, '{ requireComplexity: true }');
    assert(!registerInfrastructure.includes('NetscriptE2e!Sql2026'));
    assertStringIncludes(registerInfrastructure, '.withArgs(["--lua","--lua-transaction-mode"])');
    assert(!registerInfrastructure.includes('connectionStringExpression()'));
    assert(!registerInfrastructure.includes('.getValue()'));

    const registerApps = await Deno.readTextFile(join(helpersDir, 'register-apps.mts'));
    assertStringIncludes(registerApps, 'builder.addDenoApp(');
    assertStringIncludes(registerApps, '.withDenoTask(');
    assertStringIncludes(registerApps, 'EndpointProperty.BrowserOrigins');

    const dbCliMode = await Deno.readTextFile(join(helpersDir, 'db-cli-mode.mts'));
    assertStringIncludes(dbCliMode, ".withEnvironment('DATABASE_URL', target.resource)");
    assertStringIncludes(dbCliMode, 'return await executeDbCliResource(');
    assert(!dbCliMode.includes('connectionStringExpression()'));
    assert(!dbCliMode.includes('.getValue()'));

    const checkTargets = generatedFiles.map((file) => join(root, file.path));
    const output = await checkGeneratedFiles({
      args: ['check', '--no-lock', '--unstable-kv', '--config', configPath, ...checkTargets],
    });
    const stdout = new TextDecoder().decode(output.stdout);
    const stderr = new TextDecoder().decode(output.stderr);
    const diagnostics = stdout + stderr;

    assertEquals(
      output.code,
      0,
      `emitted helper compile failed\nstdout:\n${stdout}\nstderr:\n${stderr}`,
    );
    for (
      const key of [
        'apphost.mts',
        'register-infrastructure.mts',
        'register-services.mts',
        'register-apps.mts',
        'db-cli-mode.mts',
      ]
    ) {
      assert(
        diagnostics.includes(key),
        `Deno check output must report checking ${key}`,
      );
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
