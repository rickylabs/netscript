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

/** Spec reproducing `plugins/workers/scaffold.plugin.json`. */
export const workersSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-workers',
  displayName: 'Background Worker',
  description:
    'NetScript plugin for background job scheduling, task execution, and worker API endpoints.',
  capabilities: {
    hasDatabaseMigrations: true,
    hasRoutes: true,
    hasBackgroundWorkers: true,
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
    kind: 'worker',
    displayName: 'Background Worker',
    category: 'background-processor',
    portRangeKey: 'INFRA_PLUGIN',
    defaultPermissions: [
      '--unstable-kv',
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-run',
    ],
    watchFlag: '--watch',
    defaultEntrypoint: 'bin/combined.ts',
    defaultServiceEntrypoint: 'services/src/main.ts',
    defaultRequiresDb: true,
    defaultRequiresKv: true,
    pluginType: 'background-processor',
    supportsConcurrency: true,
    concurrencyEnvVar: 'WORKER_CONCURRENCY',
    defaultConcurrency: 2,
    defaultTelemetry: true,
    infrastructureRequires: ['kv'],
    infrastructureOptionalDeps: ['db'],
  },
  officialSource: {
    canonicalName: 'workers',
    pluginDir: 'workers',
    backgroundDir: 'workers',
    serviceEntrypoint: 'services/src/main.ts',
    backgroundEntrypoint: 'bin/combined.ts',
    serviceConfigKey: 'workers-api',
    servicePort: 8091,
    backgroundPort: 8091,
    dependencies: ['streams'],
    requiresDb: true,
    requiresKv: true,
    permissions: [
      '--unstable-kv',
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-run',
    ],
    pluginReferences: [],
  },
};

/** Spec reproducing `plugins/streams/scaffold.plugin.json`. */
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

/** Spec reproducing `plugins/sagas/scaffold.plugin.json`. */
export const sagasSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-sagas',
  displayName: 'Saga Orchestrator',
  description:
    'NetScript plugin for durable saga orchestration, workflow APIs, and saga runtime metadata.',
  capabilities: {
    hasDatabaseMigrations: true,
    hasRoutes: true,
    hasBackgroundWorkers: true,
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
    kind: 'saga',
    displayName: 'Saga Orchestrator',
    category: 'background-processor',
    portRangeKey: 'INFRA_PLUGIN',
    defaultPermissions: ['--unstable-kv', '--allow-all'],
    watchFlag: '--watch',
    defaultEntrypoint: 'bin/combined.ts',
    defaultServiceEntrypoint: 'services/src/main.ts',
    defaultRequiresDb: true,
    defaultRequiresKv: true,
    pluginType: 'background-processor',
    supportsConcurrency: true,
    concurrencyEnvVar: 'SAGA_CONCURRENCY',
    defaultConcurrency: 2,
    defaultTelemetry: true,
    infrastructureRequires: ['kv'],
    infrastructureOptionalDeps: ['db'],
  },
  officialSource: {
    canonicalName: 'sagas',
    pluginDir: 'sagas',
    backgroundDir: 'sagas',
    serviceEntrypoint: 'services/src/main.ts',
    backgroundEntrypoint: 'bin/combined.ts',
    serviceConfigKey: 'sagas-api',
    servicePort: 8092,
    backgroundPort: 8092,
    dependencies: ['streams'],
    requiresDb: true,
    requiresKv: true,
    permissions: ['--unstable-kv', '--allow-all'],
    pluginReferences: ['workers-api'],
  },
};

/** Spec reproducing `plugins/triggers/scaffold.plugin.json`. */
export const triggersSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-triggers',
  displayName: 'Trigger Processor',
  description:
    'NetScript plugin for trigger ingress, scheduling, file watching, and trigger runtime APIs.',
  capabilities: {
    hasDatabaseMigrations: true,
    hasRoutes: true,
    hasBackgroundWorkers: true,
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
    kind: 'trigger',
    displayName: 'Trigger Processor',
    category: 'background-processor',
    portRangeKey: 'INFRA_PLUGIN',
    defaultPermissions: ['--unstable-kv', '--allow-all'],
    watchFlag: '--watch',
    defaultEntrypoint: 'src/runtime/trigger-processor.ts',
    defaultServiceEntrypoint: 'services/src/main.ts',
    defaultRequiresDb: true,
    defaultRequiresKv: true,
    pluginType: 'background-processor',
    supportsConcurrency: true,
    concurrencyEnvVar: 'TRIGGER_CONCURRENCY',
    defaultConcurrency: 10,
    defaultTelemetry: true,
    infrastructureRequires: ['kv'],
    infrastructureOptionalDeps: ['db'],
  },
  officialSource: {
    canonicalName: 'triggers',
    pluginDir: 'triggers',
    backgroundDir: 'triggers',
    serviceEntrypoint: 'services/src/main.ts',
    backgroundEntrypoint: 'src/runtime/trigger-processor.ts',
    serviceConfigKey: 'triggers-api',
    servicePort: 8093,
    backgroundPort: 8093,
    dependencies: ['streams'],
    pluginReferences: ['workers-api'],
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

/** All five committed plugin specs keyed by directory name. */
export const committedSpecs: ReadonlyArray<
  { readonly dir: string; readonly spec: PluginScaffoldManifestSpec }
> = [
  { dir: 'workers', spec: workersSpec },
  { dir: 'streams', spec: streamsSpec },
  { dir: 'sagas', spec: sagasSpec },
  { dir: 'triggers', spec: triggersSpec },
  { dir: 'auth', spec: authSpec },
];
