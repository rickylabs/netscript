import { assertEquals } from '@std/assert';
import { buildScaffoldPluginJson } from './manifest-spec.ts';
import type { PluginScaffoldManifestSpec } from './manifest-spec.ts';

/**
 * Minimal in-test manifest spec exercising version injection and serialization shape.
 *
 * The byte-for-byte reproduction of each committed `plugins/<kind>/scaffold.plugin.json` now lives in
 * that plugin's own `src/scaffold/scaffold.test.ts` (S2 relocated every spec out of the central
 * fixture; S2c retired the last one, auth, and the `test_fixtures/manifest-specs.ts` file). These two
 * unit tests keep coverage of `buildScaffoldPluginJson`'s version/peer-dependency injection and
 * trailing-newline contract without depending on any plugin spec from this package.
 */
const sampleSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-sample',
  displayName: 'Sample',
  description: 'Sample manifest spec for buildScaffoldPluginJson unit coverage.',
  capabilities: {
    hasDatabaseMigrations: false,
    hasRoutes: true,
    hasBackgroundWorkers: false,
  },
  scaffolder: {
    export: './scaffold',
    requiredPermissions: {
      net: [],
      read: ['<workspaceRoot>'],
      write: ['<workspaceRoot>'],
    },
  },
  provider: {
    kind: 'sample',
    displayName: 'Sample',
    category: 'plugin',
    portRangeKey: 'PLUGIN_API',
    defaultPermissions: ['--allow-net', '--allow-env', '--allow-read'],
    watchFlag: '--watch',
    defaultEntrypoint: 'services/src/main.ts',
    defaultServiceEntrypoint: 'services/src/main.ts',
    defaultRequiresDb: false,
    defaultRequiresKv: false,
    pluginType: 'utility',
    supportsConcurrency: false,
    concurrencyEnvVar: null,
    defaultConcurrency: null,
    defaultTelemetry: true,
    infrastructureRequires: [],
    infrastructureOptionalDeps: [],
  },
  officialSource: {
    canonicalName: 'sample',
    pluginDir: 'sample',
    serviceEntrypoint: 'services/src/main.ts',
    serviceConfigKey: 'sample',
    servicePort: 4000,
    backgroundPort: 4000,
    requiresDb: false,
    requiresKv: false,
    permissions: ['--allow-net', '--allow-env', '--allow-read'],
  },
};

Deno.test('buildScaffoldPluginJson injects version into version and peerDependencies', () => {
  const json = buildScaffoldPluginJson(sampleSpec, '9.9.9');
  const parsed = JSON.parse(json);
  assertEquals(parsed.version, '9.9.9');
  assertEquals(parsed.peerDependencies['@netscript/plugin'], '9.9.9');
});

Deno.test('buildScaffoldPluginJson output ends with a single trailing newline', () => {
  const json = buildScaffoldPluginJson(sampleSpec, '0.0.1-alpha.12');
  assertEquals(json.endsWith('}\n'), true);
  assertEquals(json.endsWith('}\n\n'), false);
});
