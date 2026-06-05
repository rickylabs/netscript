/**
 * @module templates/aspire/helpers/generators-background-app_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertStringIncludes } from 'jsr:@std/assert@^1';
import type { BackgroundProcessorEntry } from '@netscript/aspire/types';
import { generateRegisterBackground } from '../register/generate-register-background.ts';
import { generateRegisterApps } from '../register/generate-register-apps.ts';
import * as fixtures from './generators-test-support.ts';

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
    assertStringIncludes(output, 'register-background.ts');
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
    assertStringIncludes(output, "builder.addExecutable('workers', 'deno', workers_workdir,");
    assertStringIncludes(output, "backgroundProcessors.set('workers'");
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
      "config.BackgroundProcessors['workers']?.Enabled !== false",
    );
  });

  it('should include OTEL env vars when telemetry is enabled', () => {
    const output = generateRegisterBackground({
      ...emptyOptions,
      processors: { workers: fixtures.MINIMAL_BACKGROUND },
    });
    assertStringIncludes(
      output,
      "buildOtelEnvVars('workers', config.Version, 'executable', config.Otel.HttpEndpoint)",
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
    assertStringIncludes(output, "withEnvironmentConnectionString('DATABASE_URL'");
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
    assertStringIncludes(output, 'infrastructure.primaryCacheEndpoint');
    assertStringIncludes(output, 'withReferenceEndpoint(infrastructure.primaryCacheEndpoint)');
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
    assertStringIncludes(output, 'register-apps.ts');
  });

  it('should export registerApps async function', () => {
    const output = generateRegisterApps(emptyOptions);
    assertStringIncludes(output, 'export async function registerApps(');
  });

  it('should import buildViteEnvVarName from _aspire-compat', () => {
    const output = generateRegisterApps(emptyOptions);
    assertStringIncludes(output, 'buildViteEnvVarName,');
    assertStringIncludes(output, "from './_aspire-compat.ts'");
  });

  it('should register app type via addExecutable with default entrypoint', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(output, "builder.addExecutable('frontend', 'deno',");
    assertStringIncludes(output, "apps.set('frontend'");
  });

  it('should include enabled gate for each app', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(
      output,
      "config.Apps['frontend']?.Enabled !== false",
    );
  });

  it('should include OTEL telemetry for all app types', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(
      output,
      "buildOtelEnvVars('frontend', config.Version, 'executable', config.Otel.HttpEndpoint)",
    );
  });

  it('should include HTTP endpoint when port is configured', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(output, ".withHttpEndpoint({ port: 8000, env: 'PORT' })");
  });

  it('should use deno task for app registration', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(output, "['task', 'dev']");
  });

  it('should include VITE service-discovery injection for service references', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { dashboard: fixtures.APP_WITH_REFS },
    });
    assertStringIncludes(output, '// VITE service-discovery injection');
    assertStringIncludes(output, "buildViteEnvVarName('users')");
    assertStringIncludes(output, 'services__users__http__0');
  });

  it('should annotate app type in comment', () => {
    const output = generateRegisterApps({
      ...emptyOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(output, '// --- frontend (app) ---');
  });

  it('should handle empty apps', () => {
    const output = generateRegisterApps(emptyOptions);
    assertStringIncludes(output, '// No apps configured');
  });
});
// generateRegisterTools
// --------------------------------------------------------------------------
