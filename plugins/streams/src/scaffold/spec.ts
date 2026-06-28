import type { PluginScaffoldManifestSpec } from '@netscript/plugin/scaffold';

/** Default streams service port used by scaffold metadata. */
export const STREAMS_SERVICE_PORT: number = 4437;

/** Static scaffold manifest data for the streams plugin. */
export const streamsScaffoldSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-streams',
  displayName: 'Durable Streams',
  description: 'Durable Streams service, CLI, Aspire, E2E, and scaffolding plugin for NetScript.',
  capabilities: {
    hasDatabaseMigrations: false,
    hasRoutes: true,
    hasBackgroundWorkers: false,
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
    servicePort: STREAMS_SERVICE_PORT,
    backgroundPort: STREAMS_SERVICE_PORT,
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
