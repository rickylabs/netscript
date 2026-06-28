/**
 * Static data for the thin sagas plugin scaffolder.
 *
 * This module is data-only: the published manifest spec, the dependency specifier the userland glue
 * imports, and the sample-stub manifest mapping each text-imported stub to its workspace-relative
 * emit path. It contains no file I/O and no code generation. The sample stub contents are imported
 * as text via import attributes (`with { type: 'text' }`) — the repo's locked, JSR-safe asset
 * mechanism — so they ship as real, type-checked source inside `@netscript/plugin-sagas` and are
 * emitted verbatim, with no scaffold-time interpolation.
 *
 * @module
 */

import type { PluginScaffoldManifestSpec } from '@netscript/plugin/scaffold';
import sampleSagaSource from './stubs/user-registration-saga.ts' with { type: 'text' };
import sampleSagaConfigSource from './stubs/user-registration.config.ts' with { type: 'text' };
import sagasBarrelSource from './stubs/mod.ts' with { type: 'text' };

/**
 * Published JSR specifier of the sagas runtime core the emitted userland stubs import.
 *
 * The sample saga and its config reference this package (never the user's instance name), which is
 * what keeps the emitted stubs static and interpolation-free.
 */
export const SAGAS_RUNTIME_CORE_SPECIFIER = '@netscript/plugin-sagas-core';

/** Background workspace directory the sagas userland samples are emitted under. */
export const SAGAS_BACKGROUND_WORKSPACE = 'sagas';

/**
 * A single userland sample stub: its text content and the workspace-relative path it is written to.
 */
export interface SagasSampleStub {
  /** Workspace-relative path the stub is written to, using forward slashes. */
  readonly path: string;
  /** Full text content of the stub, imported from a real type-checked source. */
  readonly content: string;
}

/**
 * The complete set of user-owned sample stubs `plugin add sagas` emits.
 *
 * Order is the emission order: the two leaf samples first, then the barrel that re-exports them.
 * Every path lives under {@linkcode SAGAS_BACKGROUND_WORKSPACE} and contains no plugin source
 * (`services/`, `contracts/`, `src/runtime/`, `src/aspire/`, `bin/`, `database/`) — that all
 * resolves from the `@netscript/plugin-sagas` dependency.
 */
export const SAGAS_SAMPLE_STUBS: readonly SagasSampleStub[] = [
  {
    path: `${SAGAS_BACKGROUND_WORKSPACE}/user-registration-saga.ts`,
    content: sampleSagaSource,
  },
  {
    path: `${SAGAS_BACKGROUND_WORKSPACE}/user-registration.config.ts`,
    content: sampleSagaConfigSource,
  },
  { path: `${SAGAS_BACKGROUND_WORKSPACE}/mod.ts`, content: sagasBarrelSource },
];

/**
 * Version-independent specification of the published `plugins/sagas/scaffold.plugin.json`.
 *
 * Rendered to the committed manifest bytes by `buildScaffoldPluginJson(sagasManifestSpec, version)`;
 * the `version` and `@netscript/plugin` peer-dependency range are injected at build time.
 */
export const sagasManifestSpec: PluginScaffoldManifestSpec = {
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
