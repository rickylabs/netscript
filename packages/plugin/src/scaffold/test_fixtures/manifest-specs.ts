/**
 * Test-only manifest specs reproducing the five committed `scaffold.plugin.json` files.
 *
 * S2 moves each of these into its plugin package (`plugins/<kind>/src/scaffold/spec.ts`); for S1
 * they live here as fixtures so the byte-identity gate can prove `buildScaffoldPluginJson` matches
 * the committed bytes before the plugins are thinned.
 *
 * @module
 */

import type { PluginScaffoldManifestSpec } from '../manifest-spec.ts';

/** Build version pinned across the committed manifests under test. */
export const FIXTURE_VERSION = '0.0.1-alpha.12';

/**
 * Spec reproducing `plugins/streams/scaffold.plugin.json`.
 *
 * The workers, sagas, and triggers specs previously lived here too; S2a moved workers to
 * `plugins/workers/src/scaffold/spec.ts` (`workersManifestSpec`) and S2b moved sagas to
 * `plugins/sagas/src/scaffold/spec.ts` (`sagasManifestSpec`) and triggers to
 * `plugins/triggers/src/scaffold/spec.ts` (`triggersManifestSpec`), where their own byte-identity
 * tests now own those manifests. The remaining specs are fixtures until S2b finishes thinning them.
 */
export const streamsSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-streams',
  displayName: 'Durable Streams',
  description: 'Durable Streams service, CLI, Aspire, E2E, and scaffolding plugin for NetScript.',
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
    kind: 'stream',
    displayName: 'Durable Streams',
    category: 'plugin',
    portRangeKey: 'PLUGIN_API',
    defaultPermissions: [
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-sys',
      '--allow-ffi',
    ],
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
    canonicalName: 'streams',
    pluginDir: 'streams',
    serviceEntrypoint: 'services/src/main.ts',
    serviceConfigKey: 'streams',
    servicePort: 4437,
    backgroundPort: 4437,
    requiresDb: false,
    requiresKv: false,
    permissions: [
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-sys',
      '--allow-ffi',
    ],
  },
};

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
 * Workers, sagas, and triggers are intentionally absent: S2a relocated workers and S2b relocated
 * sagas and triggers to `plugins/<kind>/src/scaffold/spec.ts`, where their byte-identity assertions
 * moved with them. The remaining specs stay here until S2b finishes thinning them.
 */
export const committedSpecs: ReadonlyArray<
  { readonly dir: string; readonly spec: PluginScaffoldManifestSpec }
> = [
  { dir: 'streams', spec: streamsSpec },
  { dir: 'auth', spec: authSpec },
];
