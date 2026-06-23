import { assertEquals, assertMatch } from '@std/assert';
import { DASHBOARD_ENV_VARS } from '../constants.ts';
import { buildOtelEnvVars } from '../src/application/resolve-env-vars.ts';
import {
  resolveDataPath,
  resolveWorkdir,
  resolveWorkspacePath,
} from '../src/application/resolve-paths.ts';
import { resolvePermissions } from '../src/application/resolve-permissions.ts';
import { buildViteEnvVarName } from '../src/application/build-vite-env-var-name.ts';
import {
  extractDependencies,
  extractPluginReferences,
  extractServiceReferences,
} from '../src/application/resolve-references.ts';

const DEFAULT_PERMS = ['--allow-net', '--allow-env', '--allow-read', '--allow-sys'];

Deno.test('helpers/telemetry', async (t) => {
  await t.step('buildOtelEnvVars: denoApp mode returns 3 vars', () => {
    const vars = buildOtelEnvVars('users', '1.0.0', 'denoApp');

    assertEquals(Object.keys(vars).length, 3);
    assertEquals(vars.OTEL_DENO, 'true');
    assertEquals(vars.OTEL_SERVICE_NAME, 'users');
    assertEquals(vars.OTEL_RESOURCE_ATTRIBUTES, 'service.version=1.0.0');
  });

  await t.step('buildOtelEnvVars: executable mode returns 10 vars', () => {
    const vars = buildOtelEnvVars('users', '1.0.0', 'executable');

    assertEquals(Object.keys(vars).length, 10);
    assertEquals(vars.OTEL_DENO, 'true');
    assertEquals(vars.OTEL_EXPORTER_OTLP_ENDPOINT, 'http://localhost:4318');
    assertEquals(vars.OTEL_EXPORTER_OTLP_PROTOCOL, 'http/protobuf');
    assertEquals(vars.OTEL_SERVICE_NAME, 'users');
    assertEquals(vars.OTEL_RESOURCE_ATTRIBUTES, 'service.version=1.0.0');
    assertEquals(vars.OTEL_TRACES_SAMPLER, 'always_on');
    assertEquals(vars.OTEL_BSP_SCHEDULE_DELAY, '1000');
    assertEquals(vars.OTEL_BLRP_SCHEDULE_DELAY, '1000');
    assertEquals(vars.OTEL_METRIC_EXPORT_INTERVAL, '1000');
    assertEquals(vars.OTEL_METRICS_EXEMPLAR_FILTER, 'trace_based');
  });

  await t.step('buildOtelEnvVars: denoTask mode returns 10 vars', () => {
    const vars = buildOtelEnvVars('api', '2.0.0', 'denoTask');

    assertEquals(Object.keys(vars).length, 10);
    assertEquals(vars.OTEL_SERVICE_NAME, 'api');
    assertEquals(vars.OTEL_RESOURCE_ATTRIBUTES, 'service.version=2.0.0');
  });

  await t.step('buildOtelEnvVars: custom endpoint', () => {
    const vars = buildOtelEnvVars('users', '1.0.0', 'executable', 'http://otel:4317');

    assertEquals(vars.OTEL_EXPORTER_OTLP_ENDPOINT, 'http://otel:4317');
  });
});

Deno.test('helpers/constants: dashboard env vars match Aspire dashboard contract', () => {
  assertEquals(
    DASHBOARD_ENV_VARS.OTLP_HTTP_ENDPOINT,
    'ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL',
  );
  assertEquals(
    DASHBOARD_ENV_VARS.ALLOW_UNSECURED_TRANSPORT,
    'ASPIRE_ALLOW_UNSECURED_TRANSPORT',
  );
  assertEquals(
    DASHBOARD_ENV_VARS.UNSECURED_ALLOW_ANONYMOUS,
    'ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS',
  );
});

Deno.test('helpers/vite', async (t) => {
  await t.step('buildViteEnvVarName: simple name', () => {
    const result = buildViteEnvVarName('orders');

    assertEquals(result.full, 'VITE_services__orders__http__0');
    assertEquals(result.shorthand, 'VITE_ORDERS_URL');
  });

  await t.step('buildViteEnvVarName: hyphenated name', () => {
    const result = buildViteEnvVarName('workers-api');

    assertEquals(result.full, 'VITE_services__workers-api__http__0');
    assertEquals(result.shorthand, 'VITE_WORKERS_API_URL');
  });

  await t.step('buildViteEnvVarName: custom endpoint name', () => {
    const result = buildViteEnvVarName('api', 'grpc');

    assertEquals(result.full, 'VITE_services__api__grpc__0');
    assertEquals(result.shorthand, 'VITE_API_URL');
  });
});

Deno.test('helpers/permissions', async (t) => {
  await t.step('resolvePermissions: returns defaults when no entry perms', () => {
    const result = resolvePermissions(undefined, DEFAULT_PERMS);

    assertEquals(result, DEFAULT_PERMS);
  });

  await t.step('resolvePermissions: entry overrides defaults', () => {
    const result = resolvePermissions(['--allow-all'], DEFAULT_PERMS);

    assertEquals(result, ['--allow-all']);
  });

  await t.step('resolvePermissions: appends watch flag', () => {
    const result = resolvePermissions(undefined, DEFAULT_PERMS, true, '--watch-hmr');

    assertEquals(result, [...DEFAULT_PERMS, '--watch-hmr']);
  });

  await t.step('resolvePermissions: default watch flag is --watch-hmr', () => {
    const result = resolvePermissions(undefined, DEFAULT_PERMS, true);

    assertEquals(result[result.length - 1], '--watch-hmr');
  });

  await t.step('resolvePermissions: no watch flag when disabled', () => {
    const result = resolvePermissions(undefined, DEFAULT_PERMS, false);

    assertEquals(result, DEFAULT_PERMS);
  });
});

Deno.test('helpers/paths', async (t) => {
  await t.step('resolveWorkspacePath: navigates up two levels', () => {
    // On any OS, resolve goes up 2 dirs from the apphost
    const result = resolveWorkspacePath('/project/dotnet/AppHost', 'services/users');

    assertEquals(result.endsWith('services/users') || result.endsWith('services\\users'), true);
    // Should NOT contain dotnet/AppHost in the resolved path
    assertEquals(result.includes('dotnet/AppHost') || result.includes('dotnet\\AppHost'), false);
  });

  await t.step('resolveWorkdir: default from section + key', () => {
    // @std/path join uses OS-native separators — accept both / and \
    assertMatch(resolveWorkdir('services', 'users'), /^services[/\\]users$/);
    assertMatch(resolveWorkdir('plugins', 'workers-api'), /^plugins[/\\]workers-api$/);
  });

  await t.step('resolveWorkdir: explicit overrides default', () => {
    assertEquals(resolveWorkdir('services', 'users', 'custom/dir'), 'custom/dir');
  });

  await t.step('resolveDataPath: uses provided path', () => {
    const result = resolveDataPath('/project/dotnet/AppHost', 'data/postgres', 'postgres');

    assertEquals(result.includes('data') && result.includes('postgres'), true);
  });

  await t.step('resolveDataPath: defaults to .data/{name}', () => {
    const result = resolveDataPath('/project/dotnet/AppHost', undefined, 'garnet');

    assertEquals(result.includes('.data') && result.includes('garnet'), true);
  });
});

Deno.test('helpers/references', async (t) => {
  await t.step('extractServiceReferences: deduplicates service refs', () => {
    const result = extractServiceReferences({
      ServiceReferences: ['users', 'products', 'users'],
    });

    assertEquals(result.sort(), ['products', 'users']);
  });

  await t.step('extractServiceReferences: empty when no refs', () => {
    assertEquals(extractServiceReferences({}), []);
  });

  await t.step('extractPluginReferences: returns plugin refs', () => {
    const result = extractPluginReferences({
      PluginReferences: ['workers-api', 'sagas-api'],
    });

    assertEquals(result, ['workers-api', 'sagas-api']);
  });

  await t.step('extractPluginReferences: empty when none', () => {
    assertEquals(extractPluginReferences({}), []);
  });

  await t.step('extractDependencies: extracts flags', () => {
    const result = extractDependencies({ RequiresDb: true, RequiresKv: true });

    assertEquals(result, { requiresDb: true, requiresKv: true });
  });

  await t.step('extractDependencies: defaults to false', () => {
    const result = extractDependencies({});

    assertEquals(result, { requiresDb: false, requiresKv: false });
  });
});
