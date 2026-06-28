import type { PluginScaffoldManifestSpec } from '@netscript/plugin/scaffold';

/** Default auth service port used by scaffold metadata. */
export const AUTH_SERVICE_PORT: number = 8094;

/** Static scaffold manifest data for the auth plugin. */
export const authScaffoldSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-auth',
  displayName: 'Auth',
  description:
    'NetScript plugin for a unified auth API, auth database schema, and auth session streams.',
  capabilities: {
    hasDatabaseMigrations: true,
    hasRoutes: true,
    hasBackgroundWorkers: false,
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
    servicePort: AUTH_SERVICE_PORT,
    backgroundPort: AUTH_SERVICE_PORT,
    requiresDb: true,
    requiresKv: true,
    permissions: ['--unstable-kv', '--allow-net', '--allow-env', '--allow-read'],
  },
};
