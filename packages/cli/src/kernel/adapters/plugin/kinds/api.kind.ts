/**
 * @module infra/plugin/kinds/api
 *
 * API plugin provider defaults.
 */

import type { PluginKindProvider } from '../../../domain/plugin-kind.ts';

/** Immutable scaffolding defaults for HTTP API plugins. */
export const apiKindProvider: PluginKindProvider = Object.freeze(
  {
    kind: 'api',
    displayName: 'API Plugin',
    category: 'plugin',
    portRangeKey: 'PLUGIN_API',
    defaultPermissions: [
      '--allow-net',
      '--allow-env',
      '--allow-read',
    ],
    watchFlag: '--watch-hmr',
    defaultEntrypoint: 'src/main.ts',
    defaultServiceEntrypoint: 'src/main.ts',
    defaultRequiresDb: false,
    defaultRequiresKv: false,
    pluginType: 'utility',
    supportsConcurrency: false,
    concurrencyEnvVar: null,
    defaultConcurrency: null,
    defaultTelemetry: true,
    infrastructureRequires: [],
    infrastructureOptionalDeps: ['db', 'kv'],
  } as const satisfies PluginKindProvider,
);
