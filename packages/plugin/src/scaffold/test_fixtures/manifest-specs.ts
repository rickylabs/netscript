/**
 * Test-only manifest spec reproducing the committed `plugins/auth/scaffold.plugin.json` file.
 *
 * S2 moves each plugin spec into its own package (`plugins/<kind>/src/scaffold/spec.ts`); for S1 all
 * five lived here as fixtures so the byte-identity gate could prove `buildScaffoldPluginJson` matches
 * the committed bytes before the plugins were thinned. S2a relocated workers and S2b relocated
 * sagas, triggers, and streams to their packages (each with its own byte-identity test); only the
 * auth spec remains here, pending the separate auth thinning slice.
 *
 * @module
 */

import type { PluginScaffoldManifestSpec } from '../manifest-spec.ts';

/** Build version pinned across the committed manifests under test. */
export const FIXTURE_VERSION = '0.0.1-alpha.12';

/** Spec reproducing `plugins/auth/scaffold.plugin.json`. */
export const authSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-auth',
  displayName: 'Auth',
  description:
    'NetScript plugin for a unified auth API, auth database schema, and auth session streams.',
  capabilities: {
    hasDatabaseMigrations: true,
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
    kind: 'auth',
    displayName: 'Auth',
    category: 'plugin',
    portRangeKey: 'PLUGIN_API',
    defaultPermissions: ['--unstable-kv', '--allow-net', '--allow-env', '--allow-read'],
    watchFlag: '--watch',
    defaultEntrypoint: 'services/src/main.ts',
    defaultServiceEntrypoint: 'services/src/main.ts',
    defaultRequiresDb: true,
    defaultRequiresKv: true,
    pluginType: 'utility',
    supportsConcurrency: false,
    concurrencyEnvVar: null,
    defaultConcurrency: null,
    defaultTelemetry: true,
    infrastructureRequires: ['db', 'kv'],
    infrastructureOptionalDeps: [],
  },
  officialSource: {
    canonicalName: 'auth',
    pluginDir: 'auth',
    serviceEntrypoint: 'services/src/main.ts',
    serviceConfigKey: 'auth',
    servicePort: 8094,
    backgroundPort: 8094,
    requiresDb: true,
    requiresKv: true,
    permissions: ['--unstable-kv', '--allow-net', '--allow-env', '--allow-read'],
  },
};

/**
 * The committed plugin specs keyed by directory name.
 *
 * Only auth remains: S2a relocated workers and S2b relocated sagas, triggers, and streams to
 * `plugins/<kind>/src/scaffold/spec.ts`, where their byte-identity assertions moved with them. Auth
 * stays here until its own thinning slice relocates it.
 */
export const committedSpecs: ReadonlyArray<
  { readonly dir: string; readonly spec: PluginScaffoldManifestSpec }
> = [
  { dir: 'auth', spec: authSpec },
];
