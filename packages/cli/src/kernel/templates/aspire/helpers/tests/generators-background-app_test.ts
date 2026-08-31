/**
 * @module templates/aspire/helpers/generators-background-app_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import type { BackgroundProcessorEntry } from '@netscript/aspire/types';
import { RESOURCE_DEFAULTS } from '@netscript/aspire/constants';
import { generateRegisterBackground } from '../register/generate-register-background.ts';
import { generateRegisterApps } from '../register/generate-register-apps.ts';
import * as fixtures from './generators-test-support.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';

// These generators read templates synchronously, which requires a previously-
// awaited registry hydration. The tests exercise them directly (outside the CLI
// dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

describe('generateRegisterBackground', () => {
  const emptyOptions = {
    processors: {},
    version: '1.0.0',
    denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
  };

  it('should return a non-empty string', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { workers: fixtures.MINIMAL_BACKGROUND },
    });
    assert(output.length > 0);
  });

  it('should include the standard file header', () => {
    const output = generateRegisterBackground(emptyOptions);
    assertStringIncludes(output, fixtures.FILE_HEADER);
    assertStringIncludes(output, 'register-background.mts');
  });

  it('should export registerBackgroundProcessors async function', () => {
    const output = generateRegisterBackground(emptyOptions);
    assertStringIncludes(output, 'export async function registerBackgroundProcessors(');
  });

  it('should import buildOtelEnvVars and resolvePermissions', () => {
    const output = generateRegisterBackground(emptyOptions);
    assertStringIncludes(output, 'buildOtelEnvVars,');
    assertStringIncludes(output, 'resolvePermissions,');
    assertStringIncludes(output, 'resolveWorkspacePath,');
  });

  it('should register processors via addExecutable', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { workers: fixtures.MINIMAL_BACKGROUND },
    });
    assertStringIncludes(output, 'builder.addExecutable("workers", \'deno\', workers_workdir,');
    assertStringIncludes(output, "'--minimum-dependency-age=0'");
    assertStringIncludes(output, 'backgroundProcessors.set("workers"');
  });

  it('emits SQLite FFI exactly once for background processors', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { workers: fixtures.MINIMAL_BACKGROUND },
      databaseEngine: 'Sqlite',
    });
    const explicitOutput = generateRegisterBackground({
      ...emptyOptions,
      processors: {
        workers: {
          ...fixtures.MINIMAL_BACKGROUND,
          Permissions: ['--allow-net', '--allow-ffi'],
        },
      },
      databaseEngine: 'Sqlite',
    });

    assertEquals(output.match(/--allow-ffi/g)?.length, 1);
    assertEquals(explicitOutput.match(/--allow-ffi/g)?.length, 1);
  });

  it('keeps non-SQLite background output byte-identical', () => {
    const options = {
      ...emptyOptions,
      processors: { workers: fixtures.MINIMAL_BACKGROUND },
    };
    const baseline = generateRegisterBackground(options);
    const engines = [undefined, 'Postgres', 'Mysql', 'Mssql'] as const;

    for (const databaseEngine of engines) {
      assertEquals(
        generateRegisterBackground({ ...options, databaseEngine }),
        baseline,
        `${databaseEngine ?? 'none'} background output`,
      );
    }
  });

  it('should use --watch flag (not --watch-hmr) for background processors', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { workers: fixtures.MINIMAL_BACKGROUND },
    });
    assertStringIncludes(output, "'--watch'");
  });

  it('should enable Deno worker options for background processors', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { workers: fixtures.MINIMAL_BACKGROUND },
    });
    assertStringIncludes(output, "'--unstable-worker-options'");
  });

  it('should include enabled gate for each processor', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { workers: fixtures.MINIMAL_BACKGROUND },
    });
    assertStringIncludes(
      output,
      'config.BackgroundProcessors["workers"]?.Enabled !== false',
    );
  });

  it('should include OTEL env vars when telemetry is enabled', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { workers: fixtures.MINIMAL_BACKGROUND },
    });
    assertStringIncludes(
      output,
      'buildOtelEnvVars("workers", config.Version, \'executable\')',
    );
    assertStringIncludes(output, '// OTEL telemetry (full executable env set)');
  });

  it('should opt out of telemetry when disabled', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { benchmark: fixtures.BACKGROUND_NO_TELEMETRY },
    });
    assertStringIncludes(output, '// Telemetry disabled \u2014 opt out explicitly');
    assertStringIncludes(
      output,
      "benchmark.withEnvironment('OTEL_DENO', 'false')",
    );
    assertStringIncludes(
      output,
      "benchmark.withEnvironment('OTEL_TRACES_SAMPLER', 'always_off')",
    );
  });

  it('should include concurrency env var when configured', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { workers: fixtures.BACKGROUND_WITH_CONCURRENCY },
    });
    assertStringIncludes(
      output,
      "workers.withEnvironment('WORKERS_CONCURRENCY', String(4))",
    );
  });

  it('should include database dependency when RequiresDb is true', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { workers: fixtures.BACKGROUND_WITH_CONCURRENCY },
    });
    assertStringIncludes(output, '// Database dependency');
    assertStringIncludes(output, 'infrastructure.primaryDatabase');
    assertStringIncludes(output, "withEnvironment('DATABASE_URL'");
    assertStringIncludes(output, "workers_sqliteDatabase?.Engine === 'Sqlite'");
    assertStringIncludes(output, 'buildDatabaseProviderEnvVars(config)');
    assertStringIncludes(output, 'buildSqliteDatabaseUrl(appHostDir');
    assertStringIncludes(output, 'else if (infrastructure.primaryDatabase)');
    assert(
      output.indexOf("workers_sqliteDatabase?.Engine === 'Sqlite'") <
        output.indexOf('else if (infrastructure.primaryDatabase)'),
      'SQLite background resources must not enter the Aspire reference branch',
    );
    assert(!output.includes('file:./database/${config.PrimaryDatabase}/'));
  });

  it('should include KV cache dependency when RequiresKv is true', () => {
    const kvProcessor: BackgroundProcessorEntry = {
      ...fixtures.MINIMAL_BACKGROUND,
      RequiresKv: true,
    };
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { triggers: kvProcessor },
    });
    assertStringIncludes(output, '// KV cache dependency');
    // Single seam over the pre-built primary-cache wiring.
    assertStringIncludes(
      output,
      'await _withCacheReference(triggers, infrastructure.primaryCacheWiring)',
    );
    assertStringIncludes(output, 'withCacheReference,');
    // EndpointProperty no longer imported — endpoint resolution moved to wiring.
    assertStringIncludes(output, "import { OtlpProtocol } from '../.aspire/modules/aspire.mts'");
  });

  it('uses the typed service map parameter for background service references', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: {
        workers: {
          ...fixtures.MINIMAL_BACKGROUND,
          ServiceReferences: ['users'],
        },
      },
    });

    assertStringIncludes(output, '_services: Map<string, ExecutableResource>');
    assertStringIncludes(output, "_services.get('users')?.getEndpoint('http')");
    assert(!output.includes(" services.get('users')"));
  });

  it('should pass saga store backend appsettings to background env', () => {
    const sagaProcessor = {
      ...fixtures.MINIMAL_BACKGROUND,
      Sagas: { Store: { Backend: 'prisma' } },
    } as BackgroundProcessorEntry;
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { sagas: sagaProcessor },
    });
    assertStringIncludes(
      output,
      'sagas.withEnvironment(\'NETSCRIPT_SAGA_STORE\', "prisma")',
    );
  });

  it('should register the saga supervisor health endpoint and probe', () => {
    const sagaProcessor = {
      ...fixtures.MINIMAL_BACKGROUND,
      Entrypoint: 'sagas/runtime.ts',
      Sagas: { Store: { Backend: 'kv' } },
    } as BackgroundProcessorEntry;
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { sagas: sagaProcessor },
    });

    assertStringIncludes(output, "await sagas.withHttpEndpoint({ env: 'PORT' })");
    assertStringIncludes(
      output,
      `await sagas.withHttpHealthCheck({ path: '${RESOURCE_DEFAULTS.AppHealthCheckPath}', endpointName: '${RESOURCE_DEFAULTS.HttpEndpointName}' })`,
    );
    assert(
      output.indexOf('.withHttpEndpoint(') < output.indexOf('.withHttpHealthCheck('),
      'health probe must be registered after the saga endpoint it derives its base address from',
    );
  });

  it('should point triggers background at the generated trigger registry module', () => {
    const triggerProcessor: BackgroundProcessorEntry = {
      ...fixtures.MINIMAL_BACKGROUND,
      Entrypoint: 'triggers/runtime.ts',
    };
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { triggers: triggerProcessor },
    });
    assertStringIncludes(
      output,
      "new URL('../../.netscript/generated/plugin-triggers/triggers.registry.ts', import.meta.url).href",
    );
    assertStringIncludes(
      output,
      "triggers.withEnvironment('NETSCRIPT_TRIGGER_REGISTRY_MODULE', triggers_triggerRegistryModule)",
    );
  });

  it('should handle empty processors', () => {
    const output = generateRegisterBackground(emptyOptions);
    assertStringIncludes(output, '// No background processors configured');
  });
});
// generateRegisterApps
// --------------------------------------------------------------------------

describe('generateRegisterApps', () => {
  const emptyOptions = {
    apps: {},
    version: '1.0.0',
    denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
  };

  it('should return a non-empty string', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assert(output.length > 0);
  });

  it('should include the standard file header', () => {
    const output = generateRegisterApps(emptyOptions);
    assertStringIncludes(output, fixtures.FILE_HEADER);
    assertStringIncludes(output, 'register-apps.mts');
  });

  it('should export registerApps async function', () => {
    const output = generateRegisterApps(emptyOptions);
    assertStringIncludes(output, 'export async function registerApps(');
  });

  it('should import buildViteEnvVarName from _aspire-compat', () => {
    const output = generateRegisterApps(emptyOptions);
    assertStringIncludes(output, 'buildViteEnvVarName,');
    assertStringIncludes(output, "from './_aspire-compat.mts'");
  });

  it('should register app type with valid deno task argv', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(output, 'builder.addExecutable("frontend", \'deno\',');
    assert(!output.includes('--minimum-dependency-age=0'));
    assertStringIncludes(output, 'apps.set("frontend"');
  });

  it('should include enabled gate for each app', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(
      output,
      'config.Apps["frontend"]?.Enabled !== false',
    );
  });

  it('should include OTEL telemetry for all app types', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(
      output,
      'buildOtelEnvVars("frontend", config.Version, \'executable\')',
    );
  });

  it('should include HTTP endpoint when port is configured', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(output, ".withHttpEndpoint({ port: 8000, env: 'PORT' })");
  });

  it('should enable browser logs after endpoint binding for app resources', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });

    assertStringIncludes(output, 'await app_0.withBrowserLogs();');
    assert(
      output.indexOf('app_0.withHttpEndpoint(') < output.indexOf('app_0.withBrowserLogs()'),
      'browser logs must be registered after the HTTP endpoint they browse',
    );
  });

  it('should use deno task for app registration', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(output, '[\'task\', "dev"]');
  });

  it('should include VITE service-discovery injection for service references', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { dashboard: fixtures.APP_WITH_REFS },
    });
    assertStringIncludes(output, '// VITE service-discovery injection');
    assertStringIncludes(output, 'buildViteEnvVarName("users")');
    assertStringIncludes(output, 'services__users__http__0');
  });

  it('should register desktop only when explicitly enabled', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { dashboard: fixtures.DESKTOP_APP },
    });

    assertStringIncludes(output, '// --- app 0 ---');
    assertStringIncludes(output, 'config.Apps["dashboard"]?.Enabled === true');
  });

  it('should make desktop launch wait for the Fresh build resource', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { dashboard: fixtures.DESKTOP_APP },
    });
    const buildDeclaration =
      'const app_0_build = builder.addExecutable("dashboard-build", \'deno\', app_0_workdir, [\'task\', "build"]);';
    const windowDeclaration =
      "const app_0 = builder.addExecutable(\"dashboard\", 'deno', app_0_workdir, ['task', \"desktop:predev\", '--backend', 'cef']);";
    const buildDependency = 'await app_0.waitForCompletion(app_0_build);';

    assertStringIncludes(output, buildDeclaration);
    assertStringIncludes(output, windowDeclaration);
    assertStringIncludes(output, buildDependency);
    assert(output.indexOf(buildDeclaration) < output.indexOf(windowDeclaration));
    assert(output.indexOf(windowDeclaration) < output.indexOf(buildDependency));
    assert(!output.includes("['task', 'desktop:predev', '--', '--backend', 'cef']"));
  });

  it('should apply desktop build and predev task defaults', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: {
        dashboard: {
          ...fixtures.DESKTOP_APP,
          Prebuild: undefined,
          TaskName: undefined,
        },
      },
    });

    assertStringIncludes(output, '[\'task\', "build"]');
    assertStringIncludes(output, "['task', \"desktop:predev\", '--backend', 'cef']");
  });

  it('should inject server-side discovery without an Aspire HTTP endpoint for desktop', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { dashboard: fixtures.DESKTOP_APP },
    });

    assertStringIncludes(output, '// Server-side service-discovery injection');
    assertStringIncludes(output, 'getResourceEndpoint(_services.get("users"), \'http\')');
    assertStringIncludes(output, 'app_0.withEnvironment("services__users__http__0", endpoint)');
    assertStringIncludes(output, 'getResourceEndpoint(_plugins.get("workers-api"), \'http\')');
    assertStringIncludes(
      output,
      'app_0.withEnvironment("services__workers-api__http__0", endpoint)',
    );
    assert(!output.includes('buildViteEnvVarName('));
    assert(!output.includes('app_0.withHttpEndpoint('));
    assert(!output.includes("port: 8999, env: 'PORT'"));
  });

  it('should annotate app type in comment', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(output, '// --- app 0 ---');
  });

  // Regression guard for #954: without a registered health check Aspire treats a
  // merely-running process as healthy, so an app failing every request during SSR
  // still reported `Healthy`. The probe must be emitted, and must be emitted after
  // the endpoint whose base address it resolves against.
  it('should register an HTTP health probe for app resources', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.UNPINNED_APP },
    });
    assertStringIncludes(
      output,
      `await app_0.withHttpHealthCheck({ path: ${
        JSON.stringify(RESOURCE_DEFAULTS.AppHealthCheckPath)
      }, endpointName: '${RESOURCE_DEFAULTS.HttpEndpointName}' });`,
    );
    assert(
      output.indexOf('.withHttpEndpoint(') < output.indexOf('.withHttpHealthCheck('),
      'health probe must be registered after the HTTP endpoint it derives its base address from',
    );
  });

  it('should probe a custom path when HealthCheckPath is configured', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: {
        frontend: { ...fixtures.MINIMAL_APP, HealthCheckPath: '/_status' },
      },
    });
    assertStringIncludes(output, 'path: "/_status"');
    assert(!output.includes(`path: ${JSON.stringify(RESOURCE_DEFAULTS.AppHealthCheckPath)}`));
  });

  it('should omit the health probe when HealthCheckPath is false', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: { ...fixtures.MINIMAL_APP, HealthCheckPath: false } },
    });
    assert(!output.includes('withHttpHealthCheck'));
  });

  it('should register a health probe for every endpoint-bearing executable', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: {
        shell: fixtures.TAURI_APP,
        desktop: fixtures.DESKTOP_APP,
        chores: fixtures.TASK_APP,
      },
    });
    assertStringIncludes(output, 'await app_0.withHttpHealthCheck(');
    assertStringIncludes(output, 'await app_2.withHttpHealthCheck(');
    assert(!output.includes('await app_1.withHttpHealthCheck('));
  });

  it('should not register a health probe for an endpoint-less task', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { chores: fixtures.UNPINNED_TASK_APP },
    });
    assert(!output.includes('withHttpHealthCheck'));
    assert(!output.includes('withBrowserLogs'));
  });

  it('should handle empty apps', () => {
    const output = generateRegisterApps(emptyOptions);
    assertStringIncludes(output, '// No apps configured');
  });
});
// generateRegisterTools
// --------------------------------------------------------------------------
