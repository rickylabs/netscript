/**
 * @module templates/aspire/helpers/generators-service-plugin_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertStringIncludes } from 'jsr:@std/assert@^1';
import type { PluginEntry } from '@netscript/aspire/types';
import { generateRegisterServices } from '../register/generate-register-services.ts';
import { generateRegisterPlugins } from '../register/generate-register-plugins.ts';
import * as fixtures from './generators-test-support.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';

// These generators read templates synchronously, which requires a previously-
// awaited registry hydration. The tests exercise them directly (outside the CLI
// dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

describe('generateRegisterServices', () => {
  const emptyOptions = {
    services: {},
    version: '1.0.0',
    denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
  };

  it('should return a non-empty string', () => {
    const output = generateRegisterServices({
      ...emptyOptions,
      services: { users: fixtures.MINIMAL_SERVICE },
    });
    assert(output.length > 0);
  });

  it('should include the standard file header', () => {
    const output = generateRegisterServices(emptyOptions);
    assertStringIncludes(output, fixtures.FILE_HEADER);
    assertStringIncludes(output, 'register-services.mts');
  });

  it('should export registerServices async function', () => {
    const output = generateRegisterServices(emptyOptions);
    assertStringIncludes(output, 'export async function registerServices(');
  });

  it('should import buildOtelEnvVars, resolvePermissions, resolveWorkspacePath', () => {
    const output = generateRegisterServices(emptyOptions);
    assertStringIncludes(output, 'buildOtelEnvVars,');
    assertStringIncludes(output, 'resolvePermissions,');
    assertStringIncludes(output, 'resolveWorkspacePath,');
    assertStringIncludes(output, "from './_aspire-compat.mjs'");
  });

  it('should generate two-pass registration structure', () => {
    const output = generateRegisterServices({
      ...emptyOptions,
      services: { users: fixtures.MINIMAL_SERVICE },
    });
    assertStringIncludes(output, '// --- Pass 1: Create all service resources ---');
    assertStringIncludes(output, '// --- Pass 2: Wire cross-references ---');
  });

  it('should register services via addExecutable with correct port and entrypoint', () => {
    const output = generateRegisterServices({
      ...emptyOptions,
      services: { users: fixtures.MINIMAL_SERVICE },
    });
    assertStringIncludes(output, "builder.addExecutable('users', 'deno', workdir,");
    assertStringIncludes(output, '.withHttpEndpoint({ port: 3000');
    assertStringIncludes(output, "services.set('users'");
  });

  it('should include full executable OTEL env vars for each service', () => {
    const output = generateRegisterServices({
      ...emptyOptions,
      services: { users: fixtures.MINIMAL_SERVICE },
    });
    assertStringIncludes(
      output,
      "buildOtelEnvVars('users', config.Version, 'executable', config.Otel.HttpEndpoint)",
    );
    assertStringIncludes(output, 'resource.withEnvironment(key, value)');
    assertStringIncludes(output, '// OTEL telemetry (full executable env set)');
  });

  it('should use --watch-hmr flag for services (HMR-capable)', () => {
    const output = generateRegisterServices({
      ...emptyOptions,
      services: { users: fixtures.MINIMAL_SERVICE },
    });
    assertStringIncludes(output, "'--watch-hmr'");
  });

  it('should wire primary database dependency for all services', () => {
    const output = generateRegisterServices({
      ...emptyOptions,
      services: { users: fixtures.MINIMAL_SERVICE },
    });
    assertStringIncludes(output, '// Database dependency');
    assertStringIncludes(output, 'if (infrastructure.primaryDatabase)');
    assertStringIncludes(
      output,
      "resource.withEnvironment('DATABASE_URL', infrastructure.primaryDatabase)",
    );
    assertStringIncludes(
      output,
      'databaseBinding.withEnvironment(databaseEnvKey, infrastructure.primaryDatabase)',
    );
    assertStringIncludes(output, '.withReference(infrastructure.primaryDatabase)');
    assertStringIncludes(output, '.waitFor(infrastructure.primaryDatabase)');
  });

  it('should wire cross-references in pass 2', () => {
    const output = generateRegisterServices({
      ...emptyOptions,
      services: {
        users: fixtures.MINIMAL_SERVICE,
        orders: fixtures.SERVICE_WITH_REFS,
      },
    });
    assertStringIncludes(
      output,
      '// --- orders: wire ServiceReferences via endpoint env vars ---',
    );
    assertStringIncludes(output, "services.get('users')?.getEndpoint('http')");
    assertStringIncludes(output, "resource.withEnvironment('services__users__http__0'");
  });

  it('should not emit pass 2 blocks for services without references', () => {
    const output = generateRegisterServices({
      ...emptyOptions,
      services: { users: fixtures.MINIMAL_SERVICE },
    });
    // Pass 2 should have no-op comment since users has no ServiceReferences
    assertStringIncludes(output, '// No cross-references to wire');
  });

  it('should handle empty services', () => {
    const output = generateRegisterServices(emptyOptions);
    assertStringIncludes(output, '// No services configured');
    assertStringIncludes(output, '// No cross-references to wire');
  });
});
// generateRegisterPlugins
// --------------------------------------------------------------------------

describe('generateRegisterPlugins', () => {
  const emptyOptions = {
    plugins: {},
    version: '1.0.0',
    denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
  };

  it('should return a non-empty string', () => {
    const output = generateRegisterPlugins({
      ...emptyOptions,
      plugins: { auth: fixtures.MINIMAL_PLUGIN },
    });
    assert(output.length > 0);
  });

  it('should include the standard file header', () => {
    const output = generateRegisterPlugins(emptyOptions);
    assertStringIncludes(output, fixtures.FILE_HEADER);
    assertStringIncludes(output, 'register-plugins.mts');
  });

  it('should export registerPlugins async function', () => {
    const output = generateRegisterPlugins(emptyOptions);
    assertStringIncludes(output, 'export async function registerPlugins(');
  });

  it('should generate two-pass registration structure', () => {
    const output = generateRegisterPlugins({
      ...emptyOptions,
      plugins: { auth: fixtures.MINIMAL_PLUGIN },
    });
    assertStringIncludes(output, '// --- Pass 1: Create all plugin resources ---');
    assertStringIncludes(
      output,
      '// --- Pass 2: Wire plugin\u2192plugin cross-references ---',
    );
  });

  it('should register plugins via addExecutable with correct port', () => {
    const output = generateRegisterPlugins({
      ...emptyOptions,
      plugins: { auth: fixtures.MINIMAL_PLUGIN },
    });
    assertStringIncludes(output, "builder.addExecutable('auth', 'deno', workdir,");
    assertStringIncludes(output, '.withHttpEndpoint({ port: 4400');
    assertStringIncludes(output, "plugins.set('auth'");
  });

  it('should include full executable OTEL env vars for each plugin', () => {
    const output = generateRegisterPlugins({
      ...emptyOptions,
      plugins: { auth: fixtures.MINIMAL_PLUGIN },
    });
    assertStringIncludes(
      output,
      "buildOtelEnvVars('auth', config.Version, 'executable', config.Otel.HttpEndpoint)",
    );
    assertStringIncludes(output, 'resource.withEnvironment(key, value)');
    assertStringIncludes(output, '// OTEL telemetry (full executable env set)');
  });

  it('should wire plugin\u2192plugin references in pass 2', () => {
    const output = generateRegisterPlugins({
      ...emptyOptions,
      plugins: {
        auth: fixtures.MINIMAL_PLUGIN,
        notifications: fixtures.PLUGIN_WITH_REFS,
      },
    });
    assertStringIncludes(
      output,
      '// --- notifications: wire PluginReferences via endpoint env vars ---',
    );
    assertStringIncludes(output, "plugins.get('auth')?.getEndpoint('http')");
    assertStringIncludes(output, "resource.withEnvironment('services__auth__http__0'");
  });

  it('should wire service references in pass 1 (services already exist)', () => {
    const output = generateRegisterPlugins({
      ...emptyOptions,
      plugins: { notifications: fixtures.PLUGIN_WITH_REFS },
    });
    assertStringIncludes(
      output,
      '// Service references (wired via endpoint env vars',
    );
    assertStringIncludes(output, "services.get('users')?.getEndpoint('http')");
    assertStringIncludes(output, "resource.withEnvironment('services__users__http__0'");
  });

  it('should handle RequiresDb dependency', () => {
    const output = generateRegisterPlugins({
      ...emptyOptions,
      plugins: { auth: fixtures.MINIMAL_PLUGIN },
    });
    assertStringIncludes(output, '// Database dependency');
    assertStringIncludes(output, 'infrastructure.primaryDatabase');
    assertStringIncludes(output, "withEnvironment('DATABASE_URL'");
  });

  it('should handle RequiresKv dependency', () => {
    const kvPlugin: PluginEntry = { ...fixtures.MINIMAL_PLUGIN, RequiresKv: true };
    const output = generateRegisterPlugins({
      ...emptyOptions,
      plugins: { cache: kvPlugin },
    });
    assertStringIncludes(output, '// KV cache dependency');
    assertStringIncludes(output, 'infrastructure.primaryCacheEndpoint');
    assertStringIncludes(output, 'withReference(infrastructure.primaryCacheEndpoint)');
  });

  it('should pass saga store backend appsettings to plugin env', () => {
    const sagaPlugin = {
      ...fixtures.MINIMAL_PLUGIN,
      Sagas: { Store: { Backend: 'prisma' } },
    } as PluginEntry;
    const output = generateRegisterPlugins({
      ...emptyOptions,
      plugins: { 'sagas-api': sagaPlugin },
    });
    assertStringIncludes(
      output,
      "resource.withEnvironment('NETSCRIPT_SAGA_STORE', \"prisma\")",
    );
  });

  it('should handle empty plugins', () => {
    const output = generateRegisterPlugins(emptyOptions);
    assertStringIncludes(output, '// No plugins configured');
    assertStringIncludes(
      output,
      '// No plugin\u2192plugin cross-references to wire.',
    );
  });
});
// generateRegisterBackground
// --------------------------------------------------------------------------
